import api from "../api_axios";

const API_URL = "/api/corte/generar/";

// --- Interfaces ---

export interface CorteCajaRequest {
  fecha_inicio: string;
  fecha_fin: string;
  cobrador_id: number | null; // <-- Permite null para corte general
}

export interface Movimiento {
  fecha_pago: string;
  usuario: string;
  monto_recibido: number;
  cobrador: string;
  tipo: "Pago" | "Cargo";
}

export interface CorteInfo {
  folio_corte: number;
  fecha_generacion: string;
  cobrador_id_id: number | null; // <-- MODIFICACIÓN: Ahora acepta null según lo que responde tu API
  fecha_inicio: string;
  fecha_fin: string;
  total_pagos_normales: number;
  total_pagos_cargos: number;
  gran_total: number;
}

export interface CorteCajaResponse {
  corte_info: CorteInfo;
  movimientos: Movimiento[];
}

const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

/**
 * Genera el corte de caja enviando el rango de fechas y el cobrador seleccionado.
 * @param corteData - Objeto con fecha_inicio, fecha_fin y cobrador_id
 */
export const generarCorteCaja = async (corteData: CorteCajaRequest) => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general: "No se encontró token de sesión. Por favor, inicie sesión.",
        },
      };
    }

    // MODIFICACIÓN: Construimos el payload de forma dinámica.
    // Así, si cobrador_id es null, no lo mandamos en el JSON (igual que en tu captura).
    const payload: Record<string, any> = {
      fecha_inicio: corteData.fecha_inicio,
      fecha_fin: corteData.fecha_fin,
    };

    if (corteData.cobrador_id !== null) {
      payload.cobrador_id = corteData.cobrador_id;
    }

    const response = await api.post(API_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data as CorteCajaResponse,
    };

  } catch (error: any) {
    console.error("Error en generarCorteCaja:", error);

    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general: "Error al conectar con el servidor. Por favor, intente nuevamente.",
      },
    };
  }
};