import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { ReusableTable, type Column } from "./registros_general";

import {
  getCuentahabientes,
  type CuentahabienteResponse,
} from "../../services/Rcuentahabientes.service";

import { getColonias } from "../../services/Rcolonias.service";
import { getAllServicios } from "../../services/servicios.service";

interface CuentahabienteRow {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
  calle: string;
  numero: number;
  telefono: string;
  colonia: number;
  servicio: number;
  deuda?: string;
  saldo_pendiente?: number;
}

const TablaCuentahabientes: React.FC<{
  onEdit?: (c: CuentahabienteResponse) => void;
}> = ({ onEdit }) => {
  const [coloniaMap, setColoniaMap] = useState<Record<number, string>>({});
  const [servicioMap, setServicioMap] = useState<Record<number, string>>({});

  const fetchAllCuentahabientes = async (): Promise<CuentahabienteRow[]> => {
    let url: string | null = "/cuentahabientes/";
    let allResults: CuentahabienteRow[] = [];

    while (url) {
      const resp = await getCuentahabientes(url);
      if (!resp.success || !resp.data) break;

      const pageItems = resp.data.results ?? resp.data;

      const rows = pageItems.map((r: any) => ({
        id_cuentahabiente: r.id_cuentahabiente,
        numero_contrato: r.numero_contrato,
        nombres: r.nombres,
        ap: r.ap,
        am: r.am,
        calle: r.calle,
        numero: r.numero,
        telefono: r.telefono,
        colonia: r.colonia,
        servicio: r.servicio,
        deuda: r.deuda ?? "",
        saldo_pendiente: r.saldo_pendiente ?? 0,
      }));

      allResults = [...allResults, ...rows];
      url = resp.data.next;
    }

    return allResults;
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [coloniasResp, serviciosResp] = await Promise.all([
          getColonias(),
          getAllServicios(),
        ]);

        const colonias = coloniasResp.data.results ?? coloniasResp.data;
        const cMap: Record<number, string> = {};
        colonias.forEach((c: any) => {
          cMap[c.id_colonia] = `${c.nombre_colonia} (CP: ${c.codigo_postal})`;
        });
        setColoniaMap(cMap);

        const sMap: Record<number, string> = {};
        serviciosResp.forEach((s: any) => {
          sMap[s.id_tipo_servicio] = s.nombre;
        });
        setServicioMap(sMap);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };

    loadCatalogs();
  }, []);

  const columns: Column<CuentahabienteRow>[] = [
    { key: "id_cuentahabiente", label: "ID " },
    { key: "numero_contrato", label: "Número de Contrato" },
    {
      key: "nombres",
      label: "Nombre Completo",
      render: (_, row) =>
        `${row.nombres} ${row.ap ?? ""} ${row.am ?? ""}`.trim(),
    },
    {
      key: "calle",
      label: "Domicilio",
      render: (_, row) => `${row.calle} #${row.numero}`,
    },
    {
      key: "colonia",
      label: "Colonia",
      render: (value) => coloniaMap[value] ?? `ID: ${value}`,
    },
    {
      key: "telefono",
      label: "Teléfono",
      render: (value) => String(value ?? ""),
    },
  ];

  const fetchData = async () => {
    return await fetchAllCuentahabientes();
  };

  const handleDownloadAll = async () => {
    const rows = await fetchAllCuentahabientes();

    const headers = [
      "id_cuentahabiente",
      "numero_contrato",
      "nombres",
      "ap",
      "am",
      "calle",
      "numero",
      "telefono",
      "colonia",
      "servicio",
      "deuda",
      "saldo_pendiente",
    ];

    const escape = (v: any) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`;

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id_cuentahabiente,
          r.numero_contrato,
          r.nombres,
          r.ap ?? "",
          r.am ?? "",
          r.calle,
          r.numero,
          r.telefono,
          coloniaMap[r.colonia] ?? r.colonia,
          servicioMap[r.servicio] ?? r.servicio,
          r.deuda ?? "",
          r.saldo_pendiente ?? 0,
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
    a.download = `cuentahabientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="table-with-action">
      <ReusableTable<CuentahabienteRow>
        columns={columns}
        fetchData={fetchData}
        searchableFields={["nombres", "ap", "am", "numero_contrato"]}
        itemsPerPage={10}
        title="Cuentahabientes Registrados"
        showActions={true}
        onEdit={onEdit}
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
