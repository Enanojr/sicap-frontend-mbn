import api from "../api_axios";
import Swal from "sweetalert2";
import { getToken, logout } from "./auth.service";

export interface DescuentoCreate {
  nombre_descuento: string;
  porcentaje: string;
  activo: boolean;
}

export interface DescuentoResponse {
  id_descuento: number;
  nombre_descuento: string;
  porcentaje: string;
  activo: boolean;
}

const DESCUENTOS_URL = "/descuentos/";

const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const createDescuento = async (
  data: DescuentoCreate
): Promise<DescuentoResponse> => {
  try {
    console.log(" Enviando descuento:", data);

    const response = await api.post(DESCUENTOS_URL, data, authHeaders());

    console.log(" Descuento creado exitosamente:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(" Error en createDescuento:", error);

    if (error.response?.status === 401 || error.response?.status === 403) {
      Swal.fire({
        icon: "error",
        title: "Sesión expirada",
        text: "Tu sesión ha caducado. Por favor, inicia sesión nuevamente.",
        confirmButtonColor: "#ef4444",
      });
      logout();
    } else if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al crear el descuento";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#ef4444",
      });
      throw new Error(message);
    }

    throw error;
  }
};

export const getAllDescuentos = async (): Promise<DescuentoResponse[]> => {
  try {
    const response = await api.get(DESCUENTOS_URL, authHeaders());
    return response.data;
  } catch (error: any) {
    console.error(" Error en getAllDescuentos:", error);
    throw error;
  }
};

export const getDescuentoById = async (
  id: number
): Promise<DescuentoResponse> => {
  try {
    const response = await api.get(`${DESCUENTOS_URL}${id}/`, authHeaders());
    return response.data;
  } catch (error: any) {
    console.error(" Error en getDescuentoById:", error);
    throw error;
  }
};

export const updateDescuento = async (
  id: number,
  data: Partial<DescuentoCreate>
): Promise<DescuentoResponse> => {
  try {
    const response = await api.put(
      `${DESCUENTOS_URL}${id}/`,
      data,
      authHeaders()
    );
    return response.data;
  } catch (error: any) {
    console.error(" Error en updateDescuento:", error);
    throw error;
  }
};

export const deleteDescuento = async (id: number): Promise<void> => {
  try {
    await api.delete(`${DESCUENTOS_URL}${id}/`, authHeaders());
  } catch (error: any) {
    console.error(" Error en deleteDescuento:", error);
    throw error;
  }
};
