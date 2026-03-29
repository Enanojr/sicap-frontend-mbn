import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";

import {
  getCalles,
  deleteCalle,
  type CalleResponse,
} from "../../services/calle.service";

import Swal from "sweetalert2";

interface TablaCallesProps {
  onEdit: (calle: CalleResponse) => void;
}

const isActivo = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();
    return (
      clean === "true" || clean === "1" || clean === "si" || clean === "sí"
    );
  }

  return false;
};

const TablaCalles: React.FC<TablaCallesProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: Column<CalleResponse>[] = [
    { key: "nombre_calle", label: "Nombre de la calle" },
    {
      key: "activo",
      label: "Activo",
      render: (value: any, row?: CalleResponse) => {
        const rawValue = row && typeof row === "object" ? row.activo : value;

        return isActivo(rawValue) ? "Sí" : "No";
      },
    },
  ];

  const fetchData = async (): Promise<CalleResponse[]> => {
    const result = await getCalles();

    if (!result.success) {
      throw new Error(
        result.errors?.general ||
          JSON.stringify(result.errors) ||
          "No se pudieron obtener las calles.",
      );
    }

    const data = result.data?.results || result.data;

    console.log("Calles recibidas:", data);

    return Array.isArray(data) ? data : [];
  };

  const handleDelete = async (item: CalleResponse): Promise<boolean> => {
    const confirm = await Swal.fire({
      title: "¿Eliminar calle?",
      text: item.nombre_calle,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return false;

    const result = await deleteCalle(item.id_calle);

    if (result.success) {
      await Swal.fire({
        icon: "success",
        title: "¡Calle eliminada!",
        timer: 2000,
        showConfirmButton: false,
      });

      setRefreshKey((prev) => prev + 1);
      return true;
    }

    await Swal.fire({
      icon: "error",
      title: "Error",
      text:
        result.errors?.general ||
        JSON.stringify(result.errors) ||
        "No se pudo eliminar la calle.",
    });

    return false;
  };

  return (
    <ReusableTable<CalleResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      onEdit={onEdit}
      onDelete={handleDelete}
      showActions={true}
      title="Calles Registradas"
    />
  );
};

export default TablaCalles;
