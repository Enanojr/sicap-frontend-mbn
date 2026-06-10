import api from "../../src/api_axios";
import Swal from "sweetalert2";

export interface EgresoCreate {
  fecha_egreso: string;
  monto: number;
  concepto: string;
  requisitor_gasto: string;
  id_cobrador: number;
  observaciones?: File[];
}

export interface EgresoResponse {
  id_egreso: number;
  fecha_egreso: string;
  monto: number;
  concepto: string;
  requisitor_gasto: string;
  id_cobrador: number | string | null;
  archivo_url?: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EgresoResponse[];
}

interface GetEgresosResult {
  success: boolean;
  data?: PaginatedResponse | EgresoResponse[];
  errors?: any;
}

const EGRESOS_URL = "/egresos/";

const normalizeFecha = (fechaString: string): string => {
  if (!fechaString) return "";
  if (fechaString.includes("T")) {
    return fechaString.split("T")[0];
  }
  return fechaString;
};

const normalizeEgreso = (egreso: any): EgresoResponse => {
  return {
    ...egreso,
    fecha_egreso: normalizeFecha(egreso.fecha_egreso),
    monto: Number(egreso.monto || 0),
  };
};

export const createEgreso = async (
  data: FormData | EgresoCreate,
): Promise<EgresoResponse> => {
  try {
    const response = await api.post(EGRESOS_URL, data, {
      headers:
        data instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });

    return normalizeEgreso(response.data);
  } catch (error: any) {
    console.error("Error en createEgreso:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al registrar el egreso";

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

export const getEgresos = async (
  url?: string,
  searchTerm?: string,
): Promise<GetEgresosResult> => {
  try {
    const endpoint = url || EGRESOS_URL;

    const response: { data: PaginatedResponse | EgresoResponse[] } =
      await api.get<PaginatedResponse | EgresoResponse[]>(endpoint, {
        params: searchTerm ? { search: searchTerm } : {},
      });

    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data.map(normalizeEgreso),
      };
    }

    return {
      success: true,
      data: {
        ...response.data,
        results: (response.data.results || []).map(normalizeEgreso),
      },
    };
  } catch (error: any) {
    console.error("Error en getEgresos:", error);

    return {
      success: false,
      errors: error.response?.data || {
        general: "Error al obtener los egresos",
      },
    };
  }
};

export const getAllEgresos = async (): Promise<EgresoResponse[]> => {
  try {
    console.log("Obteniendo todos los egresos...");
    let todosEgresos: EgresoResponse[] = [];
    let nextUrl: string | null = EGRESOS_URL;
    let pagina = 1;

    while (nextUrl) {
      console.log(`Obteniendo página ${pagina} de egresos...`);

      const response: { data: PaginatedResponse | EgresoResponse[] } =
        await api.get<PaginatedResponse | EgresoResponse[]>(nextUrl);

      const egresosData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      todosEgresos = [...todosEgresos, ...egresosData.map(normalizeEgreso)];

      nextUrl =
        !Array.isArray(response.data) && response.data.next
          ? response.data.next
          : null;

      pagina++;

      if (pagina > 100) {
        console.warn("Se alcanzó el límite de páginas (100)");
        break;
      }
    }

    console.log(`Total de egresos obtenidos: ${todosEgresos.length}`);
    return todosEgresos;
  } catch (error: any) {
    console.error("Error en getAllEgresos:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al obtener los egresos";

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

export const getEgresoById = async (id: number): Promise<EgresoResponse> => {
  try {
    console.log(`Obteniendo egreso con ID: ${id}`);
    const response = await api.get<EgresoResponse>(`${EGRESOS_URL}${id}/`);
    return normalizeEgreso(response.data);
  } catch (error: any) {
    console.error("Error en getEgresoById:", error);

    if (error.response) {
      const message =
        error.response.status === 404
          ? "Egreso no encontrado"
          : error.response.data?.detail || "Error al obtener el egreso";

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

export const updateEgreso = async (
  id: number,
  data: FormData | Partial<EgresoCreate>,
): Promise<EgresoResponse> => {
  try {
    console.log(`Actualizando egreso ${id}:`, data);

    const response = await api.put<EgresoResponse>(
      `${EGRESOS_URL}${id}/`,
      data,
      {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      },
    );

    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Egreso actualizado correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });

    return normalizeEgreso(response.data);
  } catch (error: any) {
    console.error("Error en updateEgreso:", error);

    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Error al actualizar el egreso";

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

export const deleteEgreso = async (id: number): Promise<void> => {
  try {
    console.log(`Eliminando egreso con ID: ${id}`);
    await api.delete(`${EGRESOS_URL}${id}/`);

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "Egreso eliminado correctamente",
      confirmButtonColor: "#10b981",
      timer: 2000,
    });
  } catch (error: any) {
    console.error("Error en deleteEgreso:", error);

    if (error.response) {
      const message =
        error.response.status === 404
          ? "Egreso no encontrado"
          : error.response.data?.detail || "Error al eliminar el egreso";

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
