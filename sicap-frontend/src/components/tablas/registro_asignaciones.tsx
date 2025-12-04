import React, { useState } from "react";
import Swal from "sweetalert2";

import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";

import {
  getAsignaciones,
  deleteAsignacion,
  type AsignacionResponse,
} from "../../services/Asignaciones.service";

interface TablaAsignacionesProps {
  onEdit: (asignacion: AsignacionResponse) => void;
}

const TablaAsignaciones: React.FC<TablaAsignacionesProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (item: AsignacionResponse): Promise<boolean> => {
    const result = await Swal.fire({
      title: "¿Eliminar asignación?",
      text: `Asignación de ${item.cobrador.nombre} ${item.cobrador.apellidos}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return false;

    const response = await deleteAsignacion(item.id_asignacion);

    if (response.success) {
      Swal.fire({
        icon: "success",
        title: "¡Asignación eliminada!",
        timer: 2000,
        confirmButtonColor: "#667eea",
      });

      setRefreshKey((prev) => prev + 1);
      return true;
    }

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la asignación.",
    });

    return false;
  };

  const columns: Column<AsignacionResponse>[] = [
    {
      key: "cobrador",
      label: "Cobrador",
      render: (_, item) => `${item.cobrador.nombre} ${item.cobrador.apellidos}`,
    },
    {
      key: "sector",
      label: "Sector",
      render: (_, item) => item.sector.nombre_sector,
    },
    {
      key: "fecha_asignacion",
      label: "Fecha",
    },
  ];

  const fetchData = async (): Promise<AsignacionResponse[]> => {
    const result = await getAsignaciones();

    const data = (result.data as any).results || result.data;
    return Array.isArray(data) ? data : [];
  };

  return (
    <ReusableTable<AsignacionResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      onEdit={onEdit}
      onDelete={handleDelete}
      showActions={true}
      title="Asignaciones Registradas"
    />
  );
};

export default TablaAsignaciones;
