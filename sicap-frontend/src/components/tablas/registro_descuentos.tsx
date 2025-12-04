import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";

import {
  getAllDescuentos,
  updateDescuento,
  type DescuentoResponse,
} from "../../services/descuento.service";

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
      label: "Estado",
      render: (_value, item) => (
        <span
          className={`chip-status ${item.activo ? "on" : "off"}`}
          onClick={() => handleToggleActivo(item)}
        >
          {item.activo ? "ACTIVO" : "INACTIVO"}
        </span>
      ),
    },
  ];

  const fetchData = async (): Promise<DescuentoResponse[]> => {
    return await getAllDescuentos();
  };

  const handleEdit = (descuento: DescuentoResponse) => {
    onEdit(descuento);
  };

  const handleToggleActivo = async (descuento: DescuentoResponse) => {
    try {
      await updateDescuento(descuento.id_descuento, {
        nombre_descuento: descuento.nombre_descuento,
        porcentaje: descuento.porcentaje,
        activo: !descuento.activo,
      });

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error al actualizar estado del descuento:", error);
    }
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
      getRowId={(row) => row.id_descuento!}
    />
  );
};

export default TablaDescuentos;
