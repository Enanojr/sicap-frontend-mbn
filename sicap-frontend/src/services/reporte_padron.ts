import api from "../api_axios";
import { getToken } from "./auth.service";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DetalleCargo {
  cargo: string;
  monto: number;
}

export interface PadronGeneralRawRow {
  id: number;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_usuario: string;
  tipo_servicio: string;
  saldo_pendiente: string | number;
  total_pagado_acumulado: string | number;
  detalle_cargos_json: string | null;
  anio_reporte: number;
  total_pagos_cobrados: string | number;
  total_cobros_cargos: string | number;
  total_pagos_pendientes: string | number;
  total_cargos_pendientes: string | number;
  total_usuarios: number;
}

export interface PadronGeneralRow {
  id: number;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_usuario: string;
  tipo_servicio: string;
  saldo_pendiente: number;
  total_pagado_acumulado: number;
  detalle_cargos: DetalleCargo[]; // ya parseado
  anio_reporte: number;
  total_pagos_cobrados: number;
  total_cobros_cargos: number;
  total_usuarios: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PADRON_GENERAL_URL = "/reporte-padron-general/";

const authHeaders = () => {
  const token = getToken();
  return {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
};

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const extractRows = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const parseDetalleCargos = (raw: string | null): DetalleCargo[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      cargo: String(item?.cargo ?? "").trim(),
      monto: toNumber(item?.monto),
    }));
  } catch {
    try {
      // Intento normalizando comillas simples o Python-style
      const normalized = raw
        .replace(/\bNone\b/g, "null")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/'/g, '"');
      const parsed = JSON.parse(normalized);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: any) => ({
        cargo: String(item?.cargo ?? "").trim(),
        monto: toNumber(item?.monto),
      }));
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
  saldo_pendiente: toNumber(raw.saldo_pendiente),
  total_pagado_acumulado: toNumber(raw.total_pagado_acumulado),
  detalle_cargos: parseDetalleCargos(raw.detalle_cargos_json),
  anio_reporte: raw.anio_reporte,
  total_pagos_cobrados: toNumber(raw.total_pagos_cobrados),
  total_cobros_cargos: toNumber(raw.total_cobros_cargos),
  total_usuarios: raw.total_usuarios,
});

// ── Fetch con paginación ──────────────────────────────────────────────────────

const fetchPadronGeneral = async (
  anio?: number,
): Promise<PadronGeneralRawRow[]> => {
  try {
    const params: Record<string, any> = {};
    if (typeof anio === "number") params.anio_reporte = anio;

    const allRows: PadronGeneralRawRow[] = [];
    let res = await api.get(PADRON_GENERAL_URL, { ...authHeaders(), params });
    let data = res.data;
    allRows.push(...extractRows<PadronGeneralRawRow>(data));

    while (data?.next) {
      const nextRes = await api.get(data.next, authHeaders());
      data = nextRes.data;
      allRows.push(...extractRows<PadronGeneralRawRow>(data));
    }

    return allRows;
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
