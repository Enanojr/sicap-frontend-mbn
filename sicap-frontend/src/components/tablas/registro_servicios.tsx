import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";
import {
  getAllServicios,
  deleteServicio,
  type ServicioResponse,
} from "../../services/servicios.service";
import Swal from "sweetalert2";

interface TablaServiciosProps {
  onEdit: (servicio: ServicioResponse) => void;
}

const TablaServicios: React.FC<TablaServiciosProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: Column<ServicioResponse>[] = [
    {
      key: "nombre",
      label: "Nombre del Servicio",
    },

    {
      key: "costo",
      label: "Costo",
      render: (value) =>
        `$${Number(value || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })}`,
    },
  ];

  const fetchData = async (): Promise<ServicioResponse[]> => {
    const servicios = await getAllServicios();
    return servicios;
  };

  const handleEdit = (servicio: ServicioResponse) => {
    onEdit(servicio);
  };

  const handleDelete = async (servicio: ServicioResponse): Promise<boolean> => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar el servicio "${servicio.nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteServicio(servicio.id_servicio!);

        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "El servicio ha sido eliminado correctamente",
          confirmButtonColor: "#10b981",
        });

        setRefreshKey((prev) => prev + 1);
        return true; // Deletion successful
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el servicio",
          confirmButtonColor: "#ef4444",
        });
        return false; // Deletion failed
      }
    }

    return false; // User cancelled
  };

  return (
    <ReusableTable<ServicioResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      searchableFields={["nombre"]}
      itemsPerPage={10}
      title="Servicios Registrados"
      showActions={true}
      onEdit={handleEdit}
      onDelete={handleDelete}
      getRowId={(servicio) => servicio.id_servicio!}
    />
  );
};

export default TablaServicios;
