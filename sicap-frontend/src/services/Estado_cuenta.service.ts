import api from "../api_axios";
import { getToken } from "./auth.service";

export interface EstadoCuentaRow {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombre: string;
  direccion: string;
  telefono: string;
  saldo_pendiente: number;
  deuda: string;
  fecha_pago: string;
  monto_recibido: number;
  anio: number;
}

const ESTADO_CUENTA_URL = "/estado-cuenta/";

const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const getEstadosById = async (
  id: number
): Promise<EstadoCuentaRow[]> => {
  try {
    const res = await api.get(`${ESTADO_CUENTA_URL}`, {
      ...authHeaders(),
      params: { id_cuentahabiente: id },
    });

    // Si viene paginado:
    return res.data?.results ?? [];
  } catch (error: any) {
    console.error("Error en getEstadosById", error?.response?.data || error);
    throw error;
  }
};
