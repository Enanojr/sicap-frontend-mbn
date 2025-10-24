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

    // El interceptor de api_axios ya manejará el token automáticamente
    // si lo configuraste en tu api_axios
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
 * Verifica si el usuario actual tiene permisos de administrador
 * @returns boolean
 */
export const isAdmin = (): boolean => {
  const user = localStorage.getItem('usuario');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    // Ajusta según tu estructura de usuario
    return userData.is_admin === true || userData.rol === 'admin';
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene todos los usuarios (solo admins)
 * @returns Promise con la lista de usuarios
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get(`${API_URL}/users/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    return {
      success: false,
      errors: {
        general: 'Error al obtener la lista de usuarios.'
      }
    };
  }
};