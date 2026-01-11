import React from "react";
import { Download } from "lucide-react";
import { ReusableTable, type Column } from "./registros_general";

import {
  getRCuentahabientes,
  type RCuentahabienteViewRow,
} from "../../services/cuentahabientestabla.service";

import {
  getCuentahabienteById,
  type CuentahabienteResponse,
} from "../../services/Rcuentahabientes.service";

const TablaCuentahabientes: React.FC<{
  onEdit?: (c: CuentahabienteResponse) => void;
}> = ({ onEdit }) => {
  const fetchAllCuentahabientes = async (): Promise<
    RCuentahabienteViewRow[]
  > => {
    let url: string | null = "/api/r-cuentahabientes/";
    let allResults: RCuentahabienteViewRow[] = [];

    while (url) {
      const resp = await getRCuentahabientes(url);
      if (!resp.success || !resp.data) break;

      const data: any = resp.data;
      const pageItems: RCuentahabienteViewRow[] = data.results ?? data;

      allResults = [...allResults, ...pageItems];
      url = data.next ?? null;
    }

    return allResults;
  };

  const columns: Column<RCuentahabienteViewRow>[] = [
    { key: "numero_contrato", label: "N° Contrato" },
    { key: "nombre", label: "Nombre" },
    { key: "calle", label: "Calle" },
    { key: "telefono", label: "Teléfono" },
    { key: "total_pagado", label: "Total pagado" },
    { key: "saldo_pendiente", label: "Total pendiente" },
    { key: "estatus", label: "Estatus" },
  ];

  const fetchData = async () => {
    return await fetchAllCuentahabientes();
  };

  const handleDownloadAll = async () => {
    const rows = await fetchAllCuentahabientes();

    const headers = [
      "id_cuentahabiente",
      "numero_contrato",
      "nombre",
      "calle",
      "nombre_colonia",
      "telefono",
      "saldo_pendiente",
      "total_pagado",
      "estatus",
    ];

    const escape = (v: any) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`;

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id_cuentahabiente,
          r.numero_contrato,
          r.nombre,
          r.calle,
          r.nombre_colonia,
          r.telefono,
          r.saldo_pendiente,
          r.total_pagado,
          r.estatus,
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + lines.join("\n") + "\n"], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Registro_Cuentahabientes${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="table-with-action">
      <ReusableTable<RCuentahabienteViewRow>
        columns={columns}
        fetchData={fetchData}
        searchableFields={["nombre", "numero_contrato"]}
        itemsPerPage={10}
        title="Cuentahabientes Registrados"
        showActions={true}
        onEdit={async (row) => {
          const resp = await getCuentahabienteById(row.id_cuentahabiente);
          if (!resp.success || !resp.data) {
            console.error("No se pudo obtener el cuentahabiente para editar");
            return;
          }
          onEdit?.(resp.data);
        }}
      />

      <div className="table-with-action__footer">
        <button
          type="button"
          className="cuenta-download-btn"
          onClick={handleDownloadAll}
        >
          <Download size={18} />
          Exportar Excel
        </button>
      </div>
    </div>
  );
};

export default TablaCuentahabientes;
