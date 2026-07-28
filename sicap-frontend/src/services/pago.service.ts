import api from "../../src/api_axios";
import Swal from "sweetalert2";
import { fetchAllPages } from "./paginacion";

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
  const response = await api.post(PAGOS_URL, data);
  return normalizePago(response.data);
};

export const getAllPagos = async (): Promise<PagoResponse[]> => {
  try {
    const pagos = await fetchAllPages<PagoResponse>(PAGOS_URL, {
      pageSize: 200,
    });
    return pagos.map(normalizePago);
  } catch (error: any) {
    console.error("Error en getAllPagos:", error);

    // Manejo de error más robusto
    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al obtener los pagos";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#ef4444",
      });
    }

    throw error;
  }
};

export const getPagoById = async (id: number): Promise<PagoResponse> => {
  try {
    console.log(`Obteniendo pago con ID: ${id}`);
    const response = await api.get<PagoResponse>(`${PAGOS_URL}${id}/`);
    return normalizePago(response.data);
  } catch (error: any) {
    console.error("Error en getPagoById:", error);

    if (error.response) {
      const message =
        error.response.status === 404
          ? "Pago no encontrado"
          : error.response.data?.detail || "Error al obtener el pago";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#ef4444",
      });
    }

    throw error;
  }
};

export const updatePago = async (
  id: number,
  data: Partial<PagoCreate>,
): Promise<PagoResponse> => {
  try {
    console.log(`Actualizando pago ${id}:`, data);
    const response = await api.put<PagoResponse>(`${PAGOS_URL}${id}/`, data);
    console.log("Pago actualizado exitosamente:", response.data);

    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Pago actualizado correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });

    return normalizePago(response.data);
  } catch (error: any) {
    console.error("Error en updatePago:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al actualizar el pago";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#ef4444",
      });
    }

    throw error;
  }
};

export const deletePago = async (id: number): Promise<void> => {
  try {
    console.log(`Eliminando pago con ID: ${id}`);
    await api.delete(`${PAGOS_URL}${id}/`);

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Pago eliminado correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });
  } catch (error: any) {
    console.error("Error en deletePago:", error);

    if (error.response) {
      const message =
        error.response.status === 404
          ? "Pago no encontrado"
          : error.response.data?.detail || "Error al eliminar el pago";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#ef4444",
      });
    }

    throw error;
  }
};
