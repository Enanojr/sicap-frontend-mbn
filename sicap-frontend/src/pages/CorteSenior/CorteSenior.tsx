import React, { useState } from "react";
import "../../styles/styles.css";

interface Cobro {
  equipo: number;
  cobrador: string;
  cuentahabiente: string;
  monto: number;
  fecha: string;
}

interface CorteRealizado {
  id: number;
  equipo: number;
  periodoInicio: string;
  periodoFin: string;
  total: number;
  comprobante?: string;
}

const cobrosEjemplo: Cobro[] = [
  {
    equipo: 1,
    cobrador: "Gustavo Hernández",
    cuentahabiente: "Luis Sánchez",
    monto: 300.0,
    fecha: "2025-10-30",
  },
  {
    equipo: 1,
    cobrador: "Gustavo Hernández",
    cuentahabiente: "Eduardo Romero",
    monto: 150.0,
    fecha: "2025-10-09",
  },
  {
    equipo: 1,
    cobrador: "Adolfo Martínez",
    cuentahabiente: "Antonio Medina",
    monto: 230.0,
    fecha: "2025-10-24",
  },
  {
    equipo: 1,
    cobrador: "Adolfo Martínez",
    cuentahabiente: "Jesús Islas",
    monto: 470.0,
    fecha: "2025-10-12",
  },
];

const cortesEjemplo: CorteRealizado[] = [
  {
    id: 1,
    equipo: 1,
    periodoInicio: "2025/11/01",
    periodoFin: "2025/12/01",
    total: 4720.0,
  },
  {
    id: 2,
    equipo: 2,
    periodoInicio: "2025/11/01",
    periodoFin: "2025/12/01",
    total: 2800.0,
  },
];

const CorteSenior: React.FC = () => {
  const [fechaInicial, setFechaInicial] = useState<string>("");
  const [fechaFinal, setFechaFinal] = useState<string>("");
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>("");

  // Popup validación
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [corteSeleccionado, setCorteSeleccionado] =
    useState<CorteRealizado | null>(null);
  const [archivoValidacion, setArchivoValidacion] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalCobros = cobrosEjemplo.reduce((sum, c) => sum + c.monto, 0);
  const totalIngresos = cortesEjemplo.reduce((sum, c) => sum + c.total, 0);

  const handleAbrirValidacion = (corte: CorteRealizado) => {
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

  const handleValidar = () => {
    if (!archivoValidacion) return;
    // Aquí iría la llamada a la API
    alert(
      `Corte del equipo ${corteSeleccionado?.equipo} validado con: ${archivoValidacion.name}`,
    );
    handleCerrarPopup();
  };

  return (
    <div className="cdc-wrapper">
      <div className="cdc-Titulo-junior">
        <h2>Modulo de Tesoreria Senior</h2>
      </div>
      {/* ── SECCIÓN REALIZAR CORTE ── */}
      <div className="cdc-card">
        <h2 className="cdc-titulo">Realizar corte de caja</h2>

        {/* Filtros de fecha */}
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

        {/* Selector de equipo (cascaron) */}
        <div className="cdc-select-wrapper cdc-full-width">
          <select
            className="cdc-select"
            value={equipoSeleccionado}
            onChange={(e) => setEquipoSeleccionado(e.target.value)}
          >
            <option value="">Seleccione un equipo</option>
            <option value="1">Equipo 1</option>
            <option value="2">Equipo 2</option>
          </select>
          <span className="cdc-select-arrow">▼</span>
        </div>

        {/* Tabla de cobros */}
        <div className="cdc-tabla-container">
          <table className="cdc-tabla">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Cobrador</th>
                <th>Cuentahabiente</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {cobrosEjemplo.map((cobro, idx) => (
                <tr key={idx}>
                  <td>{cobro.equipo}</td>
                  <td>{cobro.cobrador}</td>
                  <td>{cobro.cuentahabiente}</td>
                  <td>{cobro.monto.toFixed(2)}</td>
                  <td>{cobro.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cdc-total-row">
            <span>Total: {totalCobros.toFixed(2)}</span>
          </div>
        </div>

        {/* Botón generar comprobante */}
        <button className="cdc-btn-generar">Generar comprobante</button>
      </div>

      {/* ── SECCIÓN CORTES REALIZADOS ── */}
      <div className="cdc-card-corte cdc-cortes-section">
        <h3 className="cdc-subtitulo">Cortes de caja</h3>
        <p className="cdc-total-ingresos">
          Total de ingresos: <strong>{totalIngresos.toFixed(2)}</strong>
        </p>

        <table className="cdc-tabla cdc-tabla-cortes">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Período</th>
              <th>Total</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {cortesEjemplo.map((corte) => (
              <tr key={corte.id}>
                <td>{corte.equipo}</td>
                <td>
                  {corte.periodoInicio} - {corte.periodoFin}
                </td>
                <td>{corte.total.toFixed(2)}</td>
                <td>
                  <button
                    className="cdc-btn-validar"
                    onClick={() => handleAbrirValidacion(corte)}
                  >
                    Validar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── POPUP VALIDACIÓN ── */}
      {popupAbierto && corteSeleccionado && (
        <div className="cdc-overlay" onClick={handleCerrarPopup}>
          <div className="cdc-popup" onClick={(e) => e.stopPropagation()}>
            <button className="cdc-popup-cerrar" onClick={handleCerrarPopup}>
              ✕
            </button>

            <h3 className="cdc-popup-titulo">Validar corte de caja</h3>
            <div className="cdc-popup-divider"></div>
            <p className="cdc-popup-info">
              Equipo <strong>{corteSeleccionado.equipo}</strong> &nbsp;|&nbsp;
              Período: {corteSeleccionado.periodoInicio} –{" "}
              {corteSeleccionado.periodoFin}
            </p>
            <p className="cdc-popup-info">
              Total: <strong>${corteSeleccionado.total.toFixed(2)}</strong>
            </p>

            {/* Zona de carga */}
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

            <div className="cdc-popup-acciones">
              <button className="cdc-btn-cancelar" onClick={handleCerrarPopup}>
                Cancelar
              </button>
              <button
                className="cdc-btn-confirmar"
                onClick={handleValidar}
                disabled={!archivoValidacion}
              >
                Confirmar validación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorteSenior;
