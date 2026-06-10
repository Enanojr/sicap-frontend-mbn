import api from '../api_axios';

const API_URL = "/api";

/**
 * Interface para el tipo de datos de progreso
 */
export interface Progreso {
  numero_contrato: number;
  nombre: string;
  estatus: string;
  total: string;
  saldo: string;
  progreso: string;
}

/**
 * Interface para respuesta paginada
 */
interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Progreso[];
}

/**
 * Obtiene todos los registros de progreso (todas las páginas)
 * @returns Promise con la lista completa de progresos
 */
export const getAllProgresos = async () => {
  try {
    let allProgresos: Progreso[] = [];
    let nextUrl: string | null = `${API_URL}/vista-progreso/`;

    // Iterar a través de todas las páginas
    while (nextUrl) {
      const response: { data: PaginatedResponse } = await api.get<PaginatedResponse>(nextUrl);
      
      // Agregar los resultados de esta página
      allProgresos = [...allProgresos, ...response.data.results];
      
      // Obtener la siguiente URL
      nextUrl = response.data.next;
    }

    return {
      success: true,
      data: allProgresos,
      count: allProgresos.length
    };

  } catch (error: any) {
    console.error('Error obteniendo progresos:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener la lista de progresos. Por favor, intente nuevamente.'
      }
    };
  }
};

/**
 * Obtiene un registro de progreso específico por número de contrato
 * @param numeroContrato - Número de contrato del cuentahabiente
 * @returns Promise con los datos del progreso
 */
export const getProgresoByContrato = async (numeroContrato: number) => {
  try {
    const response = await api.get<Progreso>(`${API_URL}/vista-progreso/${numeroContrato}/`);
    
    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error obteniendo progreso:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }
    
    return {
      success: false,
      errors: {
        general: 'Error al obtener el progreso. Por favor, intente nuevamente.'
      }
    };
  }
};
