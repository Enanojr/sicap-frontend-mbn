import api from "../../src/api_axios";
import Swal from "sweetalert2";

export interface PagoCreate {
  cuentahabiente: number;
  descuento?: number;
  fecha_pago: string;
  monto_recibido: number;
  mes: string;
  anio: number;
  comentarios: string;
}

export interface PagoResponse {
  ID_Pago: number;
  cuentahabiente: string;
  descuento: number;
  fecha_pago: string;
  monto_recibido: number;
  mes: string;
  anio: number;
  comentarios: string;
}

const PAGOS_URL = "/pago/";

const normalizeFecha = (fechaString: string): string => {
  if (!fechaString) return "";
  if (fechaString.includes("T")) {
    return fechaString.split("T")[0];
  }
  return fechaString;
};

const normalizePago = (pago: any): PagoResponse => {
  return {
    ...pago,
    fecha_pago: normalizeFecha(pago.fecha_pago),
  };
};

export const createPago = async (data: PagoCreate): Promise<PagoResponse> => {
  try {
    console.log("Enviando pago:", data);
    const response = await api.post(PAGOS_URL, data);
    console.log("Pago creado exitosamente:", response.data);
    return normalizePago(response.data);
  } catch (error: any) {
    console.error("Error en createPago:", error);
    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al crear el pago";
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

export const getAllPagos = async (): Promise<PagoResponse[]> => {
  try {
    console.log("Obteniendo todos los pagos...");
    const response = await api.get(PAGOS_URL);
    console.log(response.data.length + " pagos obtenidos");
    return response.data.map(normalizePago);
  } catch (error: any) {
    console.error("Error en getAllPagos:", error);
    throw error;
  }
};

export const getPagoById = async (id: number): Promise<PagoResponse> => {
  try {
    const response = await api.get(PAGOS_URL + id + "/");
    return normalizePago(response.data);
  } catch (error: any) {
    console.error("Error en getPagoById:", error);
    throw error;
  }
};

export const updatePago = async (
  id: number,
  data: Partial<PagoCreate>
): Promise<PagoResponse> => {
  try {
    const response = await api.put(PAGOS_URL + id + "/", data);
    return normalizePago(response.data);
  } catch (error: any) {
    console.error("Error en updatePago:", error);
    throw error;
  }
};

export const deletePago = async (id: number): Promise<void> => {
  try {
    await api.delete(PAGOS_URL + id + "/");
  } catch (error: any) {
    console.error("Error en deletePago:", error);
    throw error;
  }
};
