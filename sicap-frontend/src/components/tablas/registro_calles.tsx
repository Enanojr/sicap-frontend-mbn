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

const TablaCalles: React.FC<TablaCallesProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: Column<CalleResponse>[] = [
    { key: "nombre_calle", label: "Nombre de la calle" },
    {
      key: "activo",
      label: "Activo",
      render: (item) => {
        const activo =
          item.activo === true ||
          item.activo === 1 ||
          item.activo === "1" ||
          item.activo === "true";

        return activo ? "Sí" : "No";
      },
    },
  ];

  const fetchData = async (): Promise<CalleResponse[]> => {
    const result = await getCalles();
    const data = (result.data as any).results || result.data;
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
      Swal.fire({
        icon: "success",
        title: "¡Calle eliminada!",
        timer: 2000,
      });
      setRefreshKey((prev) => prev + 1);
      return true;
    }

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la calle.",
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
