import React, { useState, useEffect } from "react";
import "../../styles/styles.css";
import {
  generarCorteJr,
  getUsuarioLocal,
  getHistorialCortes,
  getDetalleCorte,
  subirPdfCorteJr,
  validarCorteJr,
  type CorteData,
  type Movimiento,
} from "../../services/CorteJr.service";
import {
  getGrupos,
  getGrupoById,
  type CobradorGrupo,
} from "../../services/grupos.service";
import { generarCortePDF } from "../../components/pdfCortes/CortePDF";

// ─────────────────────────────────────────────
// Tipo interno para el popup de validación
// ─────────────────────────────────────────────
interface CorteGuardado {
  id: number;
  folio: number;
  cobrador: string;
  periodoInicio: string;
  periodoFin: string;
  total: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatCurrency = (value: string | number): string =>
  parseFloat(String(value)).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const getNombreCobrador = (
  id: string,
  cobradores: CobradorGrupo[],
): string | null => {
  const cobrador = cobradores.find((c) => String(c.id_cobrador) === id);
  return cobrador
    ? (cobrador.nombre_completo ??
        `${cobrador.nombre ?? ""} ${cobrador.apellidos ?? ""}`.trim())
    : null;
};

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────
const CorteJunior: React.FC = () => {
  // ── Formulario ──────────────────────────────
  const [fechaInicial, setFechaInicial] = useState<string>("");
  const [fechaFinal, setFechaFinal] = useState<string>("");
  const [cobradorId, setCobradorId] = useState<string>("");

  // ── Cobradores del equipo ───────────────────
  const [cobradores, setCobradores] = useState<CobradorGrupo[]>([]);
  const [cargandoEquipo, setCargandoEquipo] = useState(true);
  const [errorEquipo, setErrorEquipo] = useState<string | null>(null);

  // ── Estado de la petición ───────────────────
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Resultado del corte generado ────────────
  const [corteActual, setCorteActual] = useState<CorteData | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  // ── Historial desde la API ──────────────────
  const [cortesApi, setCortesApi] = useState<CorteData[]>([]);
  const [cargandoCortes, setCargandoCortes] = useState(false);
  const [errorCortes, setErrorCortes] = useState<string | null>(null);

  // ── Popup validación ────────────────────────
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [corteSeleccionado, setCorteSeleccionado] =
    useState<CorteGuardado | null>(null);
  const [archivoValidacion, setArchivoValidacion] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Popup detalle ────────────────────────────
  const [popupDetalleAbierto, setPopupDetalleAbierto] = useState(false);
  const [corteDetalle, setCorteDetalle] = useState<CorteData | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // useEffect — cargar cobradores del equipo
  // ─────────────────────────────────────────────
  useEffect(() => {
    const cargarCobradoresDelEquipo = async () => {
      setCargandoEquipo(true);
      setErrorEquipo(null);

      const usuarioLocal = getUsuarioLocal();
      if (!usuarioLocal) {
        setErrorEquipo("No se encontró la sesión. Por favor, inicia sesión.");
        setCargandoEquipo(false);
        return;
      }

      const idTesorero = usuarioLocal.id_cobrador;

      const resultGrupos = await getGrupos();
      if (!resultGrupos.success) {
        setErrorEquipo("No se pudo cargar la lista de equipos.");
        setCargandoEquipo(false);
        return;
      }

      const grupos = Array.isArray(resultGrupos.data)
        ? resultGrupos.data
        : (resultGrupos.data?.results ?? []);

      const miGrupo = grupos.find(
        (g: any) =>
          Array.isArray(g.cobradores) &&
          g.cobradores.some((c: any) => c.id_cobrador === idTesorero),
      );

      if (!miGrupo) {
        setErrorEquipo("No se encontró un equipo asignado a tu usuario.");
        setCargandoEquipo(false);
        return;
      }

      if (Array.isArray(miGrupo.cobradores) && miGrupo.cobradores.length > 0) {
        setCobradores(miGrupo.cobradores);
        setCargandoEquipo(false);
        return;
      }

      const resultGrupo = await getGrupoById(miGrupo.id_equipo);
      if (!resultGrupo.success || !resultGrupo.data?.cobradores) {
        setErrorEquipo("No se pudieron cargar los cobradores del equipo.");
        setCargandoEquipo(false);
        return;
      }

      setCobradores(resultGrupo.data.cobradores);
      setCargandoEquipo(false);
    };

    cargarCobradoresDelEquipo();
  }, []);

  // ─────────────────────────────────────────────
  // useEffect — cargar historial de cortes
  // ─────────────────────────────────────────────
  useEffect(() => {
    const cargarHistorial = async () => {
      setCargandoCortes(true);
      setErrorCortes(null);

      const result = await getHistorialCortes();

      if (!result.success) {
        setErrorCortes(
          result.errors.general ?? "No se pudieron cargar los cortes.",
        );
        setCargandoCortes(false);
        return;
      }

      // Filtro extra: solo cortes del tesorero logueado
      const usuarioLocal = getUsuarioLocal();
      const idTesorero = usuarioLocal?.id_cobrador;

      setCortesApi(
        idTesorero
          ? result.data.filter((c) => c.cobrador === idTesorero)
          : result.data,
      );

      setCargandoCortes(false);
    };

    cargarHistorial();
  }, []);

  // ─────────────────────────────────────────────
  // Helper — refrescar historial desde la API
  // ─────────────────────────────────────────────
  const refrescarHistorial = async () => {
    const refresh = await getHistorialCortes();
    if (!refresh.success) return;

    const usuarioLocal = getUsuarioLocal();
    const idTesorero = usuarioLocal?.id_cobrador;

    setCortesApi(
      idTesorero
        ? refresh.data.filter((c) => c.cobrador === idTesorero)
        : refresh.data,
    );
  };

  // ─────────────────────────────────────────────
  // Generar corte
  // ─────────────────────────────────────────────
  const handleGenerarCorte = async () => {
    if (!fechaInicial || !fechaFinal || !cobradorId) {
      setError("Completa todos los campos antes de generar el corte.");
      return;
    }

    setError(null);
    setCargando(true);
    setCorteActual(null);
    setMovimientos([]);

    const result = await generarCorteJr({
      fecha_inicio: fechaInicial,
      fecha_fin: fechaFinal,
      cobrador_id: Number(cobradorId),
    });

    if (!result.success) {
      const mensaje =
        result.errors.general ||
        result.errors.detail ||
        Object.values(result.errors)[0] ||
        "Error inesperado.";
      setError(String(mensaje));
      setCargando(false);
      return;
    }

    const { corte, movimientos: movs } = result.data;

    setCorteActual(corte);
    setMovimientos(movs);

    // ── Obtener nombre del tesorero logueado ──
    const usuarioLocal = getUsuarioLocal();
    const nombreTesorero = usuarioLocal
      ? `${usuarioLocal.nombre} ${usuarioLocal.apellidos}`.trim()
      : corte.tesorero_nombre;

    // ── Obtener nombre del cobrador seleccionado ──
    const nombreCobrador =
      getNombreCobrador(cobradorId, cobradores) || corte.tesorero_nombre;

    // ── Generar PDF automáticamente ───────────
    generarCortePDF(
      {
        folio_corte: corte.folio_corte,
        fecha_inicio: corte.fecha_inicio,
        fecha_fin: corte.fecha_fin,
        fecha_generacion: corte.fecha_generacion,
        tesorero_nombre: nombreCobrador, // ← Cobrador que se seleccionó
        total_pagos_normales: corte.total_pagos_normales,
        total_pagos_cargos: corte.total_pagos_cargos,
        gran_total: corte.gran_total,
      },
      movs,
      {
        titulo: "Corte del:",
        responsable: nombreTesorero, // ← Tesorero que hizo el corte
        mostrarTipo: false,
        mostrarCobrador: false,
      },
    );

    // Refrescar historial
    await refrescarHistorial();

    setCargando(false);
  };

  // ─────────────────────────────────────────────
  // Popup validación
  // ─────────────────────────────────────────────
  const abrirValidacionDesdeApi = (corte: CorteData) => {
    handleAbrirValidacion({
      id: corte.folio_corte,
      folio: corte.folio_corte,
      cobrador: corte.tesorero_nombre,
      periodoInicio: corte.fecha_inicio,
      periodoFin: corte.fecha_fin,
      total: parseFloat(corte.gran_total),
    });
  };

  const handleAbrirValidacion = (corte: CorteGuardado) => {
    setCorteSeleccionado(corte);
    setArchivoValidacion(null);
    setPopupAbierto(true);
  };

  const handleCerrarPopup = () => {
    setPopupAbierto(false);
    setCorteSeleccionado(null);
    setArchivoValidacion(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoValidacion(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArchivoValidacion(e.dataTransfer.files[0]);
    }
  };
  const [validando, setValidando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const handleValidar = async () => {
    if (!archivoValidacion || !corteSeleccionado) return;

    setValidando(true);
    setErrorValidacion(null);

    // ── Paso 1: Subir el PDF ──
    const resultPdf = await subirPdfCorteJr(
      corteSeleccionado.folio,
      archivoValidacion,
    );

    if (!resultPdf.success) {
      setErrorValidacion(resultPdf.errors.general ?? "Error al subir el PDF.");
      setValidando(false);
      return;
    }

    // ── Paso 2: Validar el corte ──
    const resultValidar = await validarCorteJr(corteSeleccionado.folio);

    if (!resultValidar.success) {
      setErrorValidacion(
        resultValidar.errors.general ?? "Error al validar el corte.",
      );
      setValidando(false);
      return;
    }

    // ── Éxito: refrescar historial y cerrar ──
    await refrescarHistorial();
    setValidando(false);
    handleCerrarPopup();
  };

  const handleVerDetalle = async (folio: number) => {
    setCorteDetalle(null);
    setErrorDetalle(null);
    setCargandoDetalle(true);
    setPopupDetalleAbierto(true);

    const result = await getDetalleCorte(folio);

    if (!result.success) {
      setErrorDetalle(result.errors.general ?? "No se pudo cargar el detalle.");
      setCargandoDetalle(false);
      return;
    }

    setCorteDetalle(result.data);
    setCargandoDetalle(false);
  };

  const handleCerrarDetalle = () => {
    setPopupDetalleAbierto(false);
    setCorteDetalle(null);
    setErrorDetalle(null);
  };

  // ─────────────────────────────────────────────
  // Totales
  // ─────────────────────────────────────────────
  const totalMovimientos = movimientos.reduce(
    (sum, m) => sum + parseFloat(String(m.monto_recibido) || "0"),
    0,
  );

  const totalIngresos = cortesApi.reduce(
    (sum, c) => sum + parseFloat(c.gran_total),
    0,
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="cdc-wrapper">
      <div className="cdc-Titulo-junior">
        <h2>Modulo de Tesoreria Junior</h2>
      </div>

      {/* ══════════════════════════════════════
          SECCIÓN 1 — FORMULARIO GENERAR CORTE
          ══════════════════════════════════════ */}
      <div className="cdc-card">
        <h2 className="cdc-titulo">Realizar corte de caja</h2>

        {/* Fechas */}
        <div className="cdc-filtros-fecha">
          <div className="cdc-select-wrapper">
            <label className="cdc-label">Fecha inicial</label>
            <input
              type="date"
              className="cdc-input-fecha"
              value={fechaInicial}
              onChange={(e) => setFechaInicial(e.target.value)}
            />
          </div>
          <div className="cdc-select-wrapper">
            <label className="cdc-label">Fecha final</label>
            <input
              type="date"
              className="cdc-input-fecha"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
            />
          </div>
        </div>

        {/* Select cobradores */}
        <div className="cdc-select-wrapper cdc-full-width">
          <label className="cdc-label">Seleccione un cobrador</label>

          {cargandoEquipo ? (
            <select className="cdc-select" disabled>
              <option>Cargando cobradores...</option>
            </select>
          ) : errorEquipo ? (
            <select className="cdc-select" disabled>
              <option>{errorEquipo}</option>
            </select>
          ) : (
            <>
              <select
                className="cdc-select"
                value={cobradorId}
                onChange={(e) => setCobradorId(e.target.value)}
              >
                <option value="">Seleccione un cobrador</option>
                {cobradores.map((c) => (
                  <option key={c.id_cobrador} value={String(c.id_cobrador)}>
                    {c.nombre_completo ??
                      `${c.nombre ?? ""} ${c.apellidos ?? ""}`.trim()}
                  </option>
                ))}
              </select>
              <span className="cdc-select-arrow">▼</span>
            </>
          )}
        </div>

        {/* Error generación */}
        {error && <p className="cdc-error">{error}</p>}

        {/* Resumen + tabla de movimientos */}
        {corteActual && movimientos.length > 0 && (
          <>
            <div className="cdc-resumen-grid">
              <div className="cdc-resumen-item">
                <span className="cdc-resumen-label">Folio</span>
                <span className="cdc-resumen-value">
                  #{corteActual.folio_corte}
                </span>
              </div>
              <div className="cdc-resumen-item">
                <span className="cdc-resumen-label">Tesorero</span>
                <span className="cdc-resumen-value">
                  {corteActual.tesorero_nombre}
                </span>
              </div>
              <div className="cdc-resumen-item">
                <span className="cdc-resumen-label">Pagos normales</span>
                <span className="cdc-resumen-value">
                  ${formatCurrency(corteActual.total_pagos_normales)}
                </span>
              </div>
              <div className="cdc-resumen-item">
                <span className="cdc-resumen-label">Pagos con cargo</span>
                <span className="cdc-resumen-value">
                  ${formatCurrency(corteActual.total_pagos_cargos)}
                </span>
              </div>
              <div className="cdc-resumen-item cdc-resumen-total">
                <span className="cdc-resumen-label">Gran total</span>
                <span className="cdc-resumen-value">
                  ${formatCurrency(corteActual.gran_total)}
                </span>
              </div>
            </div>

            <div className="cdc-tabla-container">
              <div className="cdc-tabla-scroll">
                <table className="cdc-tabla">
                  <thead>
                    <tr>
                      <th>Cobrador</th>
                      <th>Cuentahabiente</th>
                      <th>Monto</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov, idx) => (
                      <tr key={idx}>
                        <td>
                          {getNombreCobrador(cobradorId, cobradores) ||
                            corteActual.tesorero_nombre}
                        </td>
                        <td>{mov.usuario}</td>
                        <td>${formatCurrency(mov.monto_recibido)}</td>
                        <td>{formatDate(mov.fecha_pago)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cdc-total-row">
                <span>Total: ${formatCurrency(totalMovimientos)}</span>
              </div>
            </div>
          </>
        )}

        {/* Botón generar */}
        <button
          className="cdc-btn-generar"
          onClick={handleGenerarCorte}
          disabled={cargando || cargandoEquipo}
        >
          {cargando ? "Generando..." : "Generar comprobante"}
        </button>
      </div>

      {/* ══════════════════════════════════════
          SECCIÓN 2 — HISTORIAL DE CORTES (API)
          ══════════════════════════════════════ */}
      <div className="cdc-card-corte cdc-cortes-section">
        <h3 className="cdc-subtitulo">Cortes de caja</h3>

        {cargandoCortes && <p className="cdc-info">Cargando cortes...</p>}
        {errorCortes && <p className="cdc-error">{errorCortes}</p>}

        {!cargandoCortes && (
          <div className="cdc-tabla-container">
            <div className="cdc-tabla-scroll">
              <table className="cdc-tabla cdc-tabla-cortes">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cobrador</th>
                    <th>Período</th>
                    <th>Gran total</th>
                    <th>Detalle</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {cortesApi.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "#666",
                          padding: "20px",
                        }}
                      >
                        Aún no hay cortes registrados.
                      </td>
                    </tr>
                  ) : (
                    cortesApi.map((corte) => (
                      <tr key={corte.folio_corte}>
                        <td>#{corte.folio_corte}</td>
                        <td>{corte.tesorero_nombre}</td>
                        <td>
                          {formatDate(corte.fecha_inicio)} –{" "}
                          {formatDate(corte.fecha_fin)}
                        </td>
                        <td>${formatCurrency(corte.gran_total)}</td>
                        <td>
                          <button
                            className="cdc-btn-detalle"
                            onClick={() => handleVerDetalle(corte.folio_corte)}
                          >
                            Ver más
                          </button>
                        </td>
                        <td>
                          {corte.validado ? (
                            <button className="cdc-btn-validado" disabled>
                              ✔ Validado
                            </button>
                          ) : (
                            <button
                              className="cdc-btn-validar"
                              onClick={() => abrirValidacionDesdeApi(corte)}
                            >
                              Validar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="cdc-ingresos-banner">
          <div className="cdc-ingresos-banner__label">Total de ingresos</div>
          <div className="cdc-ingresos-banner__valor">
            ${formatCurrency(totalIngresos)}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          POPUP — VALIDACIÓN
          ══════════════════════════════════════ */}
      {popupAbierto && corteSeleccionado && (
        <div className="cdc-overlay" onClick={handleCerrarPopup}>
          <div className="cdc-popup" onClick={(e) => e.stopPropagation()}>
            <button className="cdc-popup-cerrar" onClick={handleCerrarPopup}>
              ✕
            </button>

            <h3 className="cdc-popup-titulo">Validar corte de caja</h3>
            <div className="cdc-popup-divider"></div>
            <p className="cdc-popup-info">
              Cobrador: <strong>{corteSeleccionado.cobrador}</strong>{" "}
              &nbsp;|&nbsp; Período:{" "}
              {formatDate(corteSeleccionado.periodoInicio)} –{" "}
              {formatDate(corteSeleccionado.periodoFin)}
            </p>
            <p className="cdc-popup-info">
              Total: <strong>${formatCurrency(corteSeleccionado.total)}</strong>
            </p>

            {/* Zona drag & drop */}
            <div
              className={`cdc-dropzone ${dragOver ? "cdc-dropzone--active" : ""} ${archivoValidacion ? "cdc-dropzone--file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("cdc-file-input")?.click()}
            >
              {archivoValidacion ? (
                <>
                  <span className="cdc-dropzone-icon">📄</span>
                  <span className="cdc-dropzone-nombre">
                    {archivoValidacion.name}
                  </span>
                  <span className="cdc-dropzone-hint">
                    Clic para cambiar archivo
                  </span>
                </>
              ) : (
                <>
                  <span className="cdc-dropzone-icon">⬆️</span>
                  <span className="cdc-dropzone-texto">
                    Arrastra el archivo aquí
                  </span>
                  <span className="cdc-dropzone-hint">
                    o haz clic para seleccionar
                  </span>
                </>
              )}
            </div>
            <input
              id="cdc-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* Mensaje de error validación */}
            {errorValidacion && <p className="cdc-error">{errorValidacion}</p>}

            <div className="cdc-popup-acciones">
              <button
                className="cdc-btn-cancelar"
                onClick={handleCerrarPopup}
                disabled={validando}
              >
                Cancelar
              </button>
              <button
                className="cdc-btn-confirmar"
                onClick={handleValidar}
                disabled={!archivoValidacion || validando}
              >
                {validando ? "Validando..." : "Confirmar validación"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════
    POPUP — DETALLE DEL CORTE
    ══════════════════════════════════════ */}
      {popupDetalleAbierto && (
        <div className="cdc-overlay" onClick={handleCerrarDetalle}>
          <div
            className="cdc-popup cdc-popup--detalle"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="cdc-popup-cerrar" onClick={handleCerrarDetalle}>
              ✕
            </button>

            <h3 className="cdc-popup-titulo">Detalle del corte</h3>
            <div className="cdc-popup-divider"></div>

            {cargandoDetalle && (
              <p className="cdc-info" style={{ textAlign: "center" }}>
                Cargando detalle...
              </p>
            )}

            {errorDetalle && <p className="cdc-error">{errorDetalle}</p>}

            {corteDetalle && !cargandoDetalle && (
              <>
                {/* ── Grid de datos principales ── */}
                <div className="cdc-resumen-grid">
                  <div className="cdc-resumen-item">
                    <span className="cdc-resumen-label">Folio</span>
                    <span className="cdc-resumen-value">
                      #{corteDetalle.folio_corte}
                    </span>
                  </div>
                  <div className="cdc-resumen-item">
                    <span className="cdc-resumen-label">Fecha generación</span>
                    <span className="cdc-resumen-value">
                      {new Date(corteDetalle.fecha_generacion).toLocaleString(
                        "es-MX",
                      )}
                    </span>
                  </div>
                  <div className="cdc-resumen-item">
                    <span className="cdc-resumen-label">Tesorero</span>
                    <span className="cdc-resumen-value">
                      {corteDetalle.tesorero_nombre}
                    </span>
                  </div>
                  <div className="cdc-resumen-item">
                    <span className="cdc-resumen-label">Período</span>
                    <span className="cdc-resumen-value">
                      {formatDate(corteDetalle.fecha_inicio)} –{" "}
                      {formatDate(corteDetalle.fecha_fin)}
                    </span>
                  </div>
                  <div className="cdc-resumen-item">
                    <span className="cdc-resumen-label">Pagos normales</span>
                    <span className="cdc-resumen-value">
                      ${formatCurrency(corteDetalle.total_pagos_normales)}
                    </span>
                  </div>
                  <div className="cdc-resumen-item">
                    <span className="cdc-resumen-label">Pagos con cargo</span>
                    <span className="cdc-resumen-value">
                      ${formatCurrency(corteDetalle.total_pagos_cargos)}
                    </span>
                  </div>
                  <div className="cdc-resumen-item cdc-resumen-total">
                    <span className="cdc-resumen-label">Gran total</span>
                    <span className="cdc-resumen-value">
                      ${formatCurrency(corteDetalle.gran_total)}
                    </span>
                  </div>
                </div>

                {/* ── Estado de validación ── */}
                <div className="cdc-detalle-validacion">
                  <span className="cdc-resumen-label">Estado</span>
                  <span
                    className={
                      corteDetalle.validado
                        ? "cdc-btn-validado"
                        : "cdc-badge-pendiente"
                    }
                  >
                    {corteDetalle.validado
                      ? "✔ Validado"
                      : "Pendiente de validación"}
                  </span>
                </div>

                {corteDetalle.validado && corteDetalle.fecha_validacion && (
                  <div className="cdc-detalle-validacion">
                    <span className="cdc-resumen-label">Validado por</span>
                    <span
                      className="cdc-resumen-value"
                      style={{ color: "#4ade80" }}
                    >
                      {corteDetalle.validado_por_nombre ?? "—"} &nbsp;·&nbsp;{" "}
                      {new Date(corteDetalle.fecha_validacion).toLocaleString(
                        "es-MX",
                      )}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="cdc-popup-acciones">
              <button
                className="cdc-btn-cancelar"
                onClick={handleCerrarDetalle}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorteJunior;
