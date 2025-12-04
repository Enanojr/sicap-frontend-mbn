import api from "../api_axios";

const API_URL = "/sector/";

const getAdminToken = (): string | null => {
  return localStorage.getItem("access");
};

export interface SectorBase {
  nombre_sector: string;
  descripcion: string;
}

export interface SectorResponse extends SectorBase {
  id_sector: number;
}

/* -------------------- CREATE -------------------- */
export const registerSector = async (data: SectorBase) => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { success: false, errors: { general: "No hay token" } };
    }

    const response = await api.post(API_URL, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      errors: error.response?.data || { general: "Error al crear sector" },
    };
  }
};

/* -------------------- UPDATE -------------------- */
export const updateSector = async (id: number, data: SectorBase) => {
  try {
    const token = getAdminToken();
    if (!token) return { success: false, errors: { general: "No hay token" } };

    const response = await api.put(`${API_URL}${id}/`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      errors: error.response?.data || { general: "Error al actualizar sector" },
    };
  }
};

/* -------------------- GET ALL -------------------- */
export const getSectores = async () => {
  try {
    const response = await api.get(API_URL);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, errors: error.response?.data };
  }
};

/* -------------------- DELETE -------------------- */
export const deleteSector = async (id: number) => {
  try {
    const response = await api.delete(`${API_URL}${id}/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      errors: error.response?.data || { general: "Error al eliminar sector" },
    };
  }
};
