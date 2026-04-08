import api from "../api_axios";
import Swal from "sweetalert2";
import { getToken, logout } from "./auth.service";

export interface CargoCreate {
  nombre: string;
  monto: number;
}

export interface CargoResponse {
  id: number;
  nombre: string;
  monto: number;
}

// CORRECCIÓN: URL según Postman (sin la 's' extra en cargo)
const CARGOS_URL = "/tipos-cargo/"; 

const authHeaders = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

const formatCargoResponse = (data: any): CargoResponse => ({
  ...data,
  id: Number(data.id),
  monto: typeof data.monto === "string" ? parseFloat(data.monto) : Number(data.monto),
});

const handleError = (error: any, action: string) => {
  const status = error.response?.status;
  const message = error.response?.data?.detail || error.response?.data?.message || `No se pudo ${action}.`;

  if (status === 401 || status === 403) {
    Swal.fire({
      icon: "error",
      title: "Sesión expirada",
      text: "Por favor, inicia sesión nuevamente.",
      confirmButtonColor: "#ef4444",
    });
    logout();
  } else {
    Swal.fire({
      icon: "error",
      title: `Error al ${action}`,
      text: message,
      confirmButtonColor: "#ef4444",
    });
  }
  // IMPORTANTE: Lanzar el error para que el componente se detenga
  throw error; 
};

export const createCargo = async (data: CargoCreate): Promise<CargoResponse> => {
  try {
    const response = await api.post(CARGOS_URL, data, authHeaders());
    return formatCargoResponse(response.data);
  } catch (error: any) {
    return handleError(error, "registrar el cargo");
  }
};

export const getAllCargos = async (): Promise<CargoResponse[]> => {
  try {
    const response = await api.get(CARGOS_URL, authHeaders());
    const cargos = response.data.results || response.data;
    return Array.isArray(cargos) ? cargos.map(formatCargoResponse) : [];
  } catch (error: any) {
    console.error("Error en getAllCargos:", error);
    throw error;
  }
};

export const updateCargo = async (id: number, data: Partial<CargoCreate>): Promise<CargoResponse> => {
  try {
    const response = await api.put(`${CARGOS_URL}${id}/`, data, authHeaders());
    return formatCargoResponse(response.data);
  } catch (error: any) {
    return handleError(error, "actualizar el cargo");
  }
};

export const deleteCargo = async (id: number): Promise<void> => {
  try {
    await api.delete(`${CARGOS_URL}${id}/`, authHeaders());
  } catch (error: any) {
    handleError(error, "eliminar el cargo");
  }
};