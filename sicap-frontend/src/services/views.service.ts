import api from "../../src/api_axios";

// Interfaces
export interface HistorialPago {
  id: number;
  numero_contrato: string;
  fecha_pago: string;
  monto_recibido: number | string; // backend puede enviar string
  mes: string;
  anio: number;
}

export interface Pago {
  id: number;
  numero_contrato: string;
  nombre_completo: string;
  nombre_servicio: string;
  anio: number;
  pagos_totales: number | string; // backend puede enviar string
  estatus_deuda: string;
}

export interface ContractSummary extends Pago {
  pagos: HistorialPago[];
  monto_total_recibido: number;
  fecha_inicio: string;
  ultimo_pago: string;
}

// URLs de la API
const PAGOS_URL = "/api/vista-pagos/";
const HISTORIAL_URL = "/api/vista-historial/";

// Helper: asegura que siempre devolvemos un array
const normalizeArray = <T>(responseData: any): T[] => {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
  if (responseData?.results && Array.isArray(responseData.results)) return responseData.results;
  console.warn("normalizeArray: no se encontró un array, se devuelve []", responseData);
  return [];
};

// Obtener pagos
export const getPagos = async (): Promise<Pago[]> => {
  const response = await api.get(PAGOS_URL);
  return normalizeArray<Pago>(response.data).map((p) => ({
    ...p,
    pagos_totales: Number(p.pagos_totales || 0),
  }));
};

// Obtener historial
export const getHistorialPagos = async (): Promise<HistorialPago[]> => {
  const response = await api.get(HISTORIAL_URL);
  return normalizeArray<HistorialPago>(response.data).map((h) => ({
    ...h,
    monto_recibido: Number(h.monto_recibido || 0),
  }));
};

// Generar resumen de contratos
export const getContractData = async (): Promise<ContractSummary[]> => {
  const [pagos, historial] = await Promise.all([getPagos(), getHistorialPagos()]);

  return pagos.map((contract) => {
    // Filtrar historial del contrato y convertir montos a número
    const pagosDelContrato = historial
      .filter((h) => h.numero_contrato === contract.numero_contrato)
      .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

    // Calcular monto total recibido
    const monto_total_recibido = pagosDelContrato.reduce((sum, p) => sum + Number(p.monto_recibido), 0);

    // Fechas seguras
    const fecha_inicio = pagosDelContrato.length
      ? pagosDelContrato[pagosDelContrato.length - 1].fecha_pago
      : "";
    const ultimo_pago = pagosDelContrato.length ? pagosDelContrato[0].fecha_pago : "";

    return {
      ...contract,
      pagos: pagosDelContrato,
      monto_total_recibido,
      fecha_inicio,
      ultimo_pago,
    };
  });
};
