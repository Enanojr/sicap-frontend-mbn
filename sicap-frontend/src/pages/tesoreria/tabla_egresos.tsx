import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getTransacciones,
  type TransaccionResponse,
} from "../../services/egresos.service";
import "../../styles/styles.css";

interface TablaEgresosProps {
  refreshKey?: number;
}

const TablaEgresos: React.FC<TablaEgresosProps> = ({ refreshKey = 0 }) => {
  const [listaEgresos, setListaEgresos] = useState<TransaccionResponse[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const clean = value.includes("T") ? value.split("T")[0] : value;
    const [y, m, d] = clean.split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };

  const formatCurrency = (value: number | string) =>
    `$${Number(value || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const totalMonto = useMemo(() => {
    return listaEgresos.reduce((acc, item) => acc + Number(item.monto || 0), 0);
  }, [listaEgresos]);

  const handleVerMas = (archivoUrl?: string | null) => {
    if (!archivoUrl) {
      Swal.fire({
        icon: "info",
        title: "Sin documento",
        text: "Este egreso aún no cuenta con archivo adjunto.",
        confirmButtonColor: "#58b2ee",
      });
      return;
    }
    window.open(archivoUrl, "_blank", "noopener,noreferrer");
  };

  const cargarTablaEgresos = async (url?: string, searchTerm?: string) => {
    setLoading(true);
    try {
      const result = await getTransacciones(url, searchTerm);

      if (!result.success || !result.data) {
        setListaEgresos([]);
        setNextPage(null);
        setPrevPage(null);
        setTotalRegistros(0);
        return;
      }

      if (Array.isArray(result.data)) {
        const soloEgresos = result.data.filter(
          (item) => item.tipo?.toLowerCase() === "egreso",
        );
        setListaEgresos(soloEgresos);
        setNextPage(null);
        setPrevPage(null);
        setTotalRegistros(soloEgresos.length);
      } else {
        const soloEgresos = (result.data.results || []).filter(
          (item) => item.tipo?.toLowerCase() === "egreso",
        );
        setListaEgresos(soloEgresos);
        setNextPage(result.data.next || null);
        setPrevPage(result.data.previous || null);
        setTotalRegistros(soloEgresos.length);
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo cargar el histórico de egresos.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      cargarTablaEgresos(undefined, busquedaTabla);
    }, 350);
    return () => clearTimeout(timeout);
  }, [busquedaTabla, refreshKey]);

  const handleNext = () => {
    if (nextPage) cargarTablaEgresos(nextPage, busquedaTabla);
  };

  const handlePrev = () => {
    if (prevPage) cargarTablaEgresos(prevPage, busquedaTabla);
  };

  return (
    <div className="egresos-card">
      <div className="egresos-card-header">
        <h3 className="egresos-card-title">Egresos Registrados</h3>
        <div className="egresos-card-divider" />
      </div>

      <div className="egresos-toolbar">
        <div className="egresos-summary">
          <span className="egresos-summary-label">Total de egresos</span>
          <strong className="egresos-summary-value">
            {formatCurrency(totalMonto)}
          </strong>
        </div>

        <div className="egresos-search">
          <input
            type="text"
            placeholder="Buscar egreso..."
            value={busquedaTabla}
            onChange={(e) => setBusquedaTabla(e.target.value)}
          />
        </div>
      </div>

      {/* Estado vacío / cargando FUERA de la tabla */}
      {listaEgresos.length === 0 && (
        <div className="egresos-empty-state">
          {loading
            ? "Cargando histórico de egresos..."
            : "No se encontraron egresos registrados."}
        </div>
      )}

      {/* Tabla solo se renderiza si hay datos */}
      {listaEgresos.length > 0 && (
        <div className="egresos-table-container">
          <table className="egresos-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Requisitor</th>
                <th>Monto</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {listaEgresos.map((item) => (
                <tr key={item.id}>
                  <td data-label="Fecha">{formatDate(item.fecha)}</td>
                  <td data-label="Concepto">
                    {item.observaciones || "Sin concepto"}
                  </td>
                  <td data-label="Requisitor">{item.requisitor || "N/A"}</td>
                  <td data-label="Monto" className="egresos-table-amount">
                    {formatCurrency(item.monto)}
                  </td>
                  <td data-label="Comprobante">
                    <button
                      type="button"
                      className="egresos-btn-view"
                      onClick={() => handleVerMas(item.comprobante)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="egresos-pagination">
        <button
          className="egresos-pagination-btn"
          onClick={handlePrev}
          disabled={!prevPage || loading}
        >
          ⬅ Ant.
        </button>

        <span className="egresos-pagination-info">
          Mostrando {listaEgresos.length} de {totalRegistros}
        </span>

        <button
          className="egresos-pagination-btn"
          onClick={handleNext}
          disabled={!nextPage || loading}
        >
          Sig. ➡
        </button>
      </div>
    </div>
  );
};

export default TablaEgresos;
