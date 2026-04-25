import React, { useState, useEffect } from "react";
import { CalendarDays, Download, FileText } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import {
  getPadronGeneral,
  getAniosPadronGeneral,
} from "../../services/reporte_padron";

import PadronGeneralPDF from "../reportes/padron_general";

const currentYear = new Date().getFullYear();

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

const ReportePadronGeneral: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [downloading, setDownloading] = useState(false);

  // Cargar años disponibles al montar
  useEffect(() => {
    const loadYears = async () => {
      try {
        const years = await getAniosPadronGeneral();
        if (years.length > 0) {
          setAvailableYears(years);
          setSelectedYear(years[0]);
        }
      } catch {}
    };

    loadYears();
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      Swal.fire({
        title: "Generando PDF del padrón...",
        text: "Un momento, esto puede tardar algunos segundos.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });

      const rows = await getPadronGeneral(selectedYear);

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: `No se encontró información para el año ${selectedYear}.`,
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const blob = await pdf(
        <PadronGeneralPDF rows={rows} anio={selectedYear} />,
      ).toBlob();

      downloadBlobFile(
        blob,
        `Padron_General_${selectedYear}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
      );

      Swal.close();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.message || "No fue posible generar el PDF del padrón general.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="reporte-tabla-wrapper">
      <div className="reporte-general-card">
        <div className="reporte-general-card__info">
          <span className="reporte-general-card__badge">Reporte de padrón</span>
          <h2 className="reporte-general-card__title">
            Padrón general de cuentahabientes
          </h2>
          <p className="reporte-general-card__text">
            Genera un PDF con el listado completo de cuentahabientes y sus
            montos recaudados.
          </p>
        </div>

        <div className="reporte-general-card__actions">
          {/* Selector de año */}
          <div className="reporte-year-field">
            <label
              htmlFor="padron-year-select"
              className="reporte-year-field__label"
            >
              <CalendarDays size={16} />
              <span>Año del reporte</span>
            </label>

            <select
              id="padron-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="reporte-year-select"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Botón de descarga */}
          <button
            type="button"
            className="reporte-general-download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <FileText size={18} />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Descargar padrón general</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportePadronGeneral;
