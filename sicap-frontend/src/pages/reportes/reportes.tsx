import React, { useState } from "react";
import { Download } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import "../../styles/styles.css";

import { ReusableTable } from "../../components/tablas/registros_general";
import type { Column } from "../../components/tablas/registros_general";

import {
  getCobradores,
  type CobradorResponse,
} from "../../services/Rcobradores.service";

import {
  getEstadoCuentaNewDesglosado,
  type EstadoCuentaNewDetalleRow,
} from "../../services/reporte_cobradores";

import EstadoCuentaCobradoresPDF from "../../pages/reportes/reportepdf";
// Agrega el import
import EstadoCuentaGeneralPDF from "../../pages/reportes/reporte_general";
type Row = CobradorResponse & {
  id_cobrador: number;
  nombre_completo: string;
  usuario_texto: string;
};

const sanitizeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .trim();

const downloadBlobFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Reporte: React.FC = () => {
  const [refreshKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingGeneral, setDownloadingGeneral] = useState(false);

  const fetchData = async (): Promise<Row[]> => {
    const result = await getCobradores();

    if (!result.success) return [];

    const data = (result.data as any)?.results || result.data;
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      ...item,
      id_cobrador: Number(item.id_cobrador ?? item.id ?? 0),
      nombre_completo: `${item.nombre ?? ""} ${item.apellidos ?? ""}`
        .replace(/\s+/g, " ")
        .trim(),
      usuario_texto: String(item.usuario ?? ""),
    }));
  };

  const generarPDF = async (
    rows: EstadoCuentaNewDetalleRow[],
    fileName: string,
  ) => {
    const blob = await pdf(<EstadoCuentaCobradoresPDF rows={rows} />).toBlob();

    downloadBlobFile(blob, fileName);
  };

  const handleDownloadGeneral = async () => {
    try {
      setDownloadingGeneral(true);

      Swal.fire({
        title: "Generando PDF general...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });

      const rows = await getEstadoCuentaNewDesglosado();

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontró información para generar el PDF general.",
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      // ← Aquí el cambio: usa el PDF de resumen, no el detallado
      const blob = await pdf(<EstadoCuentaGeneralPDF rows={rows} />).toBlob();

      downloadBlobFile(
        blob,
        `Resumen_General_Cobradores_${new Date().toISOString().slice(0, 10)}.pdf`,
      );

      Swal.close();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "No fue posible generar el PDF general.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
    } finally {
      setDownloadingGeneral(false);
    }
  };

  const handleDownloadByCobrador = async (row: Row) => {
    const idCobrador = Number(row.id_cobrador);

    if (!idCobrador) {
      Swal.fire({
        icon: "warning",
        title: "Sin identificador",
        text: "Este cobrador no tiene un id_cobrador válido.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
      return;
    }

    try {
      setDownloadingId(idCobrador);

      Swal.fire({
        title: "Generando PDF...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });

      const rows = await getEstadoCuentaNewDesglosado(idCobrador);

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "Este cobrador no tiene pagos disponibles para generar el PDF.",
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const nombre =
        row.nombre_completo || rows[0]?.nombre_cobrador || "Cobrador";

      await generarPDF(
        rows,
        `Estado_Cuenta_${sanitizeFileName(nombre)}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
      );

      Swal.close();
    } catch (error: any) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "No fue posible generar el PDF del cobrador.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "nombre_completo",
      label: "Nombre",
      render: (_, item) => item.nombre_completo,
    },
    {
      key: "usuario",
      label: "Usuario",
    },
    {
      key: "id_cobrador",
      label: "Descarga",
      render: (_, row) => (
        <button
          type="button"
          className="estado-download-btn"
          onClick={() => handleDownloadByCobrador(row)}
          disabled={downloadingId === row.id_cobrador}
          style={{ whiteSpace: "nowrap" }}
        >
          <Download size={16} />
          {downloadingId === row.id_cobrador ? "Generando..." : "Descargar PDF"}
        </button>
      ),
    },
  ];

  return (
    <div className="reporte-tabla-wrapper">
      <div className="reporte-tabla-btn-general">
        <button
          type="button"
          className="estado-download-btn"
          onClick={handleDownloadGeneral}
          disabled={downloadingGeneral}
        >
          <Download size={16} />
          {downloadingGeneral ? "Generando general..." : "Descargar general"}
        </button>
      </div>

      <ReusableTable<Row>
        key={refreshKey}
        columns={columns}
        fetchData={fetchData}
        searchableFields={["nombre_completo", "usuario_texto"]}
        itemsPerPage={10}
        showActions={false}
        title="Cobradores Registrados"
      />
    </div>
  );
};

export default Reporte;
