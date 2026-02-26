import api from '../api_axios';

// URLs base
const URL_CARGOS = '/cargos/';
const URL_PAGAR = '/pagar-cargo/';

// --- INTERFACES ACTUALIZADAS ---

export interface TipoCargoDetalle {
  id: number;
  nombre: string;
  monto: string; // Viene como string "400.00" según la imagen
}

export interface CargoResponse {
  id_cargo: number;
  cuentahabiente: number; 
  cuentahabiente_nombre: string;
  tipo_cargo: number; // El ID que mencionaste
  tipo_cargo_detalle: TipoCargoDetalle; // El nuevo objeto detallado
  monto_cargo: number; // Monto original (si el back lo envía)
  saldo_restante_cargo: string;
  fecha_cargo: string;
  activo: boolean;
}

export interface CargoData {
  cuentahabiente: number | string;
  tipo_cargo: number | string; // Enviamos el ID
  monto_cargo: number;
  fecha_cargo: string;
}

export interface PagoData {
  cuentahabiente_id: number | string;
  monto: number;
}

// --- FUNCIONES ---

/**
 * Obtiene los cargos paginados y normaliza los datos.
 */
export const getCargos = async (url?: string, search?: string) => {
  try {
    let endpoint = URL_CARGOS;

    if (url) {
        endpoint = url;
    } else if (search) {
        endpoint = `${URL_CARGOS}?search=${encodeURIComponent(search)}`;
    }

    const response = await api.get(endpoint);
    
    // Normalización de datos:
    // Extraemos los resultados tanto si vienen en 'results' (paginado) como si es array directo.
    const rawData = response.data.results || response.data;
    
    const normalizedData = Array.isArray(rawData) ? rawData.map((cargo: any) => ({
        ...cargo,
        // Usamos el nombre del detalle para que la tabla muestre "Carnitas" en vez de "6"
        tipo_cargo_nombre: cargo.tipo_cargo_detalle?.nombre || 'N/A',
        // Aseguramos que el monto sea numérico para cálculos o formato
        monto_cargo: cargo.monto_cargo || parseFloat(cargo.tipo_cargo_detalle?.monto || '0'),
    })) : [];

    // Reconstruimos la respuesta manteniendo la estructura de paginación si existe
    return { 
      success: true, 
      data: response.data.results ? { ...response.data, results: normalizedData } : normalizedData
    };

  } catch (error: any) {
    console.error("Error en getCargos:", error);
    return { success: false, errors: { general: 'Error al cargar cargos.' } };
  }
};

export const registrarCargo = async (data: CargoData) => {
  try {
    // Aseguramos que tipo_cargo se envíe como número si es necesario
    const payload = {
        ...data,
        tipo_cargo: Number(data.tipo_cargo)
    };
    const response = await api.post(URL_CARGOS, payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return { success: false, errors: error.response.data };
    }
    return { success: false, errors: { general: 'Error al registrar el cargo.' } };
  }
};

export const pagarCargo = async (data: PagoData) => {
  try {
    const response = await api.post(URL_PAGAR, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return { success: false, errors: error.response.data };
    }
    return { success: false, errors: { general: 'Error al procesar el pago.' } };
  }
};