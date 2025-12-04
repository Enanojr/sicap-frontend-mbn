import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";

import {
  getSectores,
  deleteSector,
  type SectorResponse,
} from "../../services/Rsector.service";

import Swal from "sweetalert2";

interface TablaSectoresProps {
  onEdit: (sector: SectorResponse) => void;
}

const TablaSectores: React.FC<TablaSectoresProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: Column<SectorResponse>[] = [
    { key: "nombre_sector", label: "Nombre" },
    { key: "descripcion", label: "Descripción" },
  ];

  const fetchData = async (): Promise<SectorResponse[]> => {
    const result = await getSectores();
    const data = (result.data as any).results || result.data;
    return Array.isArray(data) ? data : [];
  };

  const handleDelete = async (item: SectorResponse): Promise<boolean> => {
    const confirm = await Swal.fire({
      title: "¿Eliminar sector?",
      text: item.nombre_sector,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return false;

    const result = await deleteSector(item.id_sector);

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "¡Sector eliminado!",
        timer: 2000,
      });
      setRefreshKey((prev) => prev + 1);
      return true;
    }

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar el sector.",
    });

    return false;
  };

  return (
    <ReusableTable<SectorResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      onEdit={onEdit}
      onDelete={handleDelete}
      showActions={true}
      title="Sectores Registrados"
    />
  );
};

export default TablaSectores;
