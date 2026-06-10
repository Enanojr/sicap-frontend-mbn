import api from "../api_axios";

const API_CORTE = "/api/corte";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface MovimientoSr {
  fecha_pago: string;
  usuario: string;
  monto_recibido: string | number;
  cobrador?: string;
  tipo?: string;
  [key: string]: unknown;
}

export interface CorteSrData {
  folio_corte: number;
  fecha_generacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_pagos_normales: string;
  total_pagos_cargos: string;
  gran_total: string;
  tesorero_sr: string;
  tesorero_sr_nombre: string;
  tesorero_jr: number;
  tesorero_jr_nombre: string;
  equipo: number;
  equipo_nombre: string;
  pdf: string | null;
  validado: boolean;
  fecha_validacion: string | null;
  validado_por: number | null;
  validado_por_nombre: string | null;
}

export interface GenerarCorteSrPayload {
  fecha_inicio: string; // "YYYY-MM-DD"
  fecha_fin: string; // "YYYY-MM-DD"
  nombre_equipo: string;
}

export interface GenerarCorteSrResponse {
  corte: CorteSrData;
  movimientos: MovimientoSr[];
}

// Usuario del localStorage
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
 * Genera un corte de caja para el tesorero senior.
 * POST /api/corte/sr/generar/
 */
export const generarCorteSr = async (
  payload: GenerarCorteSrPayload,
): Promise<
  | { success: true; data: GenerarCorteSrResponse }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: {
          general: "No se encontró sesión activa. Por favor, inicia sesión.",
        },
      };
    }

    const response = await api.post<GenerarCorteSrResponse>(
      `${API_CORTE}/sr/generar/`,
      payload,
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en generarCorteSr:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general:
          "Error al conectar con el servidor. Por favor, intenta nuevamente.",
      },
    };
  }
};

/**
 * Obtiene el historial de cortes del tesorero senior.
 * GET /api/corte/sr/
 */
export const getHistorialCortesSr = async (): Promise<
  | { success: true; data: CorteSrData[] }
  | { success: false; errors: Record<string, string> }
> => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        errors: {
          general: "No se encontró sesión activa. Por favor, inicia sesión.",
        },
      };
    }

    const response = await api.get<CorteSrData[]>(`${API_CORTE}/sr/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getHistorialCortesSr:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al obtener el historial de cortes.",
      },
    };
  }
};

/**
 * Obtiene el detalle de un corte senior por folio.
 * GET /api/corte/sr/{folio_corte}/
 */
export const getDetalleCorteSr = async (
  folio: number,
): Promise<
  | { success: true; data: CorteSrData }
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

    const response = await api.get<CorteSrData>(`${API_CORTE}/sr/${folio}/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getDetalleCorteSr:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al obtener el detalle del corte.",
      },
    };
  }
};

/**
 * Sube el PDF de comprobante de un corte senior.
 * PATCH /api/corte/sr/{folio}/pdf/
 */
export const subirPdfCorteSr = async (
  folio: number,
  archivo: File
): Promise<
  | { success: true;  data: CorteSrData }
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

    const response = await api.patch<CorteSrData>(
      `/api/corte/sr/${folio}/pdf/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en subirPdfCorteSr:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al subir el PDF." },
    };
  }
};

/**
 * Valida un corte de caja senior.
 * PATCH /api/corte/sr/{folio}/validar/
 */
export const validarCorteSr = async (
  folio: number
): Promise<
  | { success: true;  data: CorteSrData }
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

    const response = await api.patch<CorteSrData>(
      `/api/corte/sr/${folio}/validar/`
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en validarCorteSr:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al validar el corte." },
    };
  }
};