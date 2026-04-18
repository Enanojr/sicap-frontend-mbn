import React, { useState, useEffect } from "react";
import { CalendarDays, Download } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import "../../styles/styles.css";

import { ReusableTable } from "../../components/tablas/registros_general";
import type { Column } from "../../components/tablas/registros_general";

import { getCalles, type CalleResponse } from "../../services/calle.service";

import {
  getEstadoCuentaNewDesglosado,
  type EstadoCuentaNewDetalleRow,
} from "../../services/reporte_cobradores";

import EstadoCuentaCallesPDF from "./reportepdf_calles";
import EstadoCuentaGeneralCallesPDF from "./reportegeneral_calles";

type Row = CalleResponse & {
  id_calle: number;
  nombre_calle: string;
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

const currentYear = new Date().getFullYear();

const ReporteCalles: React.FC = () => {
  const [refreshKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingGeneral, setDownloadingGeneral] = useState(false);

  const [selectedGeneralYear, setSelectedGeneralYear] =
    useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  const [selectedYearById, setSelectedYearById] = useState<
    Record<number, number | "">
  >({});
  const [yearsById, setYearsById] = useState<Record<number, number[]>>({});
  const [loadingYearsById, setLoadingYearsById] = useState<
    Record<number, boolean>
  >({});

  // Carga años disponibles globalmente al montar
  useEffect(() => {
    const loadYears = async () => {
      try {
        const rows = await getEstadoCuentaNewDesglosado();
        const years = [
          ...new Set(
            (rows || [])
              .map((r) => Number(r.anio))
              .filter((y) => !Number.isNaN(y)),
          ),
        ].sort((a, b) => b - a);

        if (years.length > 0) {
          setAvailableYears(years);
          setSelectedGeneralYear(years[0]);
        }
      } catch {
        // fallback al año actual
      }
    };
    loadYears();
  }, []);

  // Filtra por año y nombre de calle (comparación case-insensitive)
  const filterByYearAndCalle = (
    rows: EstadoCuentaNewDetalleRow[],
    year: number,
    nombreCalle: string,
  ): EstadoCuentaNewDetalleRow[] =>
    rows.filter(
      (r) =>
        Number(r.anio) === Number(year) &&
        (r.calle || "").trim().toLowerCase() ===
          nombreCalle.trim().toLowerCase(),
    );

  // Filtra solo por año (reporte general)
  const filterByYear = (
    rows: EstadoCuentaNewDetalleRow[],
    year: number,
  ): EstadoCuentaNewDetalleRow[] =>
    rows.filter((r) => Number(r.anio) === Number(year));

  // Fetch de calles para la tabla
  const fetchData = async (): Promise<Row[]> => {
    const result = await getCalles();
    if (!result.success) return [];
    const data = result.data?.results || result.data;
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      ...item,
      id_calle: Number(item.id_calle ?? item.id ?? 0),
      nombre_calle: String(item.nombre_calle ?? ""),
    }));
  };

  // Carga los años disponibles para una calle (reutiliza el global ya que
  // la API no filtra por calle, el filtro se hace en cliente)
  const loadYearsForCalle = async (id: number): Promise<number[]> => {
    try {
      if (yearsById[id]?.length) return yearsById[id];

      setLoadingYearsById((prev) => ({ ...prev, [id]: true }));

      const rows = await getEstadoCuentaNewDesglosado();
      const years = [
        ...new Set(
          (rows || [])
            .map((r) => Number(r.anio))
            .filter((y) => !Number.isNaN(y)),
        ),
      ].sort((a, b) => b - a);

      setYearsById((prev) => ({ ...prev, [id]: years }));

      setSelectedYearById((prev) => ({
        ...prev,
        [id]: prev[id] ?? (years.length > 0 ? years[0] : ""),
      }));

      return years;
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible obtener los años disponibles para esta calle.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
      return [];
    } finally {
      setLoadingYearsById((prev) => ({ ...prev, [id]: false }));
    }
  };

  const openYearPicker = async (id: number): Promise<number | null> => {
    let years = yearsById[id] || [];

    if (!years.length) {
      Swal.fire({
        title: "Cargando años...",
        text: "Espera un momento",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });
      years = await loadYearsForCalle(id);
      Swal.close();
    }

    if (!years.length) {
      Swal.fire({
        icon: "info",
        title: "Sin años disponibles",
        text: "Esta calle no tiene años disponibles para generar el reporte.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
      return null;
    }

    const inputOptions = years.reduce<Record<string, string>>((acc, year) => {
      acc[String(year)] = String(year);
      return acc;
    }, {});

    const result = await Swal.fire({
      title: "Seleccionar año",
      input: "select",
      inputOptions,
      inputValue: String(selectedYearById[id] || years[0]),
      inputPlaceholder: "Selecciona un año",
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#0f172a",
      color: "#e5e7eb",
      confirmButtonColor: "#38bdf8",
      cancelButtonColor: "#334155",
      customClass: {
        popup: "estado-year-modal",
        input: "estado-year-select",
        confirmButton: "estado-year-confirm-btn",
        cancelButton: "estado-year-cancel-btn",
        actions: "estado-year-actions",
      },
      inputValidator: (value) => {
        if (!value) return "Debes seleccionar un año";
        return undefined;
      },
    });

    if (!result.isConfirmed || !result.value) return null;

    const year = Number(result.value);
    setSelectedYearById((prev) => ({ ...prev, [id]: year }));
    return year;
  };

  // ── Descarga general: todas las calles del año ──
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

      const allRows = await getEstadoCuentaNewDesglosado();
      const rows = filterByYear(allRows, selectedGeneralYear);

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: `No se encontró información para el año ${selectedGeneralYear}.`,
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const blob = await pdf(
        <EstadoCuentaGeneralCallesPDF rows={rows} anio={selectedGeneralYear} />,
      ).toBlob();

      downloadBlobFile(
        blob,
        `Resumen_General_Calles_${selectedGeneralYear}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
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

  // ── Descarga individual: solo la calle seleccionada ──
  const handleDownloadByCalle = async (row: Row) => {
    const idCalle = Number(row.id_calle);

    if (!idCalle) {
      Swal.fire({
        icon: "warning",
        title: "Sin identificador",
        text: "Esta calle no tiene un id_calle válido.",
        background: "#0f172a",
        color: "#e5e7eb",
        confirmButtonColor: "#38bdf8",
      });
      return;
    }

    let yearToUse = selectedYearById[idCalle];

    if (!yearToUse) {
      const pickedYear = await openYearPicker(idCalle);
      if (pickedYear === null) return;
      yearToUse = pickedYear;
    }

    try {
      setDownloadingId(idCalle);

      Swal.fire({
        title: "Generando PDF...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });

      const allRows = await getEstadoCuentaNewDesglosado();
      const rows = filterByYearAndCalle(
        allRows,
        Number(yearToUse),
        row.nombre_calle,
      );

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: `Esta calle no tiene pagos registrados en el año ${yearToUse}.`,
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const blob = await pdf(
        <EstadoCuentaCallesPDF
          rows={rows}
          anio={Number(yearToUse)}
          nombreCalle={row.nombre_calle}
        />,
      ).toBlob();

      downloadBlobFile(
        blob,
        `Estado_Cuenta_${sanitizeFileName(row.nombre_calle)}_${yearToUse}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
      );

      Swal.close();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "No fue posible generar el PDF de la calle.",
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
      key: "nombre_calle",
      label: "Calle",
      render: (_, item) => item.nombre_calle,
    },
    {
      key: "anio_descarga" as any,
      label: "Año",
      render: (_, row) => {
        const id = row.id_calle;
        const selectedYear = selectedYearById[id];
        const isLoadingYears = !!loadingYearsById[id];

        return (
          <button
            type="button"
            className="estado-year-trigger"
            onClick={() => openYearPicker(id)}
            disabled={isLoadingYears}
            title="Seleccionar año"
          >
            <CalendarDays size={16} />
            <span>
              {isLoadingYears
                ? "Cargando..."
                : selectedYear
                  ? String(selectedYear)
                  : "Seleccionar"}
            </span>
          </button>
        );
      },
    },
    {
      key: "id_calle",
      label: "Descarga",
      render: (_, row) => (
        <button
          type="button"
          className="estado-download-btn"
          onClick={() => handleDownloadByCalle(row)}
          disabled={downloadingId === row.id_calle}
          style={{ whiteSpace: "nowrap" }}
        >
          <Download size={16} />
          {downloadingId === row.id_calle ? "Generando..." : "Descargar PDF"}
        </button>
      ),
    },
  ];

  return (
    <div className="reporte-tabla-wrapper">
      {/* ── Tarjeta de descarga general ── */}
      <div className="reporte-general-card">
        <div className="reporte-general-card__info">
          <span className="reporte-general-card__badge">
            Reporte consolidado
          </span>
          <h2 className="reporte-general-card__title">
            Descarga general por año
          </h2>
          <p className="reporte-general-card__text">
            Genera un PDF con el resumen de pagos de todas las calles
            registradas para el año seleccionado.
          </p>
        </div>

        <div className="reporte-general-card__actions">
          <div className="reporte-year-field">
            <label
              htmlFor="general-year-select-calles"
              className="reporte-year-field__label"
            >
              <CalendarDays size={16} />
              <span>Año del reporte</span>
            </label>
            <select
              id="general-year-select-calles"
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
            <Download size={18} />
            <span>
              {downloadingGeneral
                ? "Generando general..."
                : "Descargar reporte general"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Tabla por calle ── */}
      <div className="reporte-table-card">
        <div className="reporte-table-card__header">
          <div>
            <span className="reporte-table-card__eyebrow">Listado</span>
            <h3 className="reporte-table-card__title">Calles registradas</h3>
            <p className="reporte-table-card__subtitle">
              Selecciona el año por calle o descarga el resumen general.
            </p>
          </div>
        </div>

        <div className="reporte-table-card__body">
          <ReusableTable<Row>
            key={refreshKey}
            columns={columns}
            fetchData={fetchData}
            searchableFields={["nombre_calle"]}
            itemsPerPage={10}
            showActions={false}
            title="Calles Registradas"
          />
        </div>
      </div>
    </div>
  );
};

export default ReporteCalles;
