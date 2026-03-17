import api from "../api_axios";

const API_URL = "/cuentahabientes/";

export interface CuentahabienteBase {
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
  calle: string;
  numero: number;
  telefono: string;
  colonia: number;
  servicio: number;
  es_toma_nueva?: boolean;
}

export interface CuentahabienteResponse extends CuentahabienteBase {
  id_cuentahabiente: number;
  deuda?: string;
  saldo_pendiente?: number;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  errors?: any;
}

const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

export const registerCuentahabiente = async (
  userData: CuentahabienteBase,
): Promise<ApiResult<CuentahabienteResponse>> => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general:
            "No se encontró token de administrador. Por favor, inicie sesión.",
        },
      };
    }

    const response = await api.post<CuentahabienteResponse>(API_URL, userData);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en registerCuentahabiente:", error);

    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al conectar con el servidor. Por favor, intente nuevamente.",
      },
    };
  }
};

export const createCuentahabiente = registerCuentahabiente;

export const updateCuentahabiente = async (
  id: number,
  userData: CuentahabienteBase,
): Promise<ApiResult<CuentahabienteResponse>> => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general:
            "No se encontró token de administrador. Por favor, inicie sesión.",
        },
      };
    }

    const response = await api.put<CuentahabienteResponse>(
      `${API_URL}${id}/`,
      userData,
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en updateCuentahabiente:", error);

    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al actualizar el cuentahabiente. Por favor, intente nuevamente.",
      },
    };
  }
};

export const deleteCuentahabiente = async (
  id: number,
): Promise<ApiResult<null>> => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general:
            "No se encontró token de administrador. Por favor, inicie sesión.",
        },
      };
    }

    await api.delete(`${API_URL}${id}/`);

    return {
      success: true,
      data: null,
    };
  } catch (error: any) {
    console.error("Error en deleteCuentahabiente:", error);

    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al eliminar el cuentahabiente. Por favor, intente nuevamente.",
      },
    };
  }
};

export const getCuentahabientes = async (
  url?: string,
): Promise<
  ApiResult<{
    count: number;
    next: string | null;
    previous: string | null;
    results: CuentahabienteResponse[];
  }>
> => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general:
            "No se encontró token de administrador. Por favor, inicie sesión.",
        },
      };
    }

    const endpoint = url ?? API_URL;

    const response = await api.get(endpoint);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getCuentahabientes:", error);

    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al obtener los cuentahabientes. Por favor, intente nuevamente.",
      },
    };
  }
};

export const getCuentahabientesList = async (
  page: number = 1
): Promise<
  ApiResult<{
    count: number;
    next: string | null;
    previous: string | null;
    results: CuentahabienteResponse[];
  }>
> => {
  try {
    // Construir la URL con el parámetro de paginación
    const paginatedUrl = `${API_URL}?page=${page}`;
    
    // Reutilizar la función getCuentahabientes que ya tienes arriba
    // la cual ya maneja los tokens y los errores correctamente.
    const response = await getCuentahabientes(paginatedUrl);

    if (!response.success || !response.data) {
       return {
         success: false,
         errors: response.errors || { general: "Error al cargar la página." }
       };
    }

    // Retornar la estructura completa (incluyendo next y previous)
    // para poder armar la paginación en el frontend
    return {
      success: true,
      data: response.data,
    };

  } catch (error) {
    console.error("Error obteniendo la página de cuentahabientes:", error);
    return {
      success: false,
      errors: { general: "Error fatal al solicitar los datos paginados." }
    };
  }
};

export const getCuentahabienteById = async (
  id: string | number,
): Promise<ApiResult<CuentahabienteResponse>> => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general:
            "No se encontró token de administrador. Por favor, inicie sesión.",
        },
      };
    }

    const response = await api.get<CuentahabienteResponse>(`${API_URL}${id}/`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getCuentahabienteById:", error);

    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al obtener el cuentahabiente. Por favor, intente nuevamente.",
      },
    };
  }
};

export const getCuentahabienteByContrato = async (
  numeroContrato: number,
): Promise<ApiResult<CuentahabienteResponse[]>> => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general:
            "No se encontró token de administrador. Por favor, inicie sesión.",
        },
      };
    }

    const response = await api.get(
      `${API_URL}?numero_contrato=${numeroContrato}`,
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getCuentahabienteByContrato:", error);

    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al obtener el cuentahabiente. Por favor, intente nuevamente.",
      },
    };
  }
};
