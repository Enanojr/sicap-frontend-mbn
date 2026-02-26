import React, { useState } from "react";
import { ReusableTable } from "../../components/tablas/registros_general";
import type { Column } from "../../components/tablas/registros_general";
import {
    deleteCargo,
  getAllCargos,
  type CargoResponse,
} from "../../services/tcargos.service";
import Swal from "sweetalert2";


interface TablaCargosProps {
  onEdit: (cargo: CargoResponse) => void;
}

const TablaCargos: React.FC<TablaCargosProps> = ({ onEdit }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const columns: Column<CargoResponse>[] = [
    {
      key: "nombre",
      label: "Nombre del Cargo",
    },

    {
      key: "monto",
      label: "Monto",
      render: (value) =>
        `$${Number(value || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })}`,
    },
  ];

  const fetchData = async (): Promise<CargoResponse[]> => {
    const cargos = await getAllCargos();
    return cargos;
  };

  const handleEdit = (cargo: CargoResponse) => {
    onEdit(cargo);
  };

const handleDelete = async (cargo: CargoResponse): Promise<boolean> => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar el cargo "${cargo.nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteCargo(cargo.id);

        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "El cargo ha sido eliminado correctamente",
          confirmButtonColor: "#10b981",
        });

        setRefreshKey((prev) => prev + 1);
        return true;
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el servicio",
          confirmButtonColor: "#ef4444",
        });
        return false;
      }
    }

    return false;
  };

  return (
    <ReusableTable<CargoResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      searchableFields={["nombre"]}
      itemsPerPage={10}
      title="Cargos Registrados"
      showActions={true}
      onEdit={handleEdit}
      onDelete={handleDelete}
      getRowId={(cargo) => cargo.id}
    />
  );
};

export default TablaCargos;
