import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";
import {
  getAllDescuentos,
  deleteDescuento,
  type DescuentoResponse,
} from "../../services/descuento.service";
import Swal from "sweetalert2";

interface TablaDescuentosProps {
  onEdit: (descuento: DescuentoResponse) => void;
}

const TablaDescuentos: React.FC<TablaDescuentosProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: Column<DescuentoResponse>[] = [
    {
      key: "nombre_descuento",
      label: "Nombre del Descuento",
    },
    {
      key: "porcentaje",
      label: "Monto del Descuento",
      render: (value) =>
        `$${Number(value || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      key: "activo",
      label: "Activo",
      render: (value) => (value ? "Sí" : "No"),
    },
  ];

  const fetchData = async (): Promise<DescuentoResponse[]> => {
    return await getAllDescuentos();
  };

  const handleEdit = (descuento: DescuentoResponse) => {
    onEdit(descuento);
  };

  const handleDelete = async (
    descuento: DescuentoResponse
  ): Promise<boolean> => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar el descuento "${descuento.nombre_descuento}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteDescuento(descuento.id_descuento!);

        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "El descuento ha sido eliminado correctamente",
          confirmButtonColor: "#10b981",
        });

        setRefreshKey((prev) => prev + 1);
        return true; // Deletion successful
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el descuento",
          confirmButtonColor: "#ef4444",
        });
        return false; // Deletion failed
      }
    }

    return false; // User cancelled
  };

  return (
    <ReusableTable<DescuentoResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      searchableFields={["nombre_descuento"]}
      itemsPerPage={10}
      title="Descuentos Registrados"
      showActions={true}
      onEdit={handleEdit}
      onDelete={handleDelete}
      getRowId={(row) => row.id_descuento!}
    />
  );
};

export default TablaDescuentos;
