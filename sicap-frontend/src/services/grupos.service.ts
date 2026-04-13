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

const extractListData = <T>(data: any): T[] | any => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return data;
};

const extractError = (error: any) => {
  const responseData = error?.response?.data;

  if (!responseData) {
    return { general: "Error de conexión con el servidor." };
  }

  if (typeof responseData === "string") {
    return { general: responseData };
  }

  if (responseData.detail) {
    return { general: responseData.detail };
  }

  return responseData;
};

const normalizePayload = (
  payload: GrupoPayload | Partial<GrupoPayload>,
): GrupoPayload | Partial<GrupoPayload> => {
  const cleanPayload: Partial<GrupoPayload> = {
    ...payload,
  };

  if (cleanPayload.nombre_equipo !== undefined) {
    cleanPayload.nombre_equipo = String(cleanPayload.nombre_equipo).trim();
  }

  if (cleanPayload.calle !== undefined && cleanPayload.calle !== null) {
    cleanPayload.calle = Number(cleanPayload.calle);
  }

  if (cleanPayload.cobradores_ids !== undefined) {
    cleanPayload.cobradores_ids = Array.isArray(cleanPayload.cobradores_ids)
      ? cleanPayload.cobradores_ids.map((id) => Number(id))
      : [];
  }

  if ("fecha_termino" in cleanPayload) {
    cleanPayload.fecha_termino =
      cleanPayload.fecha_termino &&
      String(cleanPayload.fecha_termino).trim() !== ""
        ? cleanPayload.fecha_termino
        : null;
  }

  return cleanPayload;
};

export const getGrupos = async (
  url?: string,
): Promise<ApiResult<GrupoResponse[] | any>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const endpoint = url ?? API_URL;
    const response = await api.get(endpoint);

    return {
      success: true,
      data: extractListData<GrupoResponse>(response.data),
    };
  } catch (error: any) {
    console.error("Error en getGrupos:", error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const getGrupoById = async (
  id: number,
): Promise<ApiResult<GrupoResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const response = await api.get(`${API_URL}${id}/`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getGrupoById:", error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const createGrupo = async (
  payload: GrupoPayload,
): Promise<ApiResult<GrupoResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const cleanPayload = normalizePayload(payload) as GrupoPayload;

    console.log("Payload createGrupo:", cleanPayload);

    const response = await api.post(API_URL, cleanPayload);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en createGrupo:", error?.response?.data || error);
    return {
      success: false,
      errors: extractError(error),
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
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const cleanPayload = normalizePayload(payload);

    console.log("Payload updateGrupo:", cleanPayload);

    const response = await api.put(`${API_URL}${id}/`, cleanPayload);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en updateGrupo:", error?.response?.data || error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const deleteGrupo = async (id: number): Promise<ApiResult<null>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    await api.delete(`${API_URL}${id}/`);

    return {
      success: true,
      data: null,
    };
  } catch (error: any) {
    console.error("Error en deleteGrupo:", error?.response?.data || error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};
