import React, { useState } from "react";
import { ReusableTable } from "./registros_general";
import type { Column } from "./registros_general";

import {
  getCobradores,
  type CobradorResponse,
} from "../../services/Rcobradores.service";

const TablaCobradores: React.FC = () => {
  const [refreshKey] = useState(0);

  const columns: Column<CobradorResponse>[] = [
    {
      key: "nombre",
      label: "Nombre",
      render: (_, item) => `${item.nombre} ${item.apellidos}`,
    },
    {
      key: "email",
      label: "Correo",
    },
    {
      key: "usuario",
      label: "Usuario",
    },
  ];

  const fetchData = async (): Promise<CobradorResponse[]> => {
    const result = await getCobradores();

    if (result.success) {
      const data = (result.data as any).results || result.data;
      return Array.isArray(data) ? data : [];
    }

    return [];
  };

  return (
    <ReusableTable<CobradorResponse>
      key={refreshKey}
      columns={columns}
      fetchData={fetchData}
      showActions={false}
      title="Cobradores Registrados"
    />
  );
};

export default TablaCobradores;
