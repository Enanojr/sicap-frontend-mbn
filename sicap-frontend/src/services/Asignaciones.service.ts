import api from "../api_axios"; // Ajusta la ruta según tu estructura

const API_URL = "/asignaciones/"; // Ajusta la ruta según tu API

/**
 * Obtiene el token del administrador desde localStorage
 */
export interface AsignacionResponse {
  id_asignacion: number;
  fecha_asignacion: string;

  cobrador: {
    id_cobrador: number;
    nombre: string;
    apellidos: string;
    usuario: string;
    email: string;
    role: string;
  };

  sector: {
    id_sector: number;
    nombre_sector: string;
    descripcion: string;
  };
}

const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

/**
 * Registra una nueva asignación (solo admins)
 * @param asignacionData - Datos de la asignación a registrar
 * @returns Promise con el resultado del registro
 */
export const registerAsignacion = async (asignacionData: {
  cobrador: number;
  sector: number;
  fecha_asignacion: string; // Formato: 'YYYY-MM-DD'
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
      cobrador: asignacionData.cobrador,
      sector: asignacionData.sector,
      fecha_asignacion: asignacionData.fecha_asignacion,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en registerAsignacion:", error);

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
 * Obtiene todas las asignaciones
 * @returns Promise con la lista de asignaciones
 */
export const getAsignaciones = async () => {
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
    console.error("Error en getAsignaciones:", error);

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
          "Error al obtener las asignaciones. Por favor, intente nuevamente.",
      },
    };
  }
};

/**
 * Obtiene una asignación por su ID
 * @param id - ID de la asignación
 * @returns Promise con los datos de la asignación
 */
export const getAsignacionById = async (id: string | number) => {
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

    const response = await api.get(`${API_URL}${id}/`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getAsignacionById:", error);

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
          "Error al obtener la asignación. Por favor, intente nuevamente.",
      },
    };
  }
};

/**
 * Obtiene asignaciones por cobrador
 * @param cobradorId - ID del cobrador
 * @returns Promise con las asignaciones del cobrador
 */
export const getAsignacionesByCobrador = async (cobradorId: number) => {
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

    const response = await api.get(`${API_URL}?cobrador=${cobradorId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getAsignacionesByCobrador:", error);

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
          "Error al obtener las asignaciones. Por favor, intente nuevamente.",
      },
    };
  }
};

/**
 * Obtiene asignaciones por sector
 * @param sectorId - ID del sector
 * @returns Promise con las asignaciones del sector
 */
export const getAsignacionesBySector = async (sectorId: number) => {
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

    const response = await api.get(`${API_URL}?sector=${sectorId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en getAsignacionesBySector:", error);

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
          "Error al obtener las asignaciones. Por favor, intente nuevamente.",
      },
    };
  }
};
export const updateAsignacion = async (
  id: number,
  asignacionData: {
    cobrador: number;
    sector: number;
    fecha_asignacion: string;
  }
) => {
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

    const response = await api.put(`${API_URL}${id}/`, asignacionData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en updateAsignacion:", error);

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
          "Error al actualizar la asignación. Por favor, intente nuevamente.",
      },
    };
  }
};

export const deleteAsignacion = async (id: number) => {
  try {
    const token = getAdminToken();

    if (!token) {
      return {
        success: false,
        errors: {
          general: "No se encontró token. Por favor, inicie sesión.",
        },
      };
    }

    const response = await api.delete(`/asignaciones/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error en deleteAsignacion:", error);

    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data,
      };
    }

    return {
      success: false,
      errors: {
        general: "Error al eliminar la asignación.",
      },
    };
  }
};
