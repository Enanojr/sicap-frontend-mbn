import api from "../api_axios";

const API_URL = "/r-cuentahabientes/";

export interface RCuentahabienteViewRow {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombre: string;
  calle: string;
  nombre_colonia: string;
  telefono: string;

  saldo_pendiente: string;
  total_pagado: string;
  estatus: string;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  errors?: any;
}

const getAdminToken = (): string | null => localStorage.getItem("access");

export const getRCuentahabientes = async (
  url?: string
): Promise<ApiResult<any>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No se encontró token." } };
    }

    const endpoint = url ?? API_URL;
    const response = await api.get(endpoint);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error en getRCuentahabientes:", error);
    return {
      success: false,
      errors: error.response?.data ?? { general: "Error al obtener vista." },
    };
  }
};
