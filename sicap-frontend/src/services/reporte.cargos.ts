import api from "../api_axios";
import { getToken } from "./auth.service";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ReporteCargosRawRow {
  id: number;
  id_cobrador: number;
  nombre_cobrador: string;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  calle: string;
  tipo_cargo: string;
  fecha_cargo: string | null;
  saldo_restante_cargo: string | number;
  estatus_cargo: string;
  fecha_pago: string | null;
  monto_recibido: string | number;
}

export interface ReporteCargosRow {
  id: number;
  id_cobrador: number;
  nombre_cobrador: string;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  calle: string;
  tipo_cargo: string;
  fecha_cargo: string | null;
  saldo_restante_cargo: number;
  estatus_cargo: string;
  fecha_pago: string | null;
  monto_recibido: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const REPORTE_CARGOS_URL = "/reporte-cargos/";

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

const formatFecha = (fecha?: string | null): string => {
  if (!fecha) return "—";
  const clean = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export { formatFecha };

const normalizeRow = (raw: ReporteCargosRawRow): ReporteCargosRow => ({
  id: raw.id,
  id_cobrador: raw.id_cobrador,
  nombre_cobrador: raw.nombre_cobrador?.trim() || "Sin nombre",
  id_cuentahabiente: raw.id_cuentahabiente,
  numero_contrato: raw.numero_contrato,
  nombre_cuentahabiente: raw.nombre_cuentahabiente?.trim() || "Sin nombre",
  calle: raw.calle?.trim() || "—",
  tipo_cargo: raw.tipo_cargo?.trim() || "—",
  fecha_cargo: raw.fecha_cargo,
  saldo_restante_cargo: toNumber(raw.saldo_restante_cargo),
  estatus_cargo: raw.estatus_cargo?.trim() || "—",
  fecha_pago: raw.fecha_pago,
  monto_recibido: toNumber(raw.monto_recibido),
});

// ── Fetch con paginación ──────────────────────────────────────────────────────

const fetchReporteCargos = async (
  anio?: number,
  idCobrador?: number,
): Promise<ReporteCargosRawRow[]> => {
  try {
    const params: Record<string, any> = {};
    if (typeof anio === "number") params.anio = anio;
    if (typeof idCobrador === "number") params.id_cobrador = idCobrador;

    const allRows: ReporteCargosRawRow[] = [];
    let res = await api.get(REPORTE_CARGOS_URL, { ...authHeaders(), params });
    let data = res.data;
    allRows.push(...extractRows<ReporteCargosRawRow>(data));

    while (data?.next) {
      const nextRes = await api.get(data.next, authHeaders());
      data = nextRes.data;
      allRows.push(...extractRows<ReporteCargosRawRow>(data));
    }

    return allRows;
  } catch (error: any) {
    console.error(
      "Error en fetchReporteCargos",
      error?.response?.data || error,
    );
    throw error;
  }
};

// ── Exportaciones públicas ────────────────────────────────────────────────────

/** Años disponibles globales (sin filtro de cobrador) */
export const getAniosReporteCargos = async (): Promise<number[]> => {
  const rows = await fetchReporteCargos();
  const years = [
    ...new Set(
      rows
        .map((r) => {
          if (!r.fecha_cargo) return NaN;
          return Number(r.fecha_cargo.split("-")[0]);
        })
        .filter((y) => !isNaN(y)),
    ),
  ].sort((a, b) => b - a);
  return years.length > 0 ? years : [new Date().getFullYear()];
};

/** Años disponibles para un cobrador específico */
export const getAniosReporteCargosByCobrador = async (
  idCobrador: number,
): Promise<number[]> => {
  const rows = await fetchReporteCargos(undefined, idCobrador);
  const years = [
    ...new Set(
      rows
        .map((r) => {
          if (!r.fecha_cargo) return NaN;
          return Number(r.fecha_cargo.split("-")[0]);
        })
        .filter((y) => !isNaN(y)),
    ),
  ].sort((a, b) => b - a);
  return years.length > 0 ? years : [new Date().getFullYear()];
};

/** Cargos filtrados por año (y opcionalmente cobrador) */
export const getReporteCargos = async (
  anio?: number,
  idCobrador?: number,
): Promise<ReporteCargosRow[]> => {
  const rows = await fetchReporteCargos(anio, idCobrador);
  return rows.map(normalizeRow);
};
