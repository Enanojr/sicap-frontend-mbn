import api from '../api_axios';

const API_URL = "/api"; // Ajusta esta ruta según tu API

/**
 * Obtiene el token del administrador desde localStorage
 */
const getAdminToken = (): string | null => {
  return localStorage.getItem('access');
};

/**
 * Interface para el tipo de datos del deudor
 */
export interface Deudor {
  id_cuentahabiente: number;
  nombre_cuentahabiente: string;
  monto_total: number;
  estatus: string;
  nombre_colonia: string;
}

/**
 * Interface para respuesta paginada
 */
interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Deudor[];
}

/**
 * Obtiene todos los deudores (todas las páginas)
 * @returns Promise con la lista completa de deudores
 */
export const getAllDeudores = async () => {
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

    let allDeudores: Deudor[] = [];
    let nextUrl: string | null = `${API_URL}/vista-deudores/`;

    // Iterar a través de todas las páginas
    while (nextUrl) {
      const response: { data: PaginatedResponse } = await api.get<PaginatedResponse>(nextUrl);
      
      // Agregar los resultados de esta página
      allDeudores = [...allDeudores, ...response.data.results];
      
      // Obtener la siguiente URL
      nextUrl = response.data.next;
      
    }

    return {
      success: true,
      data: allDeudores,
      count: allDeudores.length
    };

  } catch (error: any) {
    console.error('Error obteniendo deudores:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener la lista de deudores. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene un deudor específico por ID
 * @param id - ID del cuentahabiente
 * @returns Promise con los datos del deudor
 */
export const getDeudorById = async (id: number) => {
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

    const response = await api.get<Deudor>(`${API_URL}/${id}/vista-deudor/`);
    
    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error obteniendo deudor:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener el deudor. Por favor, intente nuevamente.'
      }
    };
  }
};
