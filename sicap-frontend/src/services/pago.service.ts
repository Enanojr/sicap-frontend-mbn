// pagoService.ts
import api from "../../src/api_axios";
import Swal from "sweetalert2";

// Interfaces
export interface PagoCreate {
  ID_Descuento: number;
  ID_Cobrador: number;
  ID_Cuentahabiente: number;
  Fecha_pago: string;
  Monto_recibido: number;
  Monto_descuento: number;
  Mes: string;
  Anio: number;
}

export interface PagoResponse {
  ID_Pago: number;
  ID_Descuento: number;
  ID_Cobrador: number;
  ID_Cuentahabiente: number;
  Fecha_pago: string;
  Monto_recibido: number;
  Monto_descuento: number;
  Mes: string;
  Anio: number;
}

const PAGOS_URL = "/pago/"; // O "/api/pago/" según tu configuración

/**
 * Crear un nuevo pago
 */
export const createPago = async (data: PagoCreate): Promise<PagoResponse> => {
  try {
    console.log('📤 Enviando pago:', data);

    const response = await api.post(PAGOS_URL, data);

    console.log('✅ Pago creado exitosamente:', response.data);
    
    return response.data;

  } catch (error: any) {
    console.error('❌ Error en createPago:', error);
    
    // Manejo de errores específicos
    if (error.response) {
      const message = error.response.data?.detail 
        || error.response.data?.message 
        || 'Error al crear el pago';
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: '#ef4444',
      });
      
      throw new Error(message);
    }
    
    throw error;
  }
};

/**
 * Obtener todos los pagos
 */
export const getAllPagos = async (): Promise<PagoResponse[]> => {
  try {
    console.log('🔵 Obteniendo todos los pagos...');
    
    const response = await api.get(PAGOS_URL);
    
    console.log(`✅ ${response.data.length} pagos obtenidos`);
    return response.data;

  } catch (error: any) {
    console.error('❌ Error en getAllPagos:', error);
    throw error;
  }
};

/**
 * Obtener un pago por ID
 */
export const getPagoById = async (id: number): Promise<PagoResponse> => {
  try {
    const response = await api.get(`${PAGOS_URL}${id}/`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error en getPagoById:', error);
    throw error;
  }
};

/**
 * Actualizar un pago
 */
export const updatePago = async (
  id: number, 
  data: Partial<PagoCreate>
): Promise<PagoResponse> => {
  try {
    const response = await api.put(`${PAGOS_URL}${id}/`, data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error en updatePago:', error);
    throw error;
  }
};

/**
 * Eliminar un pago
 */
export const deletePago = async (id: number): Promise<void> => {
  try {
    await api.delete(`${PAGOS_URL}${id}/`);
  } catch (error: any) {
    console.error('❌ Error en deletePago:', error);
    throw error;
  }
};