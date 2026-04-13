import api from "../api_axios";
import { getToken } from "./auth.service";

export interface EstadoCuentaResumenRow {
  id_cuentahabiente: number;
  numero_contrato: number;
  anio: number;
  nombre_servicio: string;
  estatus: string;
  saldo_pendiente: number;
}

const ESTADO_CUENTA_RESUMEN_URL = "/estado-cuenta-resumen/";

const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const getEstadoCuentaResumenById = async (
  id: number,
): Promise<EstadoCuentaResumenRow[]> => {
  try {
    const res = await api.get(`${ESTADO_CUENTA_RESUMEN_URL}`, {
      ...authHeaders(),
      params: { id_cuentahabiente: id },
    });

    if (Array.isArray(res.data)) return res.data;
    return res.data?.results ?? [];
  } catch (error: any) {
    console.error(
      "Error en getEstadoCuentaResumenById",
      error?.response?.data || error,
    );
    throw error;
  }
};
