import React, { useEffect, useState } from "react";
import { ReusableTable, type Column } from "./registros_general";

import {
  getCuentahabientes,
  deleteCuentahabiente,
  type CuentahabienteResponse,
} from "../../services/Rcuentahabientes.service";

import { getColonias } from "../../services/Rcolonias.service";
import { getAllServicios } from "../../services/servicios.service";

import Swal from "sweetalert2";

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
    { key: "numero_contrato", label: "Contrato" },

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
      key: "servicio",
      label: "Servicio",
      render: (value) => servicioMap[value] ?? `ID: ${value}`,
    },
  ];

  const fetchData = async () => {
    return await fetchAllCuentahabientes();
  };

  const handleDelete = async (row: CuentahabienteRow): Promise<boolean> => {
    const confirm = await Swal.fire({
      title: "¿Eliminar cuentahabiente?",
      text: `Contrato: ${row.numero_contrato}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Eliminar",
    });

    // 🔥
    if (!confirm.isConfirmed) return false;

    const resp = await deleteCuentahabiente(row.id_cuentahabiente);

    if (resp.success) {
      Swal.fire("Eliminado", "El cuentahabiente fue eliminado", "success");
      return true;
    } else {
      Swal.fire("Error", "No se pudo eliminar", "error");
      return false;
    }
  };

  return (
    <ReusableTable<CuentahabienteRow>
      columns={columns}
      fetchData={fetchData}
      searchableFields={["nombres", "ap", "am", "numero_contrato"]}
      itemsPerPage={10}
      title="Cuentahabientes Registrados"
      showActions={true}
      onEdit={onEdit}
      onDelete={handleDelete}
    />
  );
};

export default TablaCuentahabientes;
