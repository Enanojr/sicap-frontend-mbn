import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";

import {
  getColonias,
  type ColoniaResponse,
} from "../../services/Rcolonias.service";

interface TablaColoniasProps {
  onEdit: (colonia: ColoniaResponse) => void;
}

const TablaColonias: React.FC<TablaColoniasProps> = ({ onEdit }) => {
  const [refreshKey] = useState(0);

  const columns: Column<ColoniaResponse>[] = [
    {
      key: "nombre_colonia",
      label: "Nombre de la colonia",
    },
    {
      key: "codigo_postal",
      label: "Código Postal",
    },
  ];

  const fetchData = async (): Promise<ColoniaResponse[]> => {
    const result = await getColonias();

    if (result.success) {
      const data = (result.data as any).results || result.data;
      return Array.isArray(data) ? data : [];
    }

    return [];
  };

  const handleEdit = (item: ColoniaResponse) => {
    onEdit(item);
  };

  return (
    <ReusableTable<ColoniaResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      onEdit={handleEdit}
      showActions={true}
      title="Colonias Registradas"
    />
  );
};

export default TablaColonias;
