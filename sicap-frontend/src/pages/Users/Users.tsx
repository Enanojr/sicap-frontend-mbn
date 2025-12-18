import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Battery,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import type { Progreso } from "../../services/progreso.service";
import { getAllProgresos } from "../../services/progreso.service";
import "../../styles/styles.css";

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

const filterOptions: FilterOption[] = [
  { id: "pagado", label: "Pagado", value: "pagado" },
  { id: "adeudo", label: "Adeudo", value: "adeudo" },
  { id: "rezagado", label: "Rezagado", value: "rezagado" },
  { id: "corriente", label: "Corriente", value: "corriente" },
  { id: "all", label: "Todos los estatus", value: "all" },
];

// Componente de icono de batería con color según progreso
const BatteryIcon: React.FC<{ progreso: string }> = ({ progreso }) => {
  const progressValue = parseInt(progreso.replace('%', ''));
  
  let color = '#4ecdc4'; // Verde por defecto
  let fillLevel = progressValue;

  if (progressValue >= 80 && progressValue <= 100) {
    color = '#4ecdc4'; // Verde
  } else if (progressValue >= 40 && progressValue < 80) {
    color = '#f39c12'; // Amarillo
  } else if (progressValue >= 0 && progressValue < 40) {
    color = '#ff6b6b'; // Rojo
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      justifyContent: 'center'
    }}>
      <div style={{
        position: 'relative',
        width: '40px',
        height: '20px',
        border: `2px solid ${color}`,
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        padding: '2px'
      }}>
        {/* Punta de la batería */}
        <div style={{
          position: 'absolute',
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '10px',
          backgroundColor: color,
          borderRadius: '0 2px 2px 0'
        }} />
        
        {/* Nivel de llenado */}
        <div style={{
          height: '100%',
          width: `${fillLevel}%`,
          backgroundColor: color,
          borderRadius: '1px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{ 
        fontSize: '0.85rem', 
        fontWeight: 600,
        color: color 
      }}>
        {progreso}
      </span>
    </div>
  );
};

const ProgresoTable: React.FC = () => {
  const [progresos, setProgresos] = useState<Progreso[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const getStatusClass = (estatus: string) => {
    const value = estatus.trim().toLowerCase();
    if (["pagado", "corriente"].includes(value)) return "status-complete";
    if (["rezagado"].includes(value)) return "status-warning";
    if (["adeudo"].includes(value)) return "status-danger";
    return "status-pending";
  };

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllProgresos();
      
      if (response.success && response.data) {
        setProgresos(response.data);
      } else {
        setError("Error al cargar los datos de progreso");
      }
    } catch (err: any) {
      const message = "Ocurrió un error al cargar los datos.";
      setError(message);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProgresos = progresos.filter((progreso) => {
    const matchesSearch =
      String(progreso.numero_contrato)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(progreso.nombre)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedFilter === "all" ||
      progreso.estatus.toLowerCase() === selectedFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProgresos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProgresos = filteredProgresos.slice(startIndex, endIndex);

  const getFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === selectedFilter);
    return option ? option.label : "Todos los estatus";
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="contracts-page-container">
      <div className="contracts-card">
        <h2 className="contracts-title">
          <span className="contracts-title-gradient">PROGRESO DE PAGOS</span>
        </h2>
        <div className="contracts-divider"></div>

        {/* TOOLBAR */}
        <div className="contracts-toolbar">
          <div className="contracts-dropdown-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="contracts-filter-button"
              type="button"
            >
              <Battery className="icon" />
              <span>{getFilterLabel()}</span>
              <ChevronDown className="icon-small" />
            </button>

            {isDropdownOpen && (
              <div className="contracts-dropdown">
                <ul className="contracts-dropdown-list">
                  {filterOptions.map((option) => (
                    <li key={option.id}>
                      <div
                        className="contracts-dropdown-item"
                        onClick={() => {
                          setSelectedFilter(option.value);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <input
                          type="radio"
                          checked={selectedFilter === option.value}
                          onChange={() => {}}
                          className="radio"
                        />
                        <label className="radio-label">{option.label}</label>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="contracts-search-container">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contracts-search-input"
              placeholder="Buscar por contrato o nombre..."
            />
          </div>
        </div>

        {/* INDICADOR DE TOTAL */}
        {!loading && !error && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#999",
                padding: "0.25rem 0.75rem",
                backgroundColor: "#2b2e35",
                borderRadius: "6px",
              }}
            >
              Total de registros:{" "}
              <strong style={{ color: "#58b2ee" }}>{progresos.length}</strong>
            </div>
          </div>
        )}

        {/* TABLA */}
        {loading && (
          <p style={{ textAlign: "center", padding: "2rem" }}>
            Cargando datos...
          </p>
        )}
        {error && (
          <p style={{ color: "#ff6b6b", textAlign: "center", padding: "2rem" }}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="contracts-table-wrapper">
              <table className="contracts-table">
                <thead className="contracts-thead">
                  <tr>
                    <th className="th">N° Contrato</th>
                    <th className="th">Nombre</th>
                    <th className="th">Estatus</th>
                    <th className="th">Saldo Pendiente</th>
                    <th className="th">Progreso</th>
                  </tr>
                </thead>

                <tbody className="contracts-tbody">
                  {currentProgresos.map((progreso) => (
                    <tr key={progreso.numero_contrato}>
                      <td className="td">{progreso.numero_contrato}</td>
                      <td className="td-name">{progreso.nombre}</td>
                      <td className="td">
                        <span
                          className={`status-badge ${getStatusClass(
                            progreso.estatus
                          )}`}
                        >
                          {progreso.estatus}
                        </span>
                      </td>
                      <td className="td">
                        ${Number(progreso.saldo).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td className="td">
                        <BatteryIcon progreso={progreso.progreso} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentProgresos.length === 0 && (
                <div className="no-results">No se encontraron datos</div>
              )}
            </div>

            {/* PAGINACIÓN */}
            {filteredProgresos.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "1.5rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    backgroundColor: currentPage === 1 ? "#2b2e35" : "#58b2ee",
                    color: currentPage === 1 ? "#666" : "white",
                    border: "none",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "background 0.3s",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <button
                      key={index}
                      onClick={() => goToPage(page)}
                      style={{
                        backgroundColor:
                          currentPage === page ? "#58b2ee" : "#2b2e35",
                        color: currentPage === page ? "white" : "#ccc",
                        border:
                          currentPage === page
                            ? "2px solid #2F3B7E"
                            : "1px solid #3b3f47",
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: currentPage === page ? 600 : 400,
                        minWidth: "40px",
                        transition: "all 0.3s",
                      }}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={index}
                      style={{ color: "#666", padding: "0 0.25rem" }}
                    >
                      ...
                    </span>
                  )
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    backgroundColor:
                      currentPage === totalPages ? "#2b2e35" : "#58b2ee",
                    color: currentPage === totalPages ? "#666" : "white",
                    border: "none",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "background 0.3s",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProgresoTable;
