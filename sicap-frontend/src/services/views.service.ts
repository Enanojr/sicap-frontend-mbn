import api from "../../src/api_axios";

// Interfaces
export interface HistorialPago {
  id: number;
  numero_contrato: string;
  fecha_pago: string;
  monto_recibido: number | string;
  mes: string;
  anio: number;
}

export interface Pago {
  id: number;
  numero_contrato: string;
  nombre_completo: string;
  nombre_servicio: string;
  anio: number;
  pagos_totales: number | string;
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

// 🔥 FUNCIÓN QUE CARGA TODAS LAS PÁGINAS AUTOMÁTICAMENTE
const fetchAllPages = async <T>(url: string): Promise<T[]> => {
  let allResults: T[] = [];
  let nextUrl: string | null = url;
  let pageCount = 0;
  
  while (nextUrl) {
    pageCount++;
    console.log(`🔄 Página ${pageCount}: Cargando ${nextUrl}`);
    
    try {
      const response: any = await api.get(nextUrl);
      const data = response.data;
      
      // Estructura con paginación (Django REST Framework)
      if (data.results && Array.isArray(data.results)) {
        allResults = [...allResults, ...data.results];
        nextUrl = data.next; // URL de la siguiente página o null
        
        console.log(`✅ Página ${pageCount}: ${data.results.length} registros cargados (Total acumulado: ${allResults.length})`);
        
        if (data.next) {
          console.log(`➡️ Hay más páginas. Siguiente: ${data.next}`);
        } else {
          console.log(`🏁 Última página alcanzada. Total final: ${allResults.length} registros`);
        }
      } 
      // Array directo sin paginación
      else if (Array.isArray(data)) {
        console.log(`✅ Array directo: ${data.length} registros (sin paginación)`);
        allResults = data;
        nextUrl = null;
      }
      // Estructura con array en "data"
      else if (data.data && Array.isArray(data.data)) {
        console.log(`✅ Array en 'data': ${data.data.length} registros`);
        allResults = data.data;
        nextUrl = null;
      }
      else {
        console.warn("⚠️ Estructura de respuesta desconocida:", data);
        nextUrl = null;
      }
    } catch (error) {
      console.error(`❌ Error en página ${pageCount}:`, error);
      throw error;
    }
  }
  
  return allResults;
};

// Obtener TODOS los pagos (con paginación automática)
export const getPagos = async (): Promise<Pago[]> => {
  console.log("🔵 getPagos: Iniciando carga de TODOS los pagos...");
  
  const allPagos = await fetchAllPages<Pago>(PAGOS_URL);
  
  console.log(`🔵 getPagos: Total de pagos obtenidos: ${allPagos.length}`);
  
  const result = allPagos.map((p) => ({
    ...p,
    pagos_totales: Number(p.pagos_totales || 0),
  }));
  
  console.log("🔵 getPagos: Primeros 3 registros:", result.slice(0, 3));
  return result;
};

// Obtener TODO el historial (con paginación automática)
export const getHistorialPagos = async (): Promise<HistorialPago[]> => {
  console.log("🟢 getHistorialPagos: Iniciando carga de TODO el historial...");
  
  const allHistorial = await fetchAllPages<HistorialPago>(HISTORIAL_URL);
  
  console.log(`🟢 getHistorialPagos: Total de pagos históricos obtenidos: ${allHistorial.length}`);
  
  const result = allHistorial.map((h) => ({
    ...h,
    monto_recibido: Number(h.monto_recibido || 0),
  }));
  
  console.log("🟢 getHistorialPagos: Primeros 3 registros:", result.slice(0, 3));
  return result;
};

// Generar resumen de contratos
export const getContractData = async (): Promise<ContractSummary[]> => {
  console.log("🚀 getContractData: Iniciando carga completa de datos...");
  
  const [pagos, historial] = await Promise.all([getPagos(), getHistorialPagos()]);

  console.log(`📊 getContractData: Generando resumen de ${pagos.length} contratos con ${historial.length} pagos`);

  const result = pagos.map((contract) => {
    // Filtrar historial del contrato
    const pagosDelContrato = historial
      .filter((h) => h.numero_contrato === contract.numero_contrato)
      .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

    // Calcular monto total recibido
    const monto_total_recibido = pagosDelContrato.reduce((sum, p) => sum + Number(p.monto_recibido), 0);

    // Fechas
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

  console.log(`✅ getContractData: Resumen completo generado con ${result.length} contratos`);
  console.log("📋 getContractData: Muestra de datos:", 
    result.slice(0, 3).map(c => ({
      contrato: c.numero_contrato,
      nombre: c.nombre_completo,
      pagos: c.pagos.length,
      ultimo_pago: c.ultimo_pago
    }))
  );

  return result;
};
