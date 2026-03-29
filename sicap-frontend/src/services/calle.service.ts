import api from "../api_axios";

const API_URL = "/calles/";

export interface CalleResponse {
  id_calle: number;
  nombre_calle: string;
  activo?: boolean | string | number;
}

export interface CallePayload {
  nombre_calle: string;
  activo?: boolean;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  errors?: any;
}

const getAdminToken = (): string | null => localStorage.getItem("access");

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

export const getCalles = async (
  url?: string,
): Promise<ApiResult<CalleResponse[] | any>> => {
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

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getCalles:", error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const getCalleById = async (
  id: number,
): Promise<ApiResult<CalleResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const response = await api.get(`${API_URL}${id}/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getCalleById:", error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const createCalle = async (
  payload: CallePayload,
): Promise<ApiResult<CalleResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const response = await api.post(API_URL, payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en createCalle:", error?.response?.data || error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const updateCalle = async (
  id: number,
  payload: Partial<CallePayload>,
): Promise<ApiResult<CalleResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    const response = await api.put(`${API_URL}${id}/`, payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en updateCalle:", error?.response?.data || error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};

export const deleteCalle = async (id: number): Promise<ApiResult<null>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return {
        success: false,
        errors: { general: "No se encontró token." },
      };
    }

    await api.delete(`${API_URL}${id}/`);
    return { success: true, data: null };
  } catch (error: any) {
    console.error("Error en deleteCalle:", error?.response?.data || error);
    return {
      success: false,
      errors: extractError(error),
    };
  }
};
