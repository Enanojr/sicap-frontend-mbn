import api from "../api_axios";
import { getToken } from "./auth.service";

export interface VistaCargosRow {
  id_vista: number;
  id_cargo: number;
  cuentahabiente_id: number;
  tipo_cargo_nombre: string;
  cargo_fecha: string;
  anio_cargo: number;
  saldo_restante_cargo: number;
  cargo_activo: boolean;
  desglose_pagos: string;
}

const VISTA_CARGOS_URL = "/vista-cargos/";

const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const getVistaCargosById = async (
  id: number,
): Promise<VistaCargosRow[]> => {
  try {
    const res = await api.get(VISTA_CARGOS_URL, {
      ...authHeaders(),
      params: { cuentahabiente_id: id },
    });

    if (Array.isArray(res.data)) return res.data;
    return res.data?.results ?? [];
  } catch (error: any) {
    console.error(
      "Error en getVistaCargosById",
      error?.response?.data || error,
    );
    throw error;
  }
};
