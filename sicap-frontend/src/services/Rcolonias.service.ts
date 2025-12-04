import api from "../api_axios"; // Ajusta la ruta según tu estructura

const API_URL = "/colonias/"; // O la ruta que uses para registro

export interface ColoniaResponse {
  id_colonia: number;
  nombre_colonia: string;
  codigo_postal: string;
}

/**
 * Obtiene el token del administrador desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

/**
 * Registra una nueva colonia (solo admins)
 * @param userData - Datos de la colonia a registrar
 * @returns Promise con el resultado del registro
 */
export const registerUser = async (userData: {
  nombre_colonia: string;
  codigo_postal: string;
}) => {
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

    const response = await api.post(`${API_URL}`, {
      nombre_colonia: userData.nombre_colonia,
      codigo_postal: userData.codigo_postal,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en registerUser:", error);

    if (error.response && error.response.data) {
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

/**
 * Obtiene todas las colonias
 * @returns Promise con la lista de colonias
 */
export const getColonias = async () => {
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

    const response = await api.get(`${API_URL}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getColonias:", error);

    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general:
          "Error al obtener las colonias. Por favor, intente nuevamente.",
      },
    };
  }
};

export const getColoniaById = async (id: number | string) => {
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

    const response = await api.get(`/colonias/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getColoniaById:", error);

    return {
      success: false,
      errors: error.response?.data || {
        general: "Error al obtener la colonia.",
      },
    };
  }
};

export const updateColonia = async (id: number, coloniaData: any) => {
  try {
    const token = getAdminToken();

    const response = await api.put(`/colonias/${id}/`, coloniaData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      errors: error.response?.data || { general: "Error al actualizar." },
    };
  }
};
