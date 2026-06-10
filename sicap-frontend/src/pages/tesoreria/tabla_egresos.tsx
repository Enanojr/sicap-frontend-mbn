import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getEgresos } from "../../services/egresos.service";
import type { EgresoResponse } from "../../services/egresos.service";
import "../../styles/styles.css";

const HistoricoEgresos: React.FC = () => {
  const [listaEgresos, setListaEgresos] = useState<EgresoResponse[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [totalEgresos, setTotalEgresos] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarTablaEgresos(undefined, busquedaTabla);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busquedaTabla]);

  useEffect(() => {
    cargarTablaEgresos();
  }, []);

  const cargarTablaEgresos = async (url?: string, searchTerm?: string) => {
    setLoading(true);

    try {
      const res = await getEgresos(url, searchTerm);

      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setListaEgresos(res.data);
          setNextPage(null);
          setPrevPage(null);
          setTotalEgresos(res.data.length);
        } else {
          setListaEgresos(res.data.results || []);
          setNextPage(res.data.next || null);
          setPrevPage(res.data.previous || null);
          setTotalEgresos(res.data.count || 0);
        }
      } else {
        setListaEgresos([]);
        setNextPage(null);
        setPrevPage(null);
        setTotalEgresos(0);
      }
    } catch (error) {
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

  const handleNext = () => {
    if (nextPage) cargarTablaEgresos(nextPage, busquedaTabla);
  };

  const handlePrev = () => {
    if (prevPage) cargarTablaEgresos(prevPage, busquedaTabla);
  };

  const handleVerMas = (archivoUrl?: string | null) => {
    if (!archivoUrl) {
      Swal.fire({
        icon: "info",
        title: "Sin documento",
        text: "Este egreso aún no cuenta con archivo adjunto.",
        confirmButtonColor: "#d48a1f",
      });
      return;
    }

    window.open(archivoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="cm-card cm-bottom-section">
      <div className="cm-table-header">
        <h3>Histórico de Egresos ({totalEgresos})</h3>

        <div className="cm-search-box">
          <input
            type="text"
            placeholder="🔍 Buscar egreso..."
            value={busquedaTabla}
            onChange={(e) => setBusquedaTabla(e.target.value)}
          />
        </div>
      </div>

      <div className="cm-table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID Egreso</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Concepto</th>
              <th>Requisitor del gasto</th>
              <th>Cobrador</th>
              <th>Documento</th>
            </tr>
          </thead>

          <tbody>
            {listaEgresos.length > 0 ? (
              listaEgresos.map((item) => (
                <tr key={item.id_egreso}>
                  <td>{item.id_egreso}</td>
                  <td>{item.fecha_egreso}</td>
                  <td className="cm-egreso-monto">
                    $
                    {Number(item.monto).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <span className="cm-badge">
                      {item.concepto || "Sin concepto"}
                    </span>
                  </td>
                  <td>{item.requisitor_gasto || "N/A"}</td>
                  <td>{item.id_cobrador ?? "N/A"}</td>
                  <td>
                    <button
                      type="button"
                      className="cm-btn-table-view"
                      onClick={() => handleVerMas(item.archivo_url)}
                    >
                      Ver más
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="cm-empty-row">
                  {loading
                    ? "Cargando histórico de egresos..."
                    : "No se encontraron egresos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cm-pagination">
        <button
          className="cm-btn-pag"
          onClick={handlePrev}
          disabled={!prevPage || loading}
        >
          ⬅ Ant.
        </button>

        <span className="cm-pag-info">
          Mostrando {listaEgresos.length} de {totalEgresos}
        </span>

        <button
          className="cm-btn-pag"
          onClick={handleNext}
          disabled={!nextPage || loading}
        >
          Sig. ➡
        </button>
      </div>
    </div>
  );
};

export default HistoricoEgresos;
