import api from "../api_axios"; // Ajusta la ruta según tu estructura

const API_URL = "/api/corte/generar/"; // Ajusta a tu endpoint real

// --- Interfaces ---

// 1. Lo que enviamos (Solo fechas)
export interface CorteCajaRequest {
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
}

// 2. Lo que recibimos (Respuesta del SQL)
export interface Movimiento {
  fecha_pago: string;      // Debe coincidir con el JSON
  usuario: string;         // Ojo: en minúscula, como llega en tu captura
  monto_recibido: number;  // Ojo: es monto_recibido, no "monto"
  cobrador: string;        // Agregamos el cobrador
  tipo: "Pago" | "Cargo";
}

export interface CorteInfo {
  folio_corte: number;
  fecha_generacion: string;
  cobrador_id_id: number;
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

/**
 * Obtiene el token desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

/**
 * Genera el corte de caja enviando solo el rango de fechas.
 * El backend infiere el cobrador_id desde el token.
 * @param corteData - Objeto con fecha_inicio y fecha_fin
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

    const response = await api.post(`${API_URL}`, {
      fecha_inicio: corteData.fecha_inicio,
      fecha_fin: corteData.fecha_fin
    }, {
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