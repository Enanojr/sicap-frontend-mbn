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
    // console.log(` Página ${pageCount}: Cargando ${nextUrl}`); // <-- ELIMINADO

    try {
      const response: any = await api.get(nextUrl);
      const data = response.data;

      if (data.results && Array.isArray(data.results)) {
        allResults = [...allResults, ...data.results];
        nextUrl = data.next;

        /* <-- ELIMINADO
        console.log(
          `Página ${pageCount}: ${data.results.length} registros cargados (Total acumulado: ${allResults.length})`
        );
        */

        if (data.next) {
          // console.log(` Hay más páginas. Siguiente: ${data.next}`); // <-- ELIMINADO
        } else {
          /* <-- ELIMINADO
          console.log(
            ` Última página alcanzada. Total final: ${allResults.length} registros`
          );
          */
        }
      } else if (Array.isArray(data)) {
        /* <-- ELIMINADO
        console.log(
          ` Array directo: ${data.length} registros (sin paginación)`
        );
        */
        allResults = data;
        nextUrl = null;
      } else if (data.data && Array.isArray(data.data)) {
        // console.log(` Array en 'data': ${data.data.length} registros`); // <-- ELIMINADO
        allResults = data.data;
        nextUrl = null;
      } else {
        // console.warn(" Estructura de respuesta desconocida:", data); // <-- ELIMINADO
        nextUrl = null;
      }
    } catch (error) {
      // console.error(` Error en página ${pageCount}:`, error); // <-- ELIMINADO
      throw error;
    }
  }

  return allResults;
};

export const getPagos = async (): Promise<Pago[]> => {
  // console.log(" getPagos: Iniciando carga de TODOS los pagos..."); // <-- ELIMINADO

  const allPagos = await fetchAllPages<Pago>(PAGOS_URL);

  // console.log(` getPagos: Total de pagos obtenidos: ${allPagos.length}`); // <-- ELIMINADO

  const result = allPagos.map((p) => ({
    ...p,
    pagos_totales: Number(p.pagos_totales || 0),
  }));

  // console.log(" getPagos: Primeros 3 registros:", result.slice(0, 3)); // <-- ELIMINADO
  return result;
};

export const getHistorialPagos = async (): Promise<HistorialPago[]> => {
  // console.log(" getHistorialPagos: Iniciando carga de TODO el historial..."); // <-- ELIMINADO

  const allHistorial = await fetchAllPages<HistorialPago>(HISTORIAL_URL);

  /* <-- ELIMINADO
  console.log(
    ` getHistorialPagos: Total de pagos históricos obtenidos: ${allHistorial.length}`
  );
  */

  const result = allHistorial.map((h) => ({
    ...h,
    monto_recibido: Number(h.monto_recibido || 0),
    fecha_pago: normalizeFecha(h.fecha_pago),
  }));

  // console.log(" getHistorialPagos: Primeros 3 registros:", result.slice(0, 3)); // <-- ELIMINADO
  return result;
};

export const getContractData = async (): Promise<ContractSummary[]> => {
  // console.log(" getContractData: Iniciando carga completa de datos..."); // <-- ELIMINADO

  const [pagos, historial] = await Promise.all([
    getPagos(),
    getHistorialPagos(),
  ]);

  /* <-- ELIMINADO
  console.log(
    ` getContractData: Generando resumen de ${pagos.length} contratos con ${historial.length} pagos`
  );
  */

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

  /* <-- ELIMINADO
  console.log(
    ` getContractData: Resumen completo generado con ${result.length} contratos`
  );
  console.log(
    " getContractData: Muestra de datos:",
    result.slice(0, 3).map((c) => ({
      contrato: c.numero_contrato,
      nombre: c.nombre_completo,
      descuento: c.nombre_descuento,
      pagos: c.pagos.length,
      ultimo_pago: c.ultimo_pago,
    }))
  );
  */

  return result;
};