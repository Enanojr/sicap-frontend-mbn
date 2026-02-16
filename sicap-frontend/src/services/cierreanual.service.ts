import api from '../api_axios';

// Definimos la ruta base para este módulo
const API_URL = "/cierre-anual";

/**
 * Valida si es posible realizar el cierre anual (Paso 1).
 * Envía los años para verificar que no existan impedimentos.
 * * @param data - Objeto con el año a cerrar y el nuevo año.
 * @returns Promise con el resultado de la validación.
 */
export const validarCierre = async (data: {
  anio_cierre: number;
  anio_nuevo: number;
}) => {
  try {
    // La petición POST valida los datos antes de confirmar
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

    // Manejar errores de validación de la API (ej: "Este campo es requerido")
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    }

    return {
      success: false,
      errors: {
        general: 'Error al validar el cierre anual. Verifique su conexión.'
      }
    };
  }
};

/**
 * Ejecuta la confirmación del cierre anual (Paso 2).
 * Esta acción es irreversible y requiere la bandera de confirmar.
 * * @param data - Objeto con los años para confirmar.
 * @returns Promise con el resultado del proceso.
 */
export const confirmarCierre = async (data: {
  anio_cierre: number;
  anio_nuevo: number;
}) => {
  try {
    // La petición PUT ejecuta la acción final
    // URL final: .../api/cierre-anual/confirmar/
    const response = await api.put(`${API_URL}/confirmar/`, {
      anio_cierre: data.anio_cierre,
      anio_nuevo: data.anio_nuevo,
      confirmar: true // Enviamos el booleano requerido por el back
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
        general: 'Error crítico al ejecutar el cierre anual.'
      }
    };
  }
};