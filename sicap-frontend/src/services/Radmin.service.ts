import api from '../api_axios';

const API_URL = "/auth";

/**
 * Obtiene el token del administrador desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem('access');
};

/**
 * Registra un nuevo administrador o supervisor
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
  role: string;
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

    const response = await api.post(`${API_URL}/users/`, {
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      email: userData.email,
      usuario: userData.usuario,
      password: userData.password,
      password2: userData.password2,
      role: userData.role
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en registerUser:', error);
    
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
 * Verifica si el usuario actual tiene permisos de super administrador
 * @returns boolean
 */
export const isSuperAdmin = (): boolean => {
  const user = localStorage.getItem('usuario');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    return userData.is_superadmin === true || userData.role === 'superadmin';
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene todos los administradores y supervisores
 * @returns Promise con la lista de usuarios
 */
export const getAllAdmins = async () => {
  try {
    const response = await api.get(`${API_URL}/admins/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error obteniendo admins:', error);
    return {
      success: false,
      errors: {
        general: 'Error al obtener la lista de administradores.'
      }
    };
  }
};