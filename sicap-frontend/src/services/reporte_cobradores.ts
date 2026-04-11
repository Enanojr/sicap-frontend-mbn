import api from "../api_axios";
import { getToken } from "./auth.service";

export interface PagoDesglosado {
  fecha_pago: string | null;
  monto_recibido: number;
  monto_descuento: number;
  detalle_movimiento: string | null;
}

export interface EstadoCuentaNewRawRow {
  id: number;
  id_cobrador: number;
  nombre_cobrador: string;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  calle: string;
  servicio: string;
  saldo_pendiente_actualizado: string | number;
  deuda_actualizada: string;
  anio: number;
  tipo_movimiento: string;
  json_pagos: string | PagoDesglosado[];
}

export interface EstadoCuentaNewDetalleRow {
  id: number;
  id_cobrador: number;
  nombre_cobrador: string;
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  calle: string;
  servicio: string;
  saldo_pendiente_actualizado: number;
  deuda_actualizada: string;
  anio: number;
  tipo_movimiento: string;
  pago_index: number;
  fecha_pago: string | null;
  monto_recibido: number;
  monto_descuento: number;
  detalle_movimiento: string | null;
}

const ESTADO_CUENTA_NEW_URL = "/estado-cuenta-new/";

const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

/**
 * Tu backend está mandando json_pagos como string tipo:
 * "[{'fecha_pago': '2025-08-10', 'monto_recibido': 300, ... , 'detalle_movimiento': None}]"
 *
 * Eso NO es JSON válido.
 * Aquí lo normalizamos para poder parsearlo.
 */
const parseJsonPagos = (jsonPagos: unknown): PagoDesglosado[] => {
  if (!jsonPagos) return [];

  if (Array.isArray(jsonPagos)) {
    return jsonPagos.map((item) => ({
      fecha_pago: item?.fecha_pago ?? null,
      monto_recibido: toNumber(item?.monto_recibido),
      monto_descuento: toNumber(item?.monto_descuento),
      detalle_movimiento: item?.detalle_movimiento ?? null,
    }));
  }

  if (typeof jsonPagos !== "string") return [];

  try {
    // Intento directo por si algún día el backend ya manda JSON decente
    const parsed = JSON.parse(jsonPagos);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      fecha_pago: item?.fecha_pago ?? null,
      monto_recibido: toNumber(item?.monto_recibido),
      monto_descuento: toNumber(item?.monto_descuento),
      detalle_movimiento: item?.detalle_movimiento ?? null,
    }));
  } catch {
    try {
      // Normalización del pseudo-JSON que viene desde backend
      const normalized = jsonPagos
        .replace(/\bNone\b/g, "null")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/'/g, '"');

      const parsed = JSON.parse(normalized);

      if (!Array.isArray(parsed)) return [];

      return parsed.map((item) => ({
        fecha_pago: item?.fecha_pago ?? null,
        monto_recibido: toNumber(item?.monto_recibido),
        monto_descuento: toNumber(item?.monto_descuento),
        detalle_movimiento: item?.detalle_movimiento ?? null,
      }));
    } catch (error) {
      console.error("No se pudo parsear json_pagos:", jsonPagos, error);
      return [];
    }
  }
};

const fetchEstadoCuentaNew = async (
  idCobrador?: number,
): Promise<EstadoCuentaNewRawRow[]> => {
  try {
    const params =
      typeof idCobrador === "number" ? { id_cobrador: idCobrador } : {};
    const allRows: EstadoCuentaNewRawRow[] = [];

    // Primera petición
    let res = await api.get(ESTADO_CUENTA_NEW_URL, {
      ...authHeaders(),
      params,
    });

    let data = res.data;
    allRows.push(...extractRows<EstadoCuentaNewRawRow>(data));

    // Seguir paginando mientras haya "next"
    while (data?.next) {
      const nextRes = await api.get(data.next, authHeaders());
      data = nextRes.data;
      allRows.push(...extractRows<EstadoCuentaNewRawRow>(data));
    }

    return allRows;
  } catch (error: any) {
    console.error(
      "Error en fetchEstadoCuentaNew",
      error?.response?.data || error,
    );
    throw error;
  }
};

/**
 * Trae toda la información en bruto, sin desglosar pagos
 */
export const getEstadoCuentaNewGeneral = async (): Promise<
  EstadoCuentaNewRawRow[]
> => {
  return fetchEstadoCuentaNew();
};

/**
 * Trae la información en bruto filtrada por cobrador
 */
export const getEstadoCuentaNewByCobrador = async (
  idCobrador: number,
): Promise<EstadoCuentaNewRawRow[]> => {
  return fetchEstadoCuentaNew(idCobrador);
};

/**
 * Trae la información desglosada:
 * una fila por cada pago dentro de json_pagos
 *
 * - Si mandas idCobrador, filtra por cobrador
 * - Si no mandas nada, trae todo de forma masiva
 */
export const getEstadoCuentaNewDesglosado = async (
  idCobrador?: number,
): Promise<EstadoCuentaNewDetalleRow[]> => {
  try {
    const rows = await fetchEstadoCuentaNew(idCobrador);

    return rows.flatMap((row) => {
      const pagos = parseJsonPagos(row.json_pagos);

      const baseRow = {
        id: row.id,
        id_cobrador: row.id_cobrador,
        nombre_cobrador: row.nombre_cobrador,
        id_cuentahabiente: row.id_cuentahabiente,
        numero_contrato: row.numero_contrato,
        nombre_cuentahabiente: row.nombre_cuentahabiente,
        calle: row.calle,
        servicio: row.servicio,
        saldo_pendiente_actualizado: toNumber(row.saldo_pendiente_actualizado),
        deuda_actualizada: row.deuda_actualizada,
        anio: row.anio,
        tipo_movimiento: row.tipo_movimiento,
      };

      // Si no trae pagos, igual regresamos una fila base
      if (!pagos.length) {
        return [
          {
            ...baseRow,
            pago_index: 1,
            fecha_pago: null,
            monto_recibido: 0,
            monto_descuento: 0,
            detalle_movimiento: null,
          },
        ];
      }

      return pagos.map((pago, index) => ({
        ...baseRow,
        pago_index: index + 1,
        fecha_pago: pago.fecha_pago,
        monto_recibido: toNumber(pago.monto_recibido),
        monto_descuento: toNumber(pago.monto_descuento),
        detalle_movimiento: pago.detalle_movimiento,
      }));
    });
  } catch (error: any) {
    console.error(
      "Error en getEstadoCuentaNewDesglosado",
      error?.response?.data || error,
    );
    throw error;
  }
};
