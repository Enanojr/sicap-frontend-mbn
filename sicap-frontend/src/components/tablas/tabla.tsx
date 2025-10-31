import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import type { ContractSummary } from "../../services/views.service";
import { getContractData } from "../../services/views.service";
import "../../styles/styles.css";

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

const filterOptions: FilterOption[] = [
  { id: "last-day", label: "Último día", value: "day" },
  { id: "last-week", label: "Últimos 7 días", value: "week" },
  { id: "last-month", label: "Últimos 30 días", value: "month" },
  { id: "last-year", label: "Último año", value: "year" },
  { id: "all", label: "Todos los registros", value: "all" },
];
9;

const ContractTable: React.FC = () => {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] =
    useState<ContractSummary | null>(null);

  const getStatusClass = (estatus_deuda: string) => {
    const value = estatus_deuda.trim().toLowerCase();

    if (["completado", "corriente", "pagado"].includes(value))
      return "status-complete";
    if (["rezagado"].includes(value)) return "status-warning";
    if (["vencido", "pendiente"].includes(value)) return "status-danger";

    return "status-pending";
  };

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadData();
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access");
      if (!token) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return;
      }

      console.log("Iniciando carga de datos...");
      const data = await getContractData();
      console.log(`Total de contratos cargados: ${data.length}`);
      console.log(" Primeros 3 contratos:", data.slice(0, 3));
      setContracts(data);
      console.log("Contratos guardados en state");
    } catch (err: any) {
      console.error("Error al cargar contratos:", err);

      const message =
        err.response?.status === 403
          ? "Acceso prohibido. Tu sesión puede haber expirado."
          : err.response?.status === 401
          ? "No autorizado. Por favor, inicia sesión nuevamente."
          : "Ocurrió un error al cargar los datos.";

      setError(message);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("access");
        localStorage.removeItem("usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  //  NUEVA FUNCIÓN: Filtrar por rango de fechas
  const filterByDateRange = (contract: ContractSummary): boolean => {
    if (selectedFilter === "all") return true;
    if (!contract.ultimo_pago) return false;

    const lastPaymentDate = new Date(contract.ultimo_pago);
    const today = new Date();
    const diffTime = today.getTime() - lastPaymentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (selectedFilter) {
      case "day":
        return diffDays <= 1;
      case "week":
        return diffDays <= 7;
      case "month":
        return diffDays <= 31;
      case "year":
        return diffDays <= 365;
      default:
        return true;
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      String(contract.numero_contrato)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(contract.nombre_completo)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesDateRange = filterByDateRange(contract);

    return matchesSearch && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  console.log("Estado de filtros:", {
    totalContracts: contracts.length,
    filteredContracts: filteredContracts.length,
    selectedFilter,
    searchTerm,
    currentPage,
    totalPages,
  });

  const getFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === selectedFilter);
    return option ? option.label : "Todos los registros";
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
          <span className="contracts-title-gradient">CONSULTAS</span>
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
              <Clock className="icon" />
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

        {/* INDICADOR DE TOTAL DE CONTRATOS */}
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
              Total de contratos:{" "}
              <strong style={{ color: "#58b2ee" }}>{contracts.length}</strong>
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
                    <th className="th">N° Folio</th>
                    <th className="th">Nombre</th>
                    <th className="th">Servicio</th>
                    <th className="th">Total pagado</th>
                    <th className="th">Estatus</th>
                    <th className="th">Detalles</th>
                  </tr>
                </thead>

                <tbody className="contracts-tbody">
                  {currentContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td className="td">{contract.numero_contrato}</td>
                      <td className="td-name">{contract.nombre_completo}</td>
                      <td className="td">{contract.nombre_servicio}</td>
                      <td className="td">
                        $
                        {Number(
                          contract.monto_total_recibido || 0
                        ).toLocaleString()}
                      </td>
                      <td className="td">
                        <td className="td">
                          <span
                            className={`status-badge ${getStatusClass(
                              contract.estatus_deuda
                            )}`}
                          >
                            {contract.estatus_deuda}
                          </span>
                        </td>
                      </td>
                      <td className="td-actions">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="view-button"
                        >
                          <Eye className="icon-small" />
                          Ver más
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentContracts.length === 0 && (
                <div className="no-results">No se encontraron datos</div>
              )}
            </div>

            {/* PAGINACIÓN */}
            {filteredContracts.length > 0 && (
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

      {/* MODAL */}
      {selectedContract && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedContract(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalles del Contrato</h3>
              <button
                className="close-button"
                onClick={() => setSelectedContract(null)}
              >
                x
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4 className="section-title">Información General</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Número de Folio</div>
                    <div className="detail-value">
                      {selectedContract.numero_contrato}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Nombre del Cliente</div>
                    <div className="detail-value">
                      {selectedContract.nombre_completo}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Servicio</div>
                    <div className="detail-value">
                      {selectedContract.nombre_servicio}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Estatus</div>
                    <div className="detail-value">
                      <td className="td">
                        <td className="td">
                          <span
                            className={`status-badge ${getStatusClass(
                              selectedContract.estatus_deuda
                            )}`}
                          >
                            {selectedContract.estatus_deuda}
                          </span>
                        </td>
                      </td>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Resumen Financiero</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Total Pagado</div>
                    <div className="detail-value text-success">
                      $
                      {Number(
                        selectedContract.monto_total_recibido || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Primer pago</div>
                    <div className="detail-value">
                      {selectedContract.fecha_inicio
                        ? new Date(
                            selectedContract.fecha_inicio
                          ).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Último Pago</div>
                    <div className="detail-value">
                      {selectedContract.ultimo_pago
                        ? new Date(
                            selectedContract.ultimo_pago
                          ).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">
                  Historial de Pagos ({selectedContract.pagos?.length || 0})
                </h4>
                <div className="overflow-x-auto rounded-lg">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fecha Pago</th>
                        <th>Monto</th>
                        <th>Descuento Aplicado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedContract.pagos &&
                      selectedContract.pagos.length > 0 ? (
                        selectedContract.pagos.map((pago, index) => (
                          <tr key={pago.id}>
                            <td>{index + 1}</td>
                            <td>
                              {new Date(pago.fecha_pago).toLocaleDateString()}
                            </td>
                            <td className="text-success">
                              $
                              {Number(
                                pago.monto_recibido || 0
                              ).toLocaleString()}
                            </td>
                            <td>{pago.nombre_descuento || "Sin descuento"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            style={{ textAlign: "center", color: "#999" }}
                          >
                            No hay pagos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Comentarios</h4>
                <div
                  style={{
                    backgroundColor: "#1e2028",
                    borderRadius: "8px",
                    padding: "1rem",
                    border: "1px solid #2a2a2a",
                    minHeight: "80px",
                  }}
                >
                  {selectedContract.pagos &&
                  selectedContract.pagos.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {selectedContract.pagos
                        .filter(
                          (pago) =>
                            pago.comentarios && pago.comentarios.trim() !== ""
                        )
                        .map((pago, index) => (
                          <div
                            key={pago.id}
                            style={{
                              backgroundColor: "#252831",
                              padding: "0.75rem 1rem",
                              borderRadius: "6px",
                              borderLeft: "3px solid #58b2ee",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#58b2ee",
                                  fontWeight: 600,
                                }}
                              >
                                Pago del{" "}
                                {new Date(pago.fecha_pago).toLocaleDateString()}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#999",
                                  backgroundColor: "#1e2028",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "4px",
                                }}
                              >
                                #{index + 1}
                              </span>
                            </div>
                            <p
                              style={{
                                margin: 0,
                                color: "#e0e0e0",
                                fontSize: "0.9rem",
                                lineHeight: "1.5",
                              }}
                            >
                              {pago.comentarios}
                            </p>
                          </div>
                        ))}
                      {selectedContract.pagos.filter(
                        (p) => p.comentarios && p.comentarios.trim() !== ""
                      ).length === 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#999",
                            padding: "1.5rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          No hay comentarios registrados para este contrato
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#999",
                        padding: "1.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      No hay comentarios registrados para este contrato
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTable;
