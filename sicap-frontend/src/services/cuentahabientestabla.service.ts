import api from "../api_axios";

const API_URL = "/r-cuentahabientes/";

export interface RCuentahabienteViewRow {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombre: string;
  calle: string;
  nombre_colonia: string;
  telefono: string;

  saldo_pendiente: string;
  total_pagado: string;
  estatus: string;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  errors?: any;
}

const getAdminToken = (): string | null => localStorage.getItem("access");

export interface RCuentahabientesPagina {
  results: RCuentahabienteViewRow[];
  next: string | null;
  count: number;
}

/**
 * Trae UNA página del padrón (carga bajo demanda). La búsqueda va al backend
 * (`?search=`); `page_size=20` es una sugerencia (si el backend no lo respeta,
 * usa su tamaño por defecto). El token lo agrega el interceptor de axios.
 */
export const getRCuentahabientesPagina = async (opts: {
  page: number;
  search: string;
}): Promise<RCuentahabientesPagina> => {
  const qs = new URLSearchParams();
  if (opts.search?.trim()) qs.set("search", opts.search.trim());
  if (opts.page > 1) qs.set("page", String(opts.page));
  qs.set("page_size", "20");

  const response = await api.get(`/api${API_URL}?${qs.toString()}`);
  const data = response.data;

  if (Array.isArray(data)) {
    return { results: data, next: null, count: data.length };
  }

  return {
    results: data.results ?? [],
    next: data.next ?? null,
    count:
      typeof data.count === "number"
        ? data.count
        : (data.results?.length ?? 0),
  };
};

export const getRCuentahabientes = async (
  url?: string
): Promise<ApiResult<any>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    const endpoint = url ?? API_URL;
    const response = await api.get(endpoint);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getRCuentahabientes:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al obtener vista." },
    };
  }
};
