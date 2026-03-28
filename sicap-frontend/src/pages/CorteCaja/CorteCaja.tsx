import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { DateRange } from "react-date-range";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import logoImg from "../../assets/Logo.png";

import { generarCorteCaja } from "../../services/CorteCaja.service";
import type { CorteCajaResponse } from "../../services/CorteCaja.service";
import { getCobradores } from "../../services/Rcobradores.service";
import type { CobradorResponse } from "../../services/Rcobradores.service";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "../../styles/styles.css";

const CorteCaja: React.FC = () => {
  const [state, setState] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [corteGenerado, setCorteGenerado] = useState<CorteCajaResponse | null>(
    null,
  );

  // ── Cobradores ──
  const [cobradores, setCobradores] = useState<CobradorResponse[]>([]);
  const [cobradorSeleccionado, setCobradorSeleccionado] =
    useState<CobradorResponse | null>(null);
  const [loadingCobradores, setLoadingCobradores] = useState(false);

  useEffect(() => {
    const cargarCobradores = async () => {
      setLoadingCobradores(true);
      const response = await getCobradores();

      if (response.success && response.data) {
        // DRF devuelve { count, next, previous, results: [...] }
        const lista = Array.isArray(response.data)
          ? response.data
          : ((response.data as any).results ?? []);
        setCobradores(lista);
      } else {
        Swal.fire("Error", "No se pudieron cargar los cobradores", "error");
      }
      setLoadingCobradores(false);
    };
    cargarCobradores();
  }, []);

  const handleSelect = (ranges: any) => {
    setState([ranges.selection]);
  };

  // ── PDF ──
  const generarPDF = () => {
    if (!corteGenerado) return;

    const doc = new jsPDF();
    const info = corteGenerado.corte_info;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const colorAzulOscuro = [0, 48, 87];
    const colorAzulTitulo = [0, 51, 153];
    const colorBordeGris = [200, 200, 200];

    const nombreResponsable = cobradorSeleccionado
      ? `${cobradorSeleccionado.nombre} ${cobradorSeleccionado.apellidos}`
      : "Sin responsable";

    const addWatermark = () => {
      const imgSize = 120;
      const xCentered = (pageWidth - imgSize) / 2;
      const yCentered = (pageHeight - imgSize) / 2 + 20;
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
      doc.addImage(logoImg, "PNG", xCentered, yCentered, imgSize, imgSize);
      doc.restoreGraphicsState();
    };

    // Encabezado
    doc.addImage(logoImg, "PNG", 15, 10, 30, 30);
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text("GUADALUPE HIDALGO,", 30, 42, { align: "center" });
    doc.text("ACUAMANALA. 2026", 30, 45, { align: "center" });

    // Tarjeta superior derecha
    doc.setDrawColor(colorBordeGris[0], colorBordeGris[1], colorBordeGris[2]);
    doc.roundedRect(80, 10, 115, 35, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(
      colorAzulTitulo[0],
      colorAzulTitulo[1],
      colorAzulTitulo[2],
    );
    doc.text("Corte de colecta", 85, 18);

    doc.setFontSize(10);
    doc.text(`${info.fecha_inicio} al ${info.fecha_fin}`, 130, 18);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Numero de corte", 85, 26);
    doc.setFont("helvetica", "normal");
    doc.text(`#${info.folio_corte}`, 130, 26);

    doc.setFont("helvetica", "bold");
    doc.text("Responsable", 85, 32);
    doc.setFont("helvetica", "normal");
    doc.text(nombreResponsable, 130, 32);

    doc.setFont("helvetica", "bold");
    doc.text("Dirección", 85, 38);
    doc.setFont("helvetica", "normal");
    doc.text("Guadalupe Hidalgo,", 130, 38);
    doc.text("Acuamanala, Tlaxcala, C.P. 90860", 130, 42);

    // Título tabla
    doc.setDrawColor(colorBordeGris[0], colorBordeGris[1], colorBordeGris[2]);
    doc.roundedRect(15, 55, 180, 10, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(
      colorAzulTitulo[0],
      colorAzulTitulo[1],
      colorAzulTitulo[2],
    );
    doc.text("Tabla de información de colecta", 20, 61);

    const tablaCuerpo = corteGenerado.movimientos.map((mov) => [
      mov.fecha_pago,
      mov.usuario,
      mov.tipo,
      `$${mov.monto_recibido}`,
      mov.cobrador,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [
        [
          "Fecha",
          "Nombre de usuario",
          "Tipo",
          "Monto cobrado",
          "Responsable de cobro",
        ],
      ],
      body: tablaCuerpo,
      theme: "plain",
      headStyles: {
        fillColor: [colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 4,
      },
      bodyStyles: {
        fillColor: false,
        textColor: 0,
        halign: "center",
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, fontStyle: "italic" },
        3: { cellWidth: 25, fontStyle: "bold" },
        4: { cellWidth: "auto" },
      },
      didDrawCell: (data) => {
        if (
          data.section === "body" &&
          data.row.index < tablaCuerpo.length - 1
        ) {
          doc.setDrawColor(200, 200, 200);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
        }
      },
      didDrawPage: () => {
        addWatermark();
      },
    });

    const yFirmaFijo = pageHeight - 60;
    const finalYTabla = (doc as any).lastAutoTable.finalY;

    if (finalYTabla > yFirmaFijo - 20) {
      doc.addPage();
      addWatermark();
    }

    // Marca de agua texto
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 150, 150);
    doc.text("GUADALUPE HIDALGO,", pageWidth / 2, yFirmaFijo - 10, {
      align: "center",
    });
    doc.text("ACUAMANALA. 2026", pageWidth / 2, yFirmaFijo + 2, {
      align: "center",
    });
    doc.restoreGraphicsState();

    // Total
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total recaudado: $ ${info.gran_total}`, 180, yFirmaFijo - 20, {
      align: "right",
    });

    // Firma
    doc.text("Firma", pageWidth / 2, yFirmaFijo, { align: "center" });
    doc.setDrawColor(0, 48, 87);
    doc.line(70, yFirmaFijo + 5, 140, yFirmaFijo + 5);
    doc.setFontSize(11);
    doc.text(nombreResponsable, pageWidth / 2, yFirmaFijo + 12, {
      align: "center",
    });

    // Pie de página
    const totalPages = doc.getNumberOfPages();
    const fechaImpresion = format(new Date(), "dd/MM/yyyy");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.text("Documento generado automáticamente", 15, pageHeight - 10);
      doc.text(
        "Guadalupe Hidalgo Acuamanala, C.P. 90860",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
      doc.text(fechaImpresion, pageWidth - 15, pageHeight - 10, {
        align: "right",
      });
    }

    doc.save(`Corte_Caja_${info.folio_corte}.pdf`);
  };

  // ── Confirmar corte ──
  const handleConfirmarCorte = async () => {
    if (!cobradorSeleccionado) {
      Swal.fire(
        "Atención",
        "Por favor selecciona un cobrador antes de generar el corte.",
        "warning",
      );
      return;
    }

    const { startDate, endDate } = state[0];
    const fechaInicioAPI = format(startDate, "yyyy-MM-dd");
    const fechaFinAPI = format(endDate, "yyyy-MM-dd");

    const result = await Swal.fire({
      title: "Confirmar Corte",
      html: `
        <p>Generar corte del <b>${format(startDate, "dd/MM/yyyy")}</b> al <b>${format(endDate, "dd/MM/yyyy")}</b></p>
        <p>Cobrador: <b>${cobradorSeleccionado.nombre} ${cobradorSeleccionado.apellidos}</b></p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, Generar",
      confirmButtonColor: "#003057",
    });

    if (result.isConfirmed) {
      procesarCorte(fechaInicioAPI, fechaFinAPI);
    }
  };

  const procesarCorte = async (fInicio: string, fFin: string) => {
    setLoading(true);
    setShowCalendar(false);
    setCorteGenerado(null);

    try {
      const response = await generarCorteCaja({
        fecha_inicio: fInicio,
        fecha_fin: fFin,
        cobrador_id: cobradorSeleccionado!.id_cobrador,
      });

      if (response.success && response.data) {
        setCorteGenerado(response.data);
        Swal.fire({
          icon: "success",
          title: "¡Corte Exitoso!",
          text: `Folio #${response.data.corte_info.folio_corte}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", response.errors?.general || "Error", "error");
      }
    } catch {
      Swal.fire("Error", "Fallo de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──
  return (
    <div className="corte-container">
      {/* TARJETA GENERADOR */}
      <div className="corte-card">
        <div className="corte-header">
          <h2>Generador de Corte de Caja</h2>
          <p>Selecciona el cobrador y el rango de fechas a procesar</p>
        </div>

        <div className="corte-body">
          {/* ── SELECTOR DE COBRADOR ── */}
          {/* ── SELECTOR DE COBRADOR ── */}
          <div className="corte-selector-group">
            <label className="corte-label">Cobrador</label>

            {loadingCobradores ? (
              <p className="corte-cobradores-loading">Cargando cobradores...</p>
            ) : (
              <div className="cdc-select-wrapper">
                <select
                  className="cdc-select"
                  value={cobradorSeleccionado?.id_cobrador ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const cobrador =
                      cobradores.find((c) => c.id_cobrador === id) ?? null;
                    setCobradorSeleccionado(cobrador);
                  }}
                >
                  <option value="" disabled>
                    — Selecciona un cobrador —
                  </option>
                  {cobradores.map((cobrador) => (
                    <option
                      key={cobrador.id_cobrador}
                      value={cobrador.id_cobrador}
                    >
                      {cobrador.nombre} {cobrador.apellidos}
                    </option>
                  ))}
                </select>
                <span className="cdc-select-arrow">▼</span>
              </div>
            )}
          </div>

          {/* ── SELECTOR DE FECHA ── */}
          <div className="corte-selector-group">
            <label className="corte-label">Periodo del Corte</label>

            <button
              className={`corte-date-btn ${showCalendar ? "active" : ""}`}
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <div className="corte-date-text">
                <svg
                  className="corte-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {format(state[0].startDate, "dd MMM yyyy", { locale: es })}
                </span>
                <span className="corte-arrow">➝</span>
                <span>
                  {format(state[0].endDate, "dd MMM yyyy", { locale: es })}
                </span>
              </div>
              <svg
                className={`corte-icon ${showCalendar ? "rotate" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showCalendar && (
              <div className="corte-calendar-popover">
                <DateRange
                  editableDateInputs={true}
                  onChange={handleSelect}
                  moveRangeOnFirstSelection={false}
                  ranges={state}
                  locale={es}
                  rangeColors={["#003057"]}
                  months={2}
                  direction="horizontal"
                />
              </div>
            )}
          </div>

          <button
            className="corte-btn-generate"
            onClick={handleConfirmarCorte}
            disabled={loading || !cobradorSeleccionado}
          >
            {loading ? "Procesando..." : "Generar Corte Ahora"}
          </button>
        </div>
      </div>

      {/* RESULTADOS */}
      {corteGenerado && (
        <div className="corte-result-card">
          <div className="corte-result-header">
            <h3>
              Resumen de Corte{" "}
              <span className="corte-folio">
                #{corteGenerado.corte_info.folio_corte}
              </span>
            </h3>
          </div>

          <div className="corte-summary-grid">
            <div className="corte-stat-box blue">
              <div className="corte-stat-title">Pagos</div>
              <div className="corte-stat-value">
                ${corteGenerado.corte_info.total_pagos_normales}
              </div>
            </div>
            <div className="corte-stat-box red">
              <div className="corte-stat-title">Cargos</div>
              <div className="corte-stat-value">
                ${corteGenerado.corte_info.total_pagos_cargos}
              </div>
            </div>
            <div className="corte-stat-box green">
              <div className="corte-stat-title">Total global</div>
              <div className="corte-stat-value">
                ${corteGenerado.corte_info.gran_total}
              </div>
            </div>
          </div>

          <h4 style={{ color: "#fff", marginBottom: "10px" }}>
            Detalle de Movimientos
          </h4>
          <div className="corte-table-wrapper">
            <table className="corte-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {corteGenerado.movimientos.map((mov, i) => (
                  <tr key={i}>
                    <td>{mov.fecha_pago}</td>
                    <td>{mov.usuario}</td>
                    <td>
                      <span
                        className={`corte-badge ${mov.tipo === "Pago" ? "pago" : "cargo"}`}
                      >
                        {mov.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      ${mov.monto_recibido}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="corte-actions">
            <button className="corte-btn-pdf" onClick={generarPDF}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorteCaja;
