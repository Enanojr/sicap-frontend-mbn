import api from "../../src/api_axios";

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

const fetchAllPages = async <T>(url: string): Promise<T[]> => {
  let allResults: T[] = [];
  let nextUrl: string | null = url;
  let pageCount = 0;

  while (nextUrl) {
    pageCount++;

    try {
      const response: any = await api.get(nextUrl);
      const data = response.data;

      if (data.results && Array.isArray(data.results)) {
        allResults = [...allResults, ...data.results];
        nextUrl = data.next;

        if (data.next) {
        } else {
        }
      } else if (Array.isArray(data)) {
        allResults = data;
        nextUrl = null;
      } else if (data.data && Array.isArray(data.data)) {
        allResults = data.data;
        nextUrl = null;
      } else {
        nextUrl = null;
      }
    } catch (error) {
      throw error;
    }
  }

  return allResults;
};

export const getPagos = async (): Promise<Pago[]> => {
  const allPagos = await fetchAllPages<Pago>(PAGOS_URL);

  const result = allPagos.map((p) => ({
    ...p,
    pagos_totales: Number(p.pagos_totales || 0),
  }));

  return result;
};

export const getHistorialPagos = async (): Promise<HistorialPago[]> => {
  const allHistorial = await fetchAllPages<HistorialPago>(HISTORIAL_URL);

  const result = allHistorial.map((h) => ({
    ...h,
    monto_recibido: Number(h.monto_recibido || 0),
    fecha_pago: normalizeFecha(h.fecha_pago),
  }));

  return result;
};

export const getContractData = async (): Promise<ContractSummary[]> => {
  const [pagos, historial] = await Promise.all([
    getPagos(),
    getHistorialPagos(),
  ]);

  const result = pagos.map((contract) => {
    const pagosDelContrato = historial
      .filter(
        (h) => String(h.numero_contrato) === String(contract.numero_contrato)
      )
      .sort(
        (a, b) =>
          new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
      );

    const monto_total_recibido = pagosDelContrato.reduce(
      (sum, p) => sum + Number(p.monto_recibido),
      0
    );

    const fecha_inicio = pagosDelContrato.length
      ? normalizeFecha(pagosDelContrato[pagosDelContrato.length - 1].fecha_pago)
      : "";
    const ultimo_pago = pagosDelContrato.length
      ? normalizeFecha(pagosDelContrato[0].fecha_pago)
      : "";

    return {
      ...contract,
      pagos: pagosDelContrato,
      monto_total_recibido,
      fecha_inicio,
      ultimo_pago,
      nombre_descuento: contract.nombre_descuento,
    };
  });

  return result;
};
