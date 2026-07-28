import api from "../api_axios";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Tope de seguridad para no ciclar infinitamente si el backend
// devuelve un `next` que nunca termina.
const MAX_PAGINAS = 100;

// Cuántas páginas se piden a la vez. Bajo a propósito: el backend limita la
// tasa de peticiones (responde 429), así que un número pequeño evita gatillar
// ese límite. Los reintentos con backoff (ver api_axios.ts) cubren el resto.
const CONCURRENCIA = 3;

/**
 * DRF devuelve URLs absolutas en `next` (p. ej. https://backend.com/pago/?page=2).
 * Se convierte a ruta relativa para que la petición siempre pase por el
 * baseURL configurado (VITE_API_URL) sin importar en qué dominio viva el backend.
 */
export const aRutaRelativa = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) return url;
  const parsed = new URL(url);
  return parsed.pathname + parsed.search;
};

// Base ficticia para poder manipular query params de una ruta relativa.
const BASE_FICTICIA = "http://x";

/** Devuelve la ruta relativa con un query param fijado (lo agrega o reemplaza). */
const conParam = (rutaRelativa: string, nombre: string, valor: string): string => {
  const u = new URL(rutaRelativa, BASE_FICTICIA);
  u.searchParams.set(nombre, valor);
  return u.pathname + u.search;
};

/** Extrae el array de resultados de las 3 formas de respuesta que usa el backend. */
const extraerResultados = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
};

interface OpcionesFetchAll {
  /** Límite de páginas a recorrer (default 100). */
  maxPaginas?: number;
  /**
   * Pide páginas más grandes al backend para reducir el número de peticiones.
   * Solo tiene efecto si DRF tiene habilitado `page_size` como query param;
   * si no, el backend lo ignora sin error.
   */
  pageSize?: number;
  /**
   * Tiempo en ms que el resultado se sirve desde caché en memoria.
   * Útil para catálogos (descuentos, servicios) que se consultan en cada
   * montaje de formulario. Omitir para datos que deben estar siempre frescos.
   */
  cacheMs?: number;
}

interface EntradaCache {
  expira: number;
  promesa: Promise<unknown[]>;
}

const cache = new Map<string, EntradaCache>();

/**
 * Recorre todas las páginas de un endpoint paginado de DRF y devuelve la
 * lista completa. Acepta también respuestas sin paginar (array directo o
 * `{ data: [...] }`).
 *
 * Descarga la primera página, calcula cuántas faltan a partir de `count` y
 * las pide en paralelo (con concurrencia acotada). Así una carga que antes
 * eran N peticiones en fila pasa a ~N/6 tandas, mucho más rápida.
 */
export const fetchAllPages = async <T>(
  url: string,
  opciones?: OpcionesFetchAll,
): Promise<T[]> => {
  const clave = `${url}|ps=${opciones?.pageSize ?? ""}`;

  if (opciones?.cacheMs) {
    const entrada = cache.get(clave);
    if (entrada && entrada.expira > Date.now()) {
      return entrada.promesa as Promise<T[]>;
    }
    const promesa = fetchAllPagesSinCache<T>(url, opciones);
    // Se cachea la promesa (no el resultado) para que montajes simultáneos
    // compartan una sola petición en vuelo.
    cache.set(clave, { expira: Date.now() + opciones.cacheMs, promesa });
    promesa.catch(() => cache.delete(clave));
    return promesa;
  }

  return fetchAllPagesSinCache<T>(url, opciones);
};

const fetchAllPagesSinCache = async <T>(
  url: string,
  opciones?: OpcionesFetchAll,
): Promise<T[]> => {
  const maxPaginas = opciones?.maxPaginas ?? MAX_PAGINAS;

  const primeraUrl = opciones?.pageSize
    ? conParam(url, "page_size", String(opciones.pageSize))
    : url;

  const primera = await api.get(aRutaRelativa(primeraUrl));
  const data = primera.data;

  // Respuesta sin paginar: array directo o { data: [...] }.
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object" || !Array.isArray(data.results)) {
    return extraerResultados<T>(data);
  }

  const resultados: T[] = [...(data.results as T[])];
  const next: string | null = data.next ?? null;
  const count: number = typeof data.count === "number" ? data.count : 0;

  // Solo hay una página.
  if (!next) return resultados;

  const tamPagina = data.results.length || 1;

  // Genera las URLs de las páginas restantes según el esquema de paginación.
  const urlsRestantes = construirUrlsRestantes(
    primeraUrl,
    next,
    count,
    tamPagina,
    maxPaginas,
  );

  // Si no se pudo determinar el esquema, se recorre secuencialmente desde `next`.
  if (!urlsRestantes) {
    return recorrerSecuencial(resultados, next, maxPaginas);
  }

  const paginas = await descargarEnParalelo<T>(urlsRestantes, CONCURRENCIA);
  for (const pagina of paginas) resultados.push(...pagina);
  return resultados;
};

/**
 * A partir de la primera página y su `next`, deduce el esquema de paginación
 * (PageNumber `?page=` o LimitOffset `?limit=&offset=`) y devuelve las rutas
 * relativas de todas las páginas restantes. Devuelve null si no lo reconoce.
 */
const construirUrlsRestantes = (
  primeraUrl: string,
  next: string,
  count: number,
  tamPagina: number,
  maxPaginas: number,
): string[] | null => {
  const paramsNext = new URL(aRutaRelativa(next), BASE_FICTICIA).searchParams;
  const totalPaginas = Math.min(Math.ceil(count / tamPagina), maxPaginas);
  const urls: string[] = [];

  // PageNumberPagination: ?page=N
  if (paramsNext.has("page")) {
    for (let p = 2; p <= totalPaginas; p++) {
      urls.push(conParam(primeraUrl, "page", String(p)));
    }
    return urls;
  }

  // LimitOffsetPagination: ?limit=L&offset=O
  if (paramsNext.has("offset")) {
    const limit = Number(paramsNext.get("limit")) || tamPagina;
    for (let offset = limit; offset < count; offset += limit) {
      urls.push(
        conParam(conParam(primeraUrl, "limit", String(limit)), "offset", String(offset)),
      );
    }
    return urls;
  }

  return null;
};

/** Descarga una lista de URLs con un pool de tamaño `concurrencia`, preservando el orden. */
const descargarEnParalelo = async <T>(
  urls: string[],
  concurrencia: number,
): Promise<T[][]> => {
  const resultados: T[][] = new Array(urls.length);
  let indice = 0;

  const worker = async () => {
    while (indice < urls.length) {
      const i = indice++;
      const respuesta = await api.get(aRutaRelativa(urls[i]));
      resultados[i] = extraerResultados<T>(respuesta.data);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrencia, urls.length) },
    worker,
  );
  await Promise.all(workers);
  return resultados;
};

/** Fallback: recorre página por página siguiendo `next` (esquema desconocido). */
const recorrerSecuencial = async <T>(
  acumulado: T[],
  next: string,
  maxPaginas: number,
): Promise<T[]> => {
  let nextUrl: string | null = next;
  let pagina = 1; // ya se consumió la primera

  while (nextUrl && pagina < maxPaginas) {
    // Tipos explícitos para romper la circularidad de inferencia
    // (respuesta → data → nextUrl → respuesta).
    const respuesta: { data: unknown } = await api.get(aRutaRelativa(nextUrl));
    const data = respuesta.data as PaginatedResponse<T> | T[];
    acumulado.push(...extraerResultados<T>(data));
    nextUrl = Array.isArray(data) ? null : (data.next ?? null);
    pagina++;
  }

  return acumulado;
};
