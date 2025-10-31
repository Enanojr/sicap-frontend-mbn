import api from '../api_axios'; // Ajusta la ruta según tu estructura

const API_URL = "/cuentahabientes/"; // Ajusta la ruta según tu API

/**
 * Obtiene el token del administrador desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem('access');
};

/**
 * Registra un nuevo cuentahabiente (solo admins)
 * @param userData - Datos del cuentahabiente a registrar
 * @returns Promise con el resultado del registro
 */
export const registerCuentahabiente = async (userData: {
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
  calle: string;
  numero: number;
  telefono: string;
  colonia: number;
  servicio: number; // <--- CAMPO AÑADIDO
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
      numero_contrato: userData.numero_contrato,
      nombres: userData.nombres,
      ap: userData.ap,
      am: userData.am,
      calle: userData.calle,
      numero: userData.numero,
      telefono: userData.telefono,
      colonia: userData.colonia,
      servicio: userData.servicio, // <--- CAMPO AÑADIDO
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en registerCuentahabiente:', error);
    
    // Manejar errores de validación de la API
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
 * Obtiene todos los cuentahabientes
 * @returns Promise con la lista de cuentahabientes
 */
export const getCuentahabientes = async () => {
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
    console.error('Error en getCuentahabientes:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener los cuentahabientes. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene un cuentahabiente por su ID
 * @param id - ID del cuentahabiente
 * @returns Promise con los datos del cuentahabiente
 */
export const getCuentahabienteById = async (id: string | number) => {
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
    console.error('Error en getCuentahabienteById:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener el cuentahabiente. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene un cuentahabiente por su número de contrato
 * @param numeroContrato - Número de contrato del cuentahabiente
 * @returns Promise con los datos del cuentahabiente
 */
export const getCuentahabienteByContrato = async (numeroContrato: number) => {
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

    const response = await api.get(`${API_URL}?numero_contrato=${numeroContrato}`);

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en getCuentahabienteByContrato:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener el cuentahabiente. Por favor, intente nuevamente.'
      }
    };
  }
};