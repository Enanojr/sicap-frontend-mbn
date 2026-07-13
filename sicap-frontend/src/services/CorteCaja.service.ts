import api from "../api_axios";

const API_URL = "/api/corte/generar/";

export interface CorteCajaRequest {
  fecha_inicio: string;
  fecha_fin: string;
  cobrador_id: number | null; 
}

export interface Movimiento {
  fecha_pago: string;
  usuario: string;
  monto_recibido: number;
  cobrador: string;
  tipo: "Pago" | "Cargo"; // <-- Solo esto es necesario para identificar
}

export interface CorteInfo {
  folio_corte: number;
  fecha_generacion: string;
  cobrador_id_id: number | null; 
  fecha_inicio: string;
  fecha_fin: string;
  total_pagos_normales: number;
  total_pagos_cargos: number;
  gran_total: number;
}

export interface CorteCajaResponse {
  corte_info: CorteInfo;
  movimientos: Movimiento[]; // <-- Volvemos al arreglo unificado
}

const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

export const generarCorteCaja = async (corteData: CorteCajaRequest) => {
  try {
    const token = getAdminToken();

    if (!token) {
      return { success: false, errors: { general: "No se encontró token de sesión." }};
    }

    const payload: Record<string, any> = {
      fecha_inicio: corteData.fecha_inicio,
      fecha_fin: corteData.fecha_fin,
    };

    if (corteData.cobrador_id !== null) {
      payload.cobrador_id = corteData.cobrador_id;
    }

    const response = await api.post(API_URL, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      data: response.data as CorteCajaResponse,
    };

  } catch (error: any) {
    console.error("Error en generarCorteCaja:", error);
    if (error.response && error.response.data) {
      return { success: false, errors: error.response.data };
    }
    return { success: false, errors: { general: "Error al conectar con el servidor." }};
  }
};