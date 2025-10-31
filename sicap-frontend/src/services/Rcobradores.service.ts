import api from '../api_axios'; // Ajusta la ruta según tu estructura

const API_URL = "/auth"; // O la ruta que uses para registro

/**
 * Obtiene el token del administrador desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem('access');
};

/**
 * Registra un nuevo usuario (solo admins)
 * @param userData - Datos del usuario a registrar
 * @returns Promise con el resultado del registro
 */
export const registerUser = async (userData: {
  nombre: string;
  apellidos: string;
  email: string;
  usuario: string;
  password: string;
  password2: string;
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

    const response = await api.post(`${API_URL}/signup/`, {
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      email: userData.email,
      usuario: userData.usuario,
      password: userData.password,
      password2: userData.password2
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en registerUser:', error);
    
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
 * Obtiene todos los cobradores
 * @returns Promise con la lista de cobradores
 */
export const getCobradores = async () => {
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

    const response = await api.get(`${API_URL}/cobradores/`);

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en getCobradores:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener los cobradores. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene un cobrador por su ID
 * @param id - ID del cobrador
 * @returns Promise con los datos del cobrador
 */
export const getCobradorById = async (id: string | number) => {
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

    const response = await api.get(`${API_URL}/users/${id}/`); // Ajusta el endpoint según tu API

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en getCobradorById:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener el cobrador. Por favor, intente nuevamente.'
      }
    };
  }
};