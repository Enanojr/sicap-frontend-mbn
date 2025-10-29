
import api from "../api_axios";
import Swal from "sweetalert2";
import { getToken, logout } from "./auth.service";


export interface ServicioCreate {
  id_tipo_servicio: number;
  nombre: string;
  costo: number; 
}

export interface ServicioResponse {
  id_servicio?: number;
  id_tipo_servicio: number;
  nombre: string;
  costo: number; 
}

const SERVICIOS_URL = "/servicios/";


const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};


export const createServicio = async (data: ServicioCreate): Promise<ServicioResponse> => {
  try {
    console.log("Enviando servicio:", data);
    console.log(" URL:", SERVICIOS_URL);
    console.log("Headers:", authHeaders());

    const response = await api.post(SERVICIOS_URL, data, authHeaders());

    console.log(" Servicio creado exitosamente:", response.data);
    return response.data;

  } catch (error: any) {
    console.error(" Error en createServicio:", error);
    console.error(" Response data:", error.response?.data);
    console.error(" Status:", error.response?.status);
    console.error(" Headers:", error.response?.headers);

    if (error.response?.status === 401 || error.response?.status === 403) {
      Swal.fire({
        icon: "error",
        title: "Sesión expirada",
        text: "Tu sesión ha caducado. Por favor, inicia sesión nuevamente.",
        confirmButtonColor: "#ef4444",
      });
      logout();
    } else if (error.response?.status === 500) {
  
      const message = error.response.data?.detail || 
                     error.response.data?.message || 
                     JSON.stringify(error.response.data) ||
                     "Error interno del servidor. Verifica que los datos sean correctos.";
      Swal.fire({
        icon: "error",
        title: "Error del Servidor",
        text: message,
        confirmButtonColor: "#ef4444",
      });
      throw new Error(message);
    } else if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al crear el servicio";
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


export const getAllServicios = async (): Promise<ServicioResponse[]> => {
  try {
    const response = await api.get(SERVICIOS_URL, authHeaders());
    return response.data;
  } catch (error: any) {
    console.error(" Error en getAllServicios:", error);
    throw error;
  }
};


export const getServicioById = async (id: number): Promise<ServicioResponse> => {
  try {
    const response = await api.get(`${SERVICIOS_URL}${id}/`, authHeaders());
    return response.data;
  } catch (error: any) {
    console.error(" Error en getServicioById:", error);
    throw error;
  }
};


export const updateServicio = async (
  id: number,
  data: Partial<ServicioCreate>
): Promise<ServicioResponse> => {
  try {
    const response = await api.put(`${SERVICIOS_URL}${id}/`, data, authHeaders());
    return response.data;
  } catch (error: any) {
    console.error(" Error en updateServicio:", error);
    throw error;
  }
};


export const deleteServicio = async (id: number): Promise<void> => {
  try {
    await api.delete(`${SERVICIOS_URL}${id}/`, authHeaders());
  } catch (error: any) {
    console.error(" Error en deleteServicio:", error);
    throw error;
  }
};