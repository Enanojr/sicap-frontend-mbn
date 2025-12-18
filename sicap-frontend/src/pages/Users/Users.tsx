import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Battery,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
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
  const progressValue = parseInt(progreso.replace("%", ""));

  let color = "#10b981"; // Verde
  let fillLevel = progressValue;

  if (progressValue >= 80 && progressValue <= 100) {
    color = "#10b981"; // Verde
  } else if (progressValue >= 40 && progressValue < 80) {
    color = "#f59e0b"; // Amarillo/Naranja
  } else if (progressValue >= 0 && progressValue < 40) {
    color = "#ef4444"; // Rojo
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "20px",
          border: `2px solid ${color}`,
          borderRadius: "3px",
          display: "flex",
          alignItems: "center",
          padding: "2px",
          backgroundColor: "#f9fafb",
        }}
      >
        {/* Punta de la batería */}
        <div
          style={{
            position: "absolute",
            right: "-6px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "4px",
            height: "10px",
            backgroundColor: color,
            borderRadius: "0 2px 2px 0",
          }}
        />

        {/* Nivel de llenado */}
        <div
          style={{
            height: "100%",
            width: `${fillLevel}%`,
            backgroundColor: color,
            borderRadius: "1px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: color,
        }}
      >
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
    if (["pagado", "corriente"].includes(value)) return "status-complete-light";
    if (["rezagado"].includes(value)) return "status-warning-light";
    if (["adeudo"].includes(value)) return "status-danger-light";
    return "status-pending-light";
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
      String(progreso.nombre).toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleGoBack = () => {
    window.location.href =
      "https://comisiondeaguaguadalupehidalgo.wordpress.com/";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Botón de regreso */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <button
            onClick={handleGoBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#3b82f6")
            }
          >
            <ArrowLeft size={18} />
            Regresar al Sitio Principal
          </button>
        </div>

        <div style={{ padding: "2rem" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1f2937",
              textAlign: "center",
              marginBottom: "0.5rem",
            }}
          >
            PROGRESO DE PAGOS
          </h2>
          <div
            style={{
              height: "4px",
              width: "100px",
              backgroundColor: "#3b82f6",
              margin: "0 auto 2rem",
              borderRadius: "2px",
            }}
          ></div>

          {/* TOOLBAR */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "#374151",
                  transition: "all 0.3s",
                  whiteSpace: "nowrap",
                }}
                type="button"
              >
                <Battery size={18} color="#6b7280" />
                <span>{getFilterLabel()}</span>
                <ChevronDown size={16} color="#6b7280" />
              </button>

              {isDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "0.5rem",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    zIndex: 10,
                    minWidth: "200px",
                  }}
                >
                  <ul
                    style={{ listStyle: "none", padding: "0.5rem", margin: 0 }}
                  >
                    {filterOptions.map((option) => (
                      <li key={option.id}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            cursor: "pointer",
                            borderRadius: "4px",
                            transition: "background-color 0.2s",
                          }}
                          onClick={() => {
                            setSelectedFilter(option.value);
                            setIsDropdownOpen(false);
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f3f4f6")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <input
                            type="radio"
                            checked={selectedFilter === option.value}
                            onChange={() => {}}
                            style={{ margin: 0 }}
                          />
                          <label
                            style={{
                              cursor: "pointer",
                              color: "#374151",
                              fontSize: "0.875rem",
                            }}
                          >
                            {option.label}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div
              style={{
                position: "relative",
                width: "400px",
                maxWidth: "100%",
              }}
            >
              <Search
                size={18}
                color="#9ca3af"
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 40rem 0.75rem 2.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  color: "#111827",
                  backgroundColor: "white",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
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
                padding: "0.75rem 0",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                }}
              >
                Total de registros:{" "}
                <strong style={{ color: "#3b82f6" }}>{progresos.length}</strong>
              </div>
            </div>
          )}

          {/* TABLA */}
          {loading && (
            <p
              style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}
            >
              Cargando datos...
            </p>
          )}
          {error && (
            <p
              style={{ color: "#ef4444", textAlign: "center", padding: "3rem" }}
            >
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div
                style={{
                  overflowX: "auto",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead
                    style={{
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        N° Contrato
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Nombre
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Estatus
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Saldo Pendiente
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Progreso
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentProgresos.map((progreso, index) => (
                      <tr
                        key={progreso.numero_contrato}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "white" : "#f9fafb",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f3f4f6")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            index % 2 === 0 ? "white" : "#f9fafb")
                        }
                      >
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {progreso.numero_contrato}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#111827",
                            fontWeight: 500,
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {progreso.nombre}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <span
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              ...(getStatusClass(progreso.estatus) ===
                                "status-complete-light" && {
                                backgroundColor: "#d1fae5",
                                color: "#065f46",
                              }),
                              ...(getStatusClass(progreso.estatus) ===
                                "status-warning-light" && {
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                              }),
                              ...(getStatusClass(progreso.estatus) ===
                                "status-danger-light" && {
                                backgroundColor: "#fee2e2",
                                color: "#991b1b",
                              }),
                            }}
                          >
                            {progreso.estatus}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontSize: "0.875rem",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          $
                          {Number(progreso.saldo).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            borderBottom: "1px solid #e5e7eb",
                            textAlign: "center",
                          }}
                        >
                          <BatteryIcon progreso={progreso.progreso} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {currentProgresos.length === 0 && (
                  <div
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                    }}
                  >
                    No se encontraron datos
                  </div>
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
                    marginTop: "2rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      backgroundColor:
                        currentPage === 1 ? "#f3f4f6" : "#3b82f6",
                      color: currentPage === 1 ? "#9ca3af" : "white",
                      border: currentPage === 1 ? "1px solid #e5e7eb" : "none",
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
                            currentPage === page ? "#3b82f6" : "white",
                          color: currentPage === page ? "white" : "#374151",
                          border:
                            currentPage === page ? "none" : "1px solid #e5e7eb",
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
                        style={{ color: "#9ca3af", padding: "0 0.25rem" }}
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
                        currentPage === totalPages ? "#f3f4f6" : "#3b82f6",
                      color: currentPage === totalPages ? "#9ca3af" : "white",
                      border:
                        currentPage === totalPages
                          ? "1px solid #e5e7eb"
                          : "none",
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
    </div>
  );
};

export default ProgresoTable;
