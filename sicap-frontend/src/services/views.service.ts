import api from "../api_axios";
import { fetchAllPages, aRutaRelativa } from "./paginacion";

// Interfaces
export interface HistorialPago {
  id: number;
  numero_contrato: number;
  fecha_pago: string;
  monto_recibido: number | string;
  mes: string;
  anio: number;
  nombre_descuento: string;
  comentarios: string;
  cobrador: string;
}

export interface Pago {
  id: number;
  numero_contrato: number;
  nombre_completo: string;
  nombre_servicio: string;
  anio: number;
  pagos_totales: number | string;
  estatus_deuda: string;
  calle: string;
  saldo_pendiente: number | string;
  nombre_descuento: string;
  comentarios: string;
}

export interface ContractSummary extends Pago {
  pagos: HistorialPago[];
  monto_total_recibido: number;
  fecha_inicio: string;
  ultimo_pago: string;
  nombre_descuento: string;
  comentarios: string;
}

const PAGOS_URL = "/api/vista-pagos/";
const HISTORIAL_URL = "/api/vista-historial/";

const normalizeFecha = (fechaString: string): string => {
  if (!fechaString) return "";

  if (fechaString.includes("T")) {
    return fechaString.split("T")[0];
  }

  return fechaString;
};

// ── Paginación del lado del servidor (carga bajo demanda) ────────────────────
// La tabla principal necesita únicamente los campos de vista-pagos; el historial
// solo se usa en el modal, por eso se carga aparte y por contrato.

export interface PagosPagina {
  results: ContractSummary[];
  next: string | null;
  previous: string | null;
  count: number;
}

export interface FiltrosPagos {
  /** Si viene, se ignoran los demás filtros y se usa esta URL (next/previous). */
  url?: string;
  search?: string;
  anio?: string;
  estatus?: string;
  calle?: string;
  /** Número de página del servidor (DRF `?page=N`). */
  page?: number;
}

// Convierte una fila de vista-pagos en ContractSummary con historial vacío
// (el detalle se carga on-demand al abrir el modal).
const aContractSummary = (p: Pago): ContractSummary => ({
  ...p,
  pagos_totales: Number(p.pagos_totales || 0),
  saldo_pendiente: Number(p.saldo_pendiente || 0),
  pagos: [],
  monto_total_recibido: Number(p.pagos_totales || 0),
  fecha_inicio: "",
  ultimo_pago: "",
});

/**
 * Trae UNA página de vista-pagos. Si se pasa `url` (el next/previous de DRF),
 * la usa tal cual; si no, arma la query con los filtros. Los filtros se mandan
 * al backend: la búsqueda funciona seguro; año/estatus/calle son "best-effort"
 * (si el backend no los soporta, simplemente no filtran).
 */
export const getPagosPagina = async (
  filtros: FiltrosPagos = {},
): Promise<PagosPagina> => {
  let ruta: string;

  if (filtros.url) {
    ruta = aRutaRelativa(filtros.url);
  } else {
    const qs = new URLSearchParams();
    if (filtros.search?.trim()) qs.set("search", filtros.search.trim());
    if (filtros.anio && filtros.anio !== "all") qs.set("anio", filtros.anio);
    if (filtros.estatus && filtros.estatus !== "all")
      qs.set("estatus", filtros.estatus);
    if (filtros.calle?.trim()) qs.set("calle", filtros.calle.trim());
    if (filtros.page && filtros.page > 1) qs.set("page", String(filtros.page));
    const query = qs.toString();
    ruta = query ? `${PAGOS_URL}?${query}` : PAGOS_URL;
  }

  const res = await api.get(ruta);
  const data = res.data;

  // Respuesta sin paginar (array directo): se trata como una sola página.
  if (Array.isArray(data)) {
    return {
      results: data.map(aContractSummary),
      next: null,
      previous: null,
      count: data.length,
    };
  }

  return {
    results: (data.results ?? []).map(aContractSummary),
    next: data.next ?? null,
    previous: data.previous ?? null,
    count: typeof data.count === "number" ? data.count : 0,
  };
};

/**
 * Trae el historial de pagos de UN solo contrato (para el modal de detalle).
 * Filtra por número de contrato en el backend (search) y también en cliente,
 * por si el backend devuelve coincidencias parciales.
 */
export const getHistorialPorContrato = async (
  numeroContrato: number | string,
): Promise<HistorialPago[]> => {
  const rows = await fetchAllPages<HistorialPago>(
    `${HISTORIAL_URL}?search=${encodeURIComponent(String(numeroContrato))}`,
    { pageSize: 200 },
  );

  return rows
    .filter((h) => String(h.numero_contrato) === String(numeroContrato))
    .map((h) => ({
      ...h,
      monto_recibido: Number(h.monto_recibido || 0),
      fecha_pago: normalizeFecha(h.fecha_pago),
    }))
    .sort(
      (a, b) =>
        new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime(),
    );
};
