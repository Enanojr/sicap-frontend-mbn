import api from "../api_axios";
import Swal from "sweetalert2";
import type { AxiosResponse } from "axios";

export interface CreateTransaccionPayload {
  tipo: "ingreso" | "egreso";
  monto: number;
  fecha: string;
  observaciones?: string;
  requisitor?: string;
  cuenta: number;
  comprobante?: File;

  /* =========================================================
     TEMPORAL DEMO - INICIO
     Campo temporal para enviar link en lugar de archivo.
     Borrar después cuando backend ya acepte archivo real.
  ========================================================= */
  comprobante_url?: string;
  /* =========================================================
     TEMPORAL DEMO - FIN
  ========================================================= */
}

export interface TransaccionCreate {
  tipo: "egreso" | "ingreso";
  monto: number;
  fecha: string;
  observaciones?: string;
  comprobante?: File;
  requisitor?: string;
  cuenta?: number;
}

export interface TransaccionResponse {
  id: number;
  tipo: string;
  monto: string;
  fecha: string;
  observaciones: string;
  comprobante: string | null;
  requisitor: string | null;
  fecha_creacion: string;
  cuenta: number;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TransaccionResponse[];
}

export interface GetTransaccionesResult {
  success: boolean;
  data?: PaginatedResponse | TransaccionResponse[];
  errors?: unknown;
}

type RawTransaccion = Partial<TransaccionResponse> & {
  id?: number;
  tipo?: string;
  monto?: string | number;
  fecha?: string;
  observaciones?: string | null;
  comprobante?: string | null;
  requisitor?: string | null;
  fecha_creacion?: string;
  cuenta?: number | string | null;
};

const TRANSACCIONES_URL = "/api/tesoreria/transacciones/";

const normalizeFecha = (fechaString?: string): string => {
  if (!fechaString) return "";
  if (fechaString.includes("T")) return fechaString.split("T")[0];
  return fechaString;
};

const normalizeTransaccion = (t: RawTransaccion): TransaccionResponse => ({
  id: Number(t.id ?? 0),
  tipo: t.tipo ?? "",
  monto: String(t.monto ?? "0"),
  fecha: normalizeFecha(t.fecha),
  observaciones: t.observaciones ?? "",
  comprobante: t.comprobante ?? null,
  requisitor: t.requisitor ?? null,
  fecha_creacion: t.fecha_creacion ?? "",
  cuenta: Number(t.cuenta ?? 0),
});

const toFormData = (data: TransaccionCreate): FormData => {
  const fd = new FormData();
  fd.append("tipo", data.tipo);
  fd.append("monto", String(data.monto));
  fd.append("fecha", data.fecha);

  if (data.observaciones) fd.append("observaciones", data.observaciones);
  if (data.comprobante) fd.append("comprobante", data.comprobante);
  if (data.requisitor) fd.append("requisitor", data.requisitor);
  if (data.cuenta !== undefined) fd.append("cuenta", String(data.cuenta));

  return fd;
};

export const createTransaccion = async (
  data: TransaccionCreate,
): Promise<TransaccionResponse> => {
  try {
    const formData = toFormData(data);

    const response: AxiosResponse<RawTransaccion> = await api.post(
      TRANSACCIONES_URL,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeTransaccion(response.data);
  } catch (error: any) {
    console.error("Error en createTransaccion:", error);

    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Error al registrar la transacción";

    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonColor: "#ef4444",
    });

    throw error;
  }
};

export const getTransacciones = async (
  url?: string,
  searchTerm?: string,
): Promise<GetTransaccionesResult> => {
  try {
    const endpoint = url || TRANSACCIONES_URL;

    const response: AxiosResponse<PaginatedResponse | RawTransaccion[]> =
      await api.get(endpoint, {
        params: searchTerm ? { search: searchTerm } : {},
      });

    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data.map(normalizeTransaccion),
      };
    }

    return {
      success: true,
      data: {
        ...response.data,
        results: (response.data.results || []).map(normalizeTransaccion),
      },
    };
  } catch (error: any) {
    console.error("Error en getTransacciones:", error);

    return {
      success: false,
      errors: error.response?.data || {
        general: "Error al obtener las transacciones",
      },
    };
  }
};

export const getAllTransacciones = async (): Promise<TransaccionResponse[]> => {
  try {
    let todas: TransaccionResponse[] = [];
    let nextUrl: string | null = TRANSACCIONES_URL;
    let pagina = 1;

    while (nextUrl) {
      const response: AxiosResponse<PaginatedResponse | RawTransaccion[]> =
        await api.get(nextUrl);

      const data: RawTransaccion[] = Array.isArray(response.data)
        ? response.data
        : (response.data.results ?? []);

      todas = [...todas, ...data.map(normalizeTransaccion)];

      nextUrl =
        !Array.isArray(response.data) && response.data.next
          ? response.data.next
          : null;

      pagina++;
      if (pagina > 100) break;
    }

    return todas;
  } catch (error: any) {
    console.error("Error en getAllTransacciones:", error);

    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Error al obtener las transacciones";

    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonColor: "#ef4444",
    });

    throw error;
  }
};

export const deleteTransaccion = async (id: number): Promise<void> => {
  try {
    await api.delete(`${TRANSACCIONES_URL}${id}/`);

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Transacción eliminada correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });
  } catch (error: any) {
    console.error("Error en deleteTransaccion:", error);

    const message =
      error.response?.status === 404
        ? "Transacción no encontrada"
        : error.response?.data?.detail || "Error al eliminar la transacción";

    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonColor: "#ef4444",
    });

    throw error;
  }
};
