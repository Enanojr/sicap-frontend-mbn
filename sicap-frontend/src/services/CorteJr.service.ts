import api from "../api_axios";

const API_CORTE = "/api/corte";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface Movimiento {
  fecha_pago: string;
  usuario: string;
  monto_recibido: string | number;
  [key: string]: unknown;
}

export interface CorteData {
  folio_corte: number;
  fecha_generacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_pagos_normales: string;
  total_pagos_cargos: string;
  gran_total: string;
  cobrador: number;
  tesorero_nombre: string;
  pdf: string | null;
  validado: boolean;
  fecha_validacion: string | null;
  validado_por: number | null;
  validado_por_nombre: string | null;
}

export interface GenerarCortePayload {
  fecha_inicio: string;
  fecha_fin: string;
  cobrador_id: number;
}

export interface GenerarCorteResponse {
  corte: CorteData;
  movimientos: Movimiento[];
}

export interface UsuarioLocal {
  id_cobrador: number;
  nombre: string;
  apellidos: string;
  usuario: string;
  email: string;
  is_active: boolean;
  roles: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getToken = (): string | null => localStorage.getItem("access");

export const getUsuarioLocal = (): UsuarioLocal | null => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioLocal;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────

/**
 * Genera un corte de caja para el tesorero junior.
 * POST /api/corte/jr/generar/
 */
export const generarCorteJr = async (
  payload: GenerarCortePayload
): Promise<
  | { success: true; data: GenerarCorteResponse }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró sesión activa. Por favor, inicia sesión." },
      };
    }

    const response = await api.post<GenerarCorteResponse>(
      `${API_CORTE}/jr/generar/`,
      payload
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en generarCorteJr:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al conectar con el servidor. Por favor, intenta nuevamente.",
      },
    };
  }
};

/**
 * Obtiene el historial de cortes del tesorero junior.
 * GET /api/corte/jr/
 */
export const getHistorialCortes = async (): Promise<
  | { success: true; data: CorteData[] }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró sesión activa. Por favor, inicia sesión." },
      };
    }

    const response = await api.get<CorteData[]>(`${API_CORTE}/jr/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getHistorialCortes:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al obtener el historial de cortes.",
      },
    };
  }
};

/**
 * Obtiene el detalle de un corte por folio.
 * GET /api/corte/jr/{folio_corte}/
 */
export const getDetalleCorte = async (
  folio: number
): Promise<
  | { success: true; data: CorteData }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró sesión activa." },
      };
    }

    const response = await api.get<CorteData>(`${API_CORTE}/jr/${folio}/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getDetalleCorte:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al obtener el detalle del corte.",
      },
    };
  }
};

/**
 * Sube el PDF de comprobante de un corte.
 * PATCH /api/corte/jr/{folio}/pdf/
 */
export const subirPdfCorteJr = async (
  folio: number,
  archivo: File
): Promise<
  | { success: true;  data: CorteData }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró sesión activa." },
      };
    }

    const formData = new FormData();
    formData.append("pdf", archivo);

    const response = await api.patch<CorteData>(
      `/api/corte/jr/${folio}/pdf/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en subirPdfCorteJr:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al subir el PDF." },
    };
  }
};

/**
 * Valida un corte de caja.
 * PATCH /api/corte/jr/{folio}/validar/
 */
export const validarCorteJr = async (
  folio: number
): Promise<
  | { success: true;  data: CorteData }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró sesión activa." },
      };
    }

    const response = await api.patch<CorteData>(
      `/api/corte/jr/${folio}/validar/`
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en validarCorteJr:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al validar el corte." },
    };
  }
};