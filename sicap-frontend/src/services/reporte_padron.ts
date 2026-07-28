import { fetchAllPages } from "./paginacion";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DetalleCargo {
  nombre_cargo: string;
}

export interface DetalleAbonoCargo {
  monto_abonado: number;
  cargo_afectado: string;
}

export interface PadronGeneralRawRow {
  id: number;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_usuario: string;
  tipo_servicio: string;
  costo_servicio_anual: string | number;
  cantidad_abonos_servicio: number;
  total_pagado_servicio: string | number;
  detalle_cargos_activos_json: string | null;
  detalle_abonos_cargos_json: string | null;
  cantidad_pagos_cargos: number;
  total_pagado_cargos: string | number;
  total_pagado_general: string | number;
  anio_reporte: number;
  total_pagos_cobrados: string | number;
  total_cobros_cargos: string | number;
  total_pagos_pendientes: string | number;
  total_cargos_pendientes: string | number;
  total_recaudado_global: string | number;
  total_usuarios: number;
}

export interface PadronGeneralRow {
  id: number;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_usuario: string;
  tipo_servicio: string;
  // Servicio de agua
  costo_servicio_anual: number;
  cantidad_abonos_servicio: number;
  total_pagado_servicio: number;
  // Cargos
  detalle_cargos_activos: DetalleCargo[];
  detalle_abonos_cargos: DetalleAbonoCargo[];
  cantidad_pagos_cargos: number;
  total_pagado_cargos: number;
  // General
  total_pagado_general: number;
  anio_reporte: number;
  // Globales
  total_pagos_cobrados: number;
  total_cobros_cargos: number;
  total_pagos_pendientes: number;
  total_cargos_pendientes: number;
  total_recaudado_global: number;
  total_usuarios: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PADRON_GENERAL_URL = "/reporte-padron-general/";

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const parseJSON = <T>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    try {
      const normalized = raw
        .replace(/\bNone\b/g, "null")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/'/g, '"');
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
};

const normalizeRow = (raw: PadronGeneralRawRow): PadronGeneralRow => ({
  id: raw.id,
  id_cuentahabiente: raw.id_cuentahabiente,
  numero_contrato: raw.numero_contrato,
  nombre_usuario: raw.nombre_usuario?.trim() || "Sin nombre",
  tipo_servicio: raw.tipo_servicio?.trim() || "—",
  // Servicio de agua
  costo_servicio_anual: toNumber(raw.costo_servicio_anual),
  cantidad_abonos_servicio: raw.cantidad_abonos_servicio ?? 0,
  total_pagado_servicio: toNumber(raw.total_pagado_servicio),
  // Cargos
  detalle_cargos_activos: parseJSON<DetalleCargo>(
    raw.detalle_cargos_activos_json,
  ).map((item: any) => ({
    nombre_cargo: String(item?.nombre_cargo ?? "").trim(),
  })),
  detalle_abonos_cargos: parseJSON<DetalleAbonoCargo>(
    raw.detalle_abonos_cargos_json,
  ).map((item: any) => ({
    monto_abonado: toNumber(item?.monto_abonado),
    cargo_afectado: String(item?.cargo_afectado ?? "").trim(),
  })),
  cantidad_pagos_cargos: raw.cantidad_pagos_cargos ?? 0,
  total_pagado_cargos: toNumber(raw.total_pagado_cargos),
  // General
  total_pagado_general: toNumber(raw.total_pagado_general),
  anio_reporte: raw.anio_reporte,
  // Globales
  total_pagos_cobrados: toNumber(raw.total_pagos_cobrados),
  total_cobros_cargos: toNumber(raw.total_cobros_cargos),
  total_pagos_pendientes: toNumber(raw.total_pagos_pendientes),
  total_cargos_pendientes: toNumber(raw.total_cargos_pendientes),
  total_recaudado_global: toNumber(raw.total_recaudado_global),
  total_usuarios: raw.total_usuarios,
});

// ── Fetch con paginación ──────────────────────────────────────────────────────

const fetchPadronGeneral = async (
  anio?: number,
): Promise<PadronGeneralRawRow[]> => {
  try {
    const url =
      typeof anio === "number"
        ? `${PADRON_GENERAL_URL}?anio_reporte=${anio}`
        : PADRON_GENERAL_URL;
    // Descarga en paralelo; el token lo agrega el interceptor de axios.
    return await fetchAllPages<PadronGeneralRawRow>(url, { pageSize: 200 });
  } catch (error: any) {
    console.error(
      "Error en fetchPadronGeneral",
      error?.response?.data || error,
    );
    throw error;
  }
};

// ── Exportaciones públicas ────────────────────────────────────────────────────

export const getAniosPadronGeneral = async (): Promise<number[]> => {
  const rows = await fetchPadronGeneral();
  return [
    ...new Set(
      rows.map((r) => Number(r.anio_reporte)).filter((y) => !isNaN(y)),
    ),
  ].sort((a, b) => b - a);
};

export const getPadronGeneral = async (
  anio?: number,
): Promise<PadronGeneralRow[]> => {
  const rows = await fetchPadronGeneral(anio);
  return rows.map(normalizeRow);
};
