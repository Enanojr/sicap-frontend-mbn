import api from '../api_axios';

const URL_CARGOS = '/cargos/';
const URL_PAGAR = '/pagar-cargo/';

export interface TipoCargoDetalle {
  id: number;
  nombre: string;
  monto: string;
}

export interface CargoResponse {
  id_cargo: number;
  cuentahabiente: number;
  cuentahabiente_nombre: string;
  tipo_cargo: number;
  tipo_cargo_detalle: TipoCargoDetalle;
  monto_cargo: number;
  saldo_restante_cargo: string;
  fecha_cargo: string;
  activo: boolean;
}

export interface CargoData {
  cuentahabiente: number | string;
  tipo_cargo: number | string;
  monto_cargo: number;
  fecha_cargo: string;
}

export interface PagoData {
  cuentahabiente_id: number | string;
  monto: number;
  fecha_pago: string;
}

export const getCargos = async (url?: string, search?: string) => {
  try {
    let endpoint = URL_CARGOS;

    if (url) {
      // Si ya viene con limit (next/prev de paginación), respetamos
      // Si no trae limit, lo añadimos para garantizar 20 registros
      endpoint = url.includes('limit=')
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}limit=20`;
    } else if (search) {
      endpoint = `${URL_CARGOS}?search=${encodeURIComponent(search)}&limit=20`;
    } else {
      endpoint = `${URL_CARGOS}?limit=20`;
    }

    const response = await api.get(endpoint);
    const rawData = response.data.results || response.data;

    const normalizedData = Array.isArray(rawData)
      ? rawData.map((cargo: any) => ({
          ...cargo,
          tipo_cargo_nombre: cargo.tipo_cargo_detalle?.nombre || 'N/A',
          monto_cargo:
            cargo.monto_cargo ||
            parseFloat(cargo.tipo_cargo_detalle?.monto || '0'),
        }))
      : [];

    return {
      success: true,
      data: response.data.results
        ? { ...response.data, results: normalizedData }
        : normalizedData,
    };
  } catch (error: any) {
    console.error('Error en getCargos:', error);
    return { success: false, errors: { general: 'Error al cargar cargos.' } };
  }
};

export const getCargosByUser = async (
  cuentahabienteId: number | string
): Promise<CargoResponse[]> => {
  try {
    const endpoint = `${URL_CARGOS}?cuentahabiente=${cuentahabienteId}&activo=true`;
    const response = await api.get(endpoint);
    const rawData = response.data.results || response.data;

    if (!Array.isArray(rawData)) return [];

    return rawData.filter(
      (cargo: CargoResponse) =>
        cargo.activo && parseFloat(cargo.saldo_restante_cargo) > 0
    );
  } catch (error: any) {
    console.error('Error en getCargosByUser:', error);
    return [];
  }
};

export const registrarCargo = async (data: CargoData) => {
  try {
    const payload = { ...data, tipo_cargo: Number(data.tipo_cargo) };
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