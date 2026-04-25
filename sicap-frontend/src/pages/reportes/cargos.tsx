import React, { useState, useEffect } from "react";
import { CalendarDays, Download, FileText } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import {
  getReporteCargos,
  getAniosReporteCargos,
} from "../../services/reporte.cargos";

import ReporteCargosPDF from "../reportes/reporte_cargos";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const currentYear = new Date().getFullYear();

// ── Componente ────────────────────────────────────────────────────────────────

const ReporteCargos: React.FC = () => {
  const [downloadingGeneral, setDownloadingGeneral] = useState(false);
  const [selectedGeneralYear, setSelectedGeneralYear] =
    useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  useEffect(() => {
    const loadYears = async () => {
      try {
        const years = await getAniosReporteCargos();
        if (years.length > 0) {
          setAvailableYears(years);
          setSelectedGeneralYear(years[0]);
        }
      } catch {
        // mantiene año actual por defecto
      }
    };
    loadYears();
  }, []);

  const handleDownloadGeneral = async () => {
    try {
      setDownloadingGeneral(true);

      Swal.fire({
        title: "Generando PDF general de cargos...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });

      const rows = await getReporteCargos(selectedGeneralYear);

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: `No se encontraron cargos para el año ${selectedGeneralYear}.`,
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const blob = await pdf(
        <ReporteCargosPDF rows={rows} anio={selectedGeneralYear} />,
      ).toBlob();

      downloadBlobFile(
        blob,
        `Reporte_Cargos_General_${selectedGeneralYear}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
      );

      Swal.close();
    } catch (error: any) {
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

  return (
    <div className="reporte-tabla-wrapper">
      <div className="reporte-general-card">
        <div className="reporte-general-card__info">
          <span className="reporte-general-card__badge">
            Reporte consolidado
          </span>
          <h2 className="reporte-general-card__title">
            Descarga general de cargos por año
          </h2>
          <p className="reporte-general-card__text">
            Genera un PDF con todos los cargos registrados.
          </p>
        </div>

        <div className="reporte-general-card__actions">
          <div className="reporte-year-field">
            <label
              htmlFor="cargos-general-year"
              className="reporte-year-field__label"
            >
              <CalendarDays size={16} />
              <span>Año del reporte</span>
            </label>
            <select
              id="cargos-general-year"
              value={selectedGeneralYear}
              onChange={(e) => setSelectedGeneralYear(Number(e.target.value))}
              className="reporte-year-select"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="reporte-general-download-btn"
            onClick={handleDownloadGeneral}
            disabled={downloadingGeneral}
          >
            {downloadingGeneral ? (
              <>
                <FileText size={18} />
                <span>Generando general...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Descargar reporte general</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReporteCargos;
