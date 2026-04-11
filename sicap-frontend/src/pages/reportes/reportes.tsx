import React, { useState, useEffect } from "react";
import { CalendarDays, Download } from "lucide-react";
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

const currentYear = new Date().getFullYear();

const Reporte: React.FC = () => {
  const [refreshKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingGeneral, setDownloadingGeneral] = useState(false);

  // ── Selector global para reporte general ───────────────────────────────
  const [selectedGeneralYear, setSelectedGeneralYear] =
    useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  // ── Selector por fila, como Estado de Cuenta ───────────────────────────
  const [selectedYearById, setSelectedYearById] = useState<
    Record<number, number | "">
  >({});
  const [yearsById, setYearsById] = useState<Record<number, number[]>>({});
  const [loadingYearsById, setLoadingYearsById] = useState<
    Record<number, boolean>
  >({});

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
        // Si falla, dejamos el año actual por defecto
      }
    };

    loadYears();
  }, []);

  const filterByYear = (
    rows: EstadoCuentaNewDetalleRow[],
    year: number,
  ): EstadoCuentaNewDetalleRow[] =>
    rows.filter((r) => Number(r.anio) === Number(year));

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
    anio: number,
  ) => {
    const blob = await pdf(
      <EstadoCuentaCobradoresPDF rows={rows} anio={anio} />,
    ).toBlob();

    downloadBlobFile(blob, fileName);
  };

  // ── Cargar años disponibles por cobrador ───────────────────────────────
  const loadYearsForCobrador = async (id: number): Promise<number[]> => {
    try {
      if (yearsById[id]?.length) return yearsById[id];

      setLoadingYearsById((prev) => ({ ...prev, [id]: true }));

      const rows = await getEstadoCuentaNewDesglosado(id);

      const years = [
        ...new Set(
          (rows || [])
            .map((r) => Number(r.anio))
            .filter((year) => !Number.isNaN(year)),
        ),
      ].sort((a, b) => b - a);

      setYearsById((prev) => ({ ...prev, [id]: years }));

      if (years.length > 0) {
        setSelectedYearById((prev) => ({
          ...prev,
          [id]: prev[id] ?? years[0],
        }));
      } else {
        setSelectedYearById((prev) => ({
          ...prev,
          [id]: "",
        }));
      }

      return years;
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible obtener los años disponibles para este cobrador.",
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

      years = await loadYearsForCobrador(id);
      Swal.close();
    }

    if (!years.length) {
      Swal.fire({
        icon: "info",
        title: "Sin años disponibles",
        text: "Este cobrador no tiene años disponibles para generar el reporte.",
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

    const currentValue = String(selectedYearById[id] || years[0]);

    const result = await Swal.fire({
      title: "Seleccionar año",
      input: "select",
      inputOptions,
      inputValue: currentValue,
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

    setSelectedYearById((prev) => ({
      ...prev,
      [id]: year,
    }));

    return year;
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
        <EstadoCuentaGeneralPDF rows={rows} anio={selectedGeneralYear} />,
      ).toBlob();

      downloadBlobFile(
        blob,
        `Resumen_General_Cobradores_${selectedGeneralYear}_${new Date()
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

    let yearToUse = selectedYearById[idCobrador];

    if (!yearToUse) {
      const pickedYear = await openYearPicker(idCobrador);
      if (pickedYear === null) return;
      yearToUse = pickedYear;
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

      const allRows = await getEstadoCuentaNewDesglosado(idCobrador);
      const rows = filterByYear(allRows, Number(yearToUse));

      if (!rows.length) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: `Este cobrador no tiene pagos en el año ${yearToUse}.`,
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
        `Estado_Cuenta_${sanitizeFileName(nombre)}_${yearToUse}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
        Number(yearToUse),
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
      key: "anio_descarga" as any,
      label: "Año",
      render: (_, row) => {
        const id = row.id_cobrador;
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
        <select
          value={selectedGeneralYear}
          onChange={(e) => setSelectedGeneralYear(Number(e.target.value))}
          className="reporte-year-select"
          style={{
            marginRight: "12px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #334155",
            backgroundColor: "#1e293b",
            color: "#e5e7eb",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

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
