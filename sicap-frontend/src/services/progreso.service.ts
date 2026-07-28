import api from '../api_axios';
import { fetchAllPages } from './paginacion';

const API_URL = "/api";

/**
 * Interface para el tipo de datos de progreso
 */
export interface Progreso {
  numero_contrato: number;
  nombre: string;
  estatus: string;
  anio_pago: number; // <-- ¡Este es el campo nuevo que vimos en Postman!
  total: string;
  saldo: string;
  progreso: string;
}

/**
 * Obtiene todos los registros de progreso (todas las páginas)
 * @returns Promise con la lista completa de progresos
 */
export const getAllProgresos = async () => {
  try {
    const allProgresos = await fetchAllPages<Progreso>(
      `${API_URL}/vista-progreso/`,
      { pageSize: 200 },
    );

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