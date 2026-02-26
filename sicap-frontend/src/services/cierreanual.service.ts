import api from '../api_axios';

// Definimos la ruta base para este módulo
const API_URL = "/cierre-anual";

/**
 * Paso 1: Obtiene un resumen de lo que implica el cierre anual.
 * @param data - Objeto con el año a cerrar y el nuevo año.
 * @returns Promise con el resumen o errores de validación.
 */
export const validarCierre = async (data: {
  anio_cierre: number;
  anio_nuevo: number;
}) => {
  try {
    // URL final: .../api/cierre-anual/
    const response = await api.post(`${API_URL}/`, {
      anio_cierre: data.anio_cierre,
      anio_nuevo: data.anio_nuevo
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en validarCierre:', error);

    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }

    return {
      success: false,
      errors: {
        general: 'Error al obtener el resumen del cierre. Verifique su conexión.'
      }
    };
  }
};

/**
 * Paso 2: Ejecuta la confirmación final del cierre anual.
 * Acción irreversible según la nueva metodología.
 * @param data - Objeto con los años para confirmar.
 * @returns Promise con el resultado del proceso de ejecución.
 */
export const confirmarCierre = async (data: {
  anio_cierre: number;
  anio_nuevo: number;
}) => {
  try {
    // URL final: .../api/cierre-anual/confirmar/
    // Se agrega el slash final para coincidir exactamente con la tabla
    const response = await api.post(`${API_URL}/confirmar/`, {
      anio_cierre: data.anio_cierre,
      anio_nuevo: data.anio_nuevo,
      confirmar: true 
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error: any) {
    console.error('Error en confirmarCierre:', error);

    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }

    return {
      success: false,
      errors: {
        general: 'Error crítico al ejecutar la confirmación del cierre anual.'
      }
    };
  }
};