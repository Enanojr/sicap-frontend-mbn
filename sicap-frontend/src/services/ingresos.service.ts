import api from "../api_axios";
import Swal from "sweetalert2";

export interface IngresoCreate {
  fecha_ingreso: string;
  monto: number;
  equipo: string;
}

export interface IngresoResponse {
  id_ingreso: number;
  fecha_ingreso: string;
  monto: number;
  equipo: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: IngresoResponse[];
}

interface GetIngresosResult {
  success: boolean;
  data?: PaginatedResponse | IngresoResponse[];
  errors?: any;
}

const INGRESOS_URL = "/ingresos/";

const normalizeFecha = (fechaString: string): string => {
  if (!fechaString) return "";
  if (fechaString.includes("T")) {
    return fechaString.split("T")[0];
  }
  return fechaString;
};

const normalizeIngreso = (ingreso: any): IngresoResponse => {
  return {
    ...ingreso,
    fecha_ingreso: normalizeFecha(ingreso.fecha_ingreso),
    monto: Number(ingreso.monto || 0),
  };
};

export const createIngreso = async (
  data: IngresoCreate,
): Promise<IngresoResponse> => {
  try {
    const response = await api.post(INGRESOS_URL, data);
    return normalizeIngreso(response.data);
  } catch (error: any) {
    console.error("Error en createIngreso:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al registrar el ingreso";

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

export const getIngresos = async (
  url?: string,
  searchTerm?: string,
): Promise<GetIngresosResult> => {
  try {
    const endpoint = url || INGRESOS_URL;

    const response: { data: PaginatedResponse | IngresoResponse[] } =
      await api.get<PaginatedResponse | IngresoResponse[]>(endpoint, {
        params: searchTerm ? { search: searchTerm } : {},
      });

    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data.map(normalizeIngreso),
      };
    }

    return {
      success: true,
      data: {
        ...response.data,
        results: (response.data.results || []).map(normalizeIngreso),
      },
    };
  } catch (error: any) {
    console.error("Error en getIngresos:", error);

    return {
      success: false,
      errors: error.response?.data || {
        general: "Error al obtener los ingresos",
      },
    };
  }
};

export const getAllIngresos = async (): Promise<IngresoResponse[]> => {
  try {
    let todosIngresos: IngresoResponse[] = [];
    let nextUrl: string | null = INGRESOS_URL;
    let pagina = 1;

    while (nextUrl) {
      const response: { data: PaginatedResponse | IngresoResponse[] } =
        await api.get<PaginatedResponse | IngresoResponse[]>(nextUrl);

      const ingresosData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      todosIngresos = [...todosIngresos, ...ingresosData.map(normalizeIngreso)];

      nextUrl =
        !Array.isArray(response.data) && response.data.next
          ? response.data.next
          : null;

      pagina++;

      if (pagina > 100) break;
    }

    return todosIngresos;
  } catch (error: any) {
    console.error("Error en getAllIngresos:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al obtener los ingresos";

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

export const getIngresoById = async (id: number): Promise<IngresoResponse> => {
  try {
    const response = await api.get<IngresoResponse>(`${INGRESOS_URL}${id}/`);
    return normalizeIngreso(response.data);
  } catch (error: any) {
    console.error("Error en getIngresoById:", error);

    if (error.response) {
      const message =
        error.response.status === 404
          ? "Ingreso no encontrado"
          : error.response.data?.detail || "Error al obtener el ingreso";

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

export const updateIngreso = async (
  id: number,
  data: Partial<IngresoCreate>,
): Promise<IngresoResponse> => {
  try {
    const response = await api.put<IngresoResponse>(
      `${INGRESOS_URL}${id}/`,
      data,
    );

    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Ingreso actualizado correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });

    return normalizeIngreso(response.data);
  } catch (error: any) {
    console.error("Error en updateIngreso:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al actualizar el ingreso";

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

export const deleteIngreso = async (id: number): Promise<void> => {
  try {
    await api.delete(`${INGRESOS_URL}${id}/`);

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Ingreso eliminado correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });
  } catch (error: any) {
    console.error("Error en deleteIngreso:", error);

    if (error.response) {
      const message =
        error.response.status === 404
          ? "Ingreso no encontrado"
          : error.response.data?.detail || "Error al eliminar el ingreso";

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
