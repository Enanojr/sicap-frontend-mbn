import api from '../api_axios'; // Ajusta la ruta según tu estructura

const API_URL = "/sector/"; // O la ruta que uses para registro

/**
 * Obtiene el token del administrador desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem('access');
};

/**
 * Registra un nuevo sector (solo admins)
 * @param userData - Datos del sector a registrar
 * @returns Promise con el resultado del registro
 */
export const registerSector = async (userData: {
  nombre_sector: string;
  descripcion: string;
}) => {
  try {
    const token = getAdminToken();
    
    if (!token) {
      return {
        success: false,
        errors: {
          general: 'No se encontró token de administrador. Por favor, inicie sesión.'
        }
      };
    }

    const response = await api.post(`${API_URL}`, {
      nombre_sector: userData.nombre_sector,
      descripcion: userData.descripcion,
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en registerSector:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al conectar con el servidor. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene todos los sectores
 * @returns Promise con la lista de sectores
 */
export const getSectores = async () => {
  try {
    const token = getAdminToken();
    
    if (!token) {
      return {
        success: false,
        errors: {
          general: 'No se encontró token de administrador. Por favor, inicie sesión.'
        }
      };
    }

    const response = await api.get(`${API_URL}`);

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en getSectores:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener los sectores. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene un sector por su ID
 * @param id - ID del sector
 * @returns Promise con los datos del sector
 */
export const getSectorById = async (id: string | number) => {
  try {
    const token = getAdminToken();
    
    if (!token) {
      return {
        success: false,
        errors: {
          general: 'No se encontró token de administrador. Por favor, inicie sesión.'
        }
      };
    }

    const response = await api.get(`${API_URL}${id}/`);

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en getSectorById:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener el sector. Por favor, intente nuevamente.'
      }
    };
  }
};