import { useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import "../../styles/styles.css";

import {
  ReusableTable,
  type Column,
} from "../../components/tablas/registros_general";
import { getCuentahabientes } from "../../services/Rcuentahabientes.service";
import { getEstadoCuentaDetalleById } from "../../services/Estado_cuenta.service";
import { getEstadoCuentaResumenById } from "../../services/estado_cuenta_resumen";
import EstadoCuentaPDF from "../../pages/Estado_Cuenta/EstadoCuentaPDF";

type Row = {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
  nombre_completo: string;
  contrato_texto: string;
};

export default function EstadoCuentaPage() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedYearById, setSelectedYearById] = useState<
    Record<number, number | "">
  >({});
  const [yearsById, setYearsById] = useState<Record<number, number[]>>({});
  const [loadingYearsById, setLoadingYearsById] = useState<
    Record<number, boolean>
  >({});

  const fetchAllCuentahabientes = async (): Promise<Row[]> => {
    let url: string | null = "/cuentahabientes/";
    let all: Row[] = [];

    while (url) {
      const resp = await getCuentahabientes(url);
      if (!resp?.success || !resp?.data) break;

      const pageItems = resp.data.results ?? resp.data;

      const rows: Row[] = (pageItems || []).map((r: any) => {
        const nombres = r.nombres ?? "";
        const ap = r.ap ?? "";
        const am = r.am ?? "";
        const nombre_completo = `${nombres} ${ap} ${am}`
          .replace(/\s+/g, " ")
          .trim();

        return {
          id_cuentahabiente: r.id_cuentahabiente,
          numero_contrato: r.numero_contrato,
          nombres,
          ap,
          am,
          nombre_completo,
          contrato_texto: String(r.numero_contrato ?? ""),
        };
      });

      all = [...all, ...rows];
      url = resp.data.next;
    }

    return all;
  };

  const loadYearsForCuentahabiente = async (id: number): Promise<number[]> => {
    try {
      if (yearsById[id]?.length) return yearsById[id];

      setLoadingYearsById((prev) => ({
        ...prev,
        [id]: true,
      }));

      const resumenRows = await getEstadoCuentaResumenById(id);

      const years = [
        ...new Set(
          (resumenRows || [])
            .map((r) => Number(r.anio))
            .filter((year) => !Number.isNaN(year)),
        ),
      ].sort((a, b) => b - a);

      setYearsById((prev) => ({
        ...prev,
        [id]: years,
      }));

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
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible obtener los años disponibles.",
      });
      return [];
    } finally {
      setLoadingYearsById((prev) => ({
        ...prev,
        [id]: false,
      }));
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

      years = await loadYearsForCuentahabiente(id);
      Swal.close();
    }

    if (!years.length) {
      Swal.fire({
        icon: "info",
        title: "Sin años disponibles",
        text: "Este cuentahabiente no tiene años disponibles para generar el estado de cuenta.",
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

  const handleDownloadPDF = async (
    id_cuentahabiente: number,
    anioSeleccionado: number,
  ) => {
    try {
      setDownloadingId(id_cuentahabiente);

      Swal.fire({
        title: "Generando Estado de Cuenta...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#0f172a",
        color: "#e5e7eb",
      });

      const [detalleRows, resumenRows] = await Promise.all([
        getEstadoCuentaDetalleById(id_cuentahabiente),
        getEstadoCuentaResumenById(id_cuentahabiente),
      ]);

      const detalleDelAnio = (detalleRows || []).filter(
        (r) => Number(r.anio) === Number(anioSeleccionado),
      );

      const resumenDelAnio =
        (resumenRows || []).find(
          (r) => Number(r.anio) === Number(anioSeleccionado),
        ) ?? null;

      if (!detalleDelAnio.length && !resumenDelAnio) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: `No se encontró información para el año ${anioSeleccionado}.`,
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const base = detalleDelAnio[0] ?? detalleRows[0];

      if (!base && !resumenDelAnio) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontró información para generar el PDF.",
          background: "#0f172a",
          color: "#e5e7eb",
          confirmButtonColor: "#38bdf8",
        });
        return;
      }

      const data = {
        numero_contrato:
          resumenDelAnio?.numero_contrato ?? base?.numero_contrato ?? 0,
        nombre: base?.nombre ?? "",
        direccion: base?.direccion ?? "",
        telefono: base?.telefono ?? "",
        anio: anioSeleccionado,
        nombre_servicio: resumenDelAnio?.nombre_servicio ?? "",
        estatus: resumenDelAnio?.estatus ?? base?.deuda ?? "",
        saldo_pendiente: Number(
          resumenDelAnio?.saldo_pendiente ?? base?.saldo_pendiente ?? 0,
        ),
        historico: detalleDelAnio.map((r) => ({
          fecha_pago: r.fecha_pago,
          tipo_movimiento: r.tipo_movimiento,
          monto_recibido: Number(r.monto_recibido || 0),
        })),
      };

      const blob = await pdf(<EstadoCuentaPDF data={data} />).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EstadoCuenta_${data.numero_contrato}_${data.anio}_${data.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.close();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "No fue posible generar el estado de cuenta.",
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
      label: "Cuentahabiente",
      render: (_, row) => row.nombre_completo,
    },
    {
      key: "numero_contrato",
      label: "Contrato",
    },
    {
      key: "anio_descarga" as any,
      label: "Año",
      render: (_, row) => {
        const id = row.id_cuentahabiente;
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
      key: "id_cuentahabiente" as any,
      label: "Estado de cuenta",
      render: (_, row) => {
        const id = row.id_cuentahabiente;

        return (
          <button
            type="button"
            className="estado-download-btn"
            onClick={async () => {
              const selectedYear = selectedYearById[id];

              if (selectedYear) {
                handleDownloadPDF(id, selectedYear);
                return;
              }

              const pickedYear = await openYearPicker(id);

              if (pickedYear === null) return;

              handleDownloadPDF(id, pickedYear);
            }}
            disabled={downloadingId === id}
            title="Descargar estado de cuenta"
            style={{ whiteSpace: "nowrap" }}
          >
            <Download size={16} />
            {downloadingId === id ? "Generando..." : "Descargar PDF"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="table-with-action">
      <ReusableTable<Row>
        columns={columns}
        fetchData={fetchAllCuentahabientes}
        searchableFields={["nombre_completo", "contrato_texto"]}
        itemsPerPage={10}
        title="Estado de Cuenta"
        showActions={false}
      />
    </div>
  );
}
