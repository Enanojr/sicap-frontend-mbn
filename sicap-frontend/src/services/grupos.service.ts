import api from "../api_axios";

const API_URL = "/equipos/";

export interface CalleDetalle {
  id_calle: number;
  nombre_calle: string;
}

export interface CobradorGrupo {
  id_cobrador: number;
  nombre?: string;
  apellidos?: string;
  nombre_completo?: string;
  telefono?: string;
  fecha_ingreso?: string | null;
}

export interface GrupoResponse {
  id_equipo: number;
  nombre_equipo: string;
  calle: number;
  calle_detalle?: CalleDetalle;
  fecha_asignacion: string;
  fecha_termino?: string | null;
  activo?: boolean | string | number;
  cobradores?: CobradorGrupo[];
}

export interface GrupoPayload {
  nombre_equipo: string;
  calle: number;
  fecha_asignacion: string;
  fecha_termino?: string | null;
  activo?: boolean;
  cobradores_ids: number[];
  fecha_ingreso_cobradores: string;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  errors?: any;
}

const getAdminToken = (): string | null => localStorage.getItem("access");

export const getGrupos = async (
  url?: string,
): Promise<ApiResult<GrupoResponse[] | any>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    const endpoint = url ?? API_URL;
    const response = await api.get(endpoint);

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getGrupos:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al obtener grupos." },
    };
  }
};

export const getGrupoById = async (
  id: number,
): Promise<ApiResult<GrupoResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    const response = await api.get(`${API_URL}${id}/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getGrupoById:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al obtener el grupo." },
    };
  }
};

export const createGrupo = async (
  payload: GrupoPayload,
): Promise<ApiResult<GrupoResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    const response = await api.post(API_URL, payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en createGrupo:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al crear el grupo." },
    };
  }
};

export const updateGrupo = async (
  id: number,
  payload: Partial<GrupoPayload>,
): Promise<ApiResult<GrupoResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    const response = await api.put(`${API_URL}${id}/`, payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en updateGrupo:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al actualizar el grupo.",
      },
    };
  }
};

export const deleteGrupo = async (id: number): Promise<ApiResult<null>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    await api.delete(`${API_URL}${id}/`);
    return { success: true, data: null };
  } catch (error: any) {
    console.error("Error en deleteGrupo:", error);
    return {
      success: false,
      errors: error.response?.data ?? {
        general: "Error al eliminar el grupo.",
      },
    };
  }
};
