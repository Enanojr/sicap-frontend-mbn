import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getIngresos } from "../../services/ingresos.service";
import type { IngresoResponse } from "../../services/ingresos.service";
import "../../styles/styles.css";

const HistoricoIngresos: React.FC = () => {
  const [listaIngresos, setListaIngresos] = useState<IngresoResponse[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [totalIngresos, setTotalIngresos] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarTablaIngresos(undefined, busquedaTabla);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busquedaTabla]);

  useEffect(() => {
    cargarTablaIngresos();
  }, []);

  const cargarTablaIngresos = async (url?: string, searchTerm?: string) => {
    setLoading(true);

    try {
      const res = await getIngresos(url, searchTerm);

      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setListaIngresos(res.data);
          setNextPage(null);
          setPrevPage(null);
          setTotalIngresos(res.data.length);
        } else {
          setListaIngresos(res.data.results || []);
          setNextPage(res.data.next || null);
          setPrevPage(res.data.previous || null);
          setTotalIngresos(res.data.count || 0);
        }
      } else {
        setListaIngresos([]);
        setNextPage(null);
        setPrevPage(null);
        setTotalIngresos(0);
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo cargar el histórico de ingresos.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (nextPage) cargarTablaIngresos(nextPage, busquedaTabla);
  };

  const handlePrev = () => {
    if (prevPage) cargarTablaIngresos(prevPage, busquedaTabla);
  };

  return (
    <div className="cm-card cm-bottom-section">
      <div className="cm-table-header">
        <h3>Histórico de Ingresos ({totalIngresos})</h3>

        <div className="cm-search-box">
          <input
            type="text"
            placeholder="🔍 Buscar ingreso..."
            value={busquedaTabla}
            onChange={(e) => setBusquedaTabla(e.target.value)}
          />
        </div>
      </div>

      <div className="cm-table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID Ingreso</th>
              <th>Fecha de ingreso</th>
              <th>Monto</th>
              <th>Equipo</th>
            </tr>
          </thead>

          <tbody>
            {listaIngresos.length > 0 ? (
              listaIngresos.map((item) => (
                <tr key={item.id_ingreso}>
                  <td>{item.id_ingreso}</td>
                  <td>{item.fecha_ingreso}</td>
                  <td className="cm-ingreso-monto">
                    $
                    {Number(item.monto).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <span className="cm-badge">
                      {item.equipo || "Sin equipo"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="cm-empty-row">
                  {loading
                    ? "Cargando histórico de ingresos..."
                    : "No se encontraron ingresos registrados."}
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
          Mostrando {listaIngresos.length} de {totalIngresos}
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

export default HistoricoIngresos;
