import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import type { ContractSummary } from "../../services/views.service";
import { getContractData } from "../../services/views.service";
import "../../styles/styles.css";

// ─────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────
interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface TableRow {
  rowKey: string;
  contract: ContractSummary;
  anioFila: string;
  pagosTotalesFila: number;
  saldoPendienteFila: number;
  modalYear: string;
}

const filterOptions: FilterOption[] = [
  { id: "all", label: "Todos los registros", value: "all" },
  { id: "last-day", label: "Último día", value: "day" },
  { id: "last-week", label: "Últimos 7 días", value: "week" },
  { id: "last-month", label: "Últimos 30 días", value: "month" },
  { id: "last-year", label: "Último año", value: "year" },
];

const statusOptions: FilterOption[] = [
  { id: "all-status", label: "Todos los estados", value: "all" },
  { id: "pagado", label: "Pagado", value: "pagado" },
  { id: "corriente", label: "Corriente", value: "corriente" },
  { id: "rezagado", label: "Rezagado", value: "rezagado" },
  { id: "adeudo", label: "Adeudo", value: "adeudo" },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatFechaLocal = (fechaString: string): string => {
  if (!fechaString) return "—";
  const fechaLimpia = fechaString.includes("T")
    ? fechaString.split("T")[0]
    : fechaString;
  const [year, month, day] = fechaLimpia.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeStreet = (value: string): string => {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\bav\b|\bavenida\b/g, "avenida")
    .replace(/\bcalle\b|\bc\b/g, "calle")
    .replace(/\bblvd\b|\bboulevard\b/g, "boulevard")
    .trim();
};

const prettyStreet = (value: string) =>
  value.replace(/\b\w/g, (l) => l.toUpperCase());

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const ContractTable: React.FC = () => {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [streetTerm, setStreetTerm] = useState<string>("");
  const [selectedStreetKey, setSelectedStreetKey] = useState<string>("");
  const [isStreetDropdownOpen, setIsStreetDropdownOpen] =
    useState<boolean>(false);

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] =
    useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState<boolean>(false);

  const [selectedContract, setSelectedContract] =
    useState<ContractSummary | null>(null);
  // Año que se usará para pre-filtrar el modal
  const [modalPreYear, setModalPreYear] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedFilter,
    selectedStatus,
    selectedYear,
    streetTerm,
    selectedStreetKey,
  ]);

  // ── Status styles ───────────────────────────────────────────────
  const getStatusClass = (estatus: string) => {
    const v = estatus.trim().toLowerCase();
    if (v === "pagado") return "status-paid";
    if (v === "corriente") return "status-current";
    if (v === "rezagado") return "status-warning";
    if (v === "adeudo") return "status-danger";
    return "status-pending";
  };

  const getStatusStyle = (estatus: string): React.CSSProperties => {
    const v = estatus.trim().toLowerCase();
    if (v === "pagado")
      return { backgroundColor: "#88ffb4e7", color: "#003111" };
    if (v === "corriente")
      return { backgroundColor: "#5aa07375", color: "#34d474" };
    if (v === "rezagado")
      return { backgroundColor: "#ca8a04", color: "#fefce8" };
    if (v === "adeudo")
      return { backgroundColor: "#ee5252c4", color: "#3b0101" };
    return { backgroundColor: "#374151", color: "#d1d5db" };
  };

  const badgeStyle = (estatus: string): React.CSSProperties => ({
    ...getStatusStyle(estatus),
    padding: "0.25rem 0.65rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block",
  });

  // ── Data loading ────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return;
      }
      const data = await getContractData();
      setContracts(data);
    } catch (err: any) {
      const message =
        err.response?.status === 403
          ? "Acceso prohibido. Tu sesión puede haber expirado."
          : err.response?.status === 401
            ? "No autorizado. Por favor, inicia sesión nuevamente."
            : "Ocurrió un error al cargar los datos.";
      setError(message);
      Swal.fire({ icon: "error", title: "Error", text: message });
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("access");
        localStorage.removeItem("usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Year options (extraídos dinámicamente, sin "todos") ─────────
  const yearOptions: FilterOption[] = React.useMemo(() => {
    const years = Array.from(
      new Set(contracts.map((c) => c.anio?.toString()).filter(Boolean)),
    ).sort((a, b) => Number(b) - Number(a));
    return years.map((y) => ({ id: `year-${y}`, label: y!, value: y! }));
  }, [contracts]);

  // Auto-seleccionar el año más reciente cuando cargan los datos
  useEffect(() => {
    if (yearOptions.length > 0 && selectedYear === "all") {
      setSelectedYear(yearOptions[0].value);
    }
  }, [yearOptions]);

  // ── Filter helpers ──────────────────────────────────────────────
  const filterByDateRange = (contract: ContractSummary): boolean => {
    if (selectedFilter === "all") return true;
    if (!contract.ultimo_pago) return false;
    const fechaLimpia = contract.ultimo_pago.includes("T")
      ? contract.ultimo_pago.split("T")[0]
      : contract.ultimo_pago;
    const [year, month, day] = fechaLimpia.split("-").map(Number);
    const lastPaymentDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (today.getTime() - lastPaymentDate.getTime()) / 86400000,
    );
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

  const filterByStatus = (contract: ContractSummary): boolean => {
    if (selectedStatus === "all") return true;
    return contract.estatus_deuda.trim().toLowerCase() === selectedStatus;
  };

  const filterByYear = (contract: ContractSummary): boolean => {
    if (selectedYear === "all") return true;
    // Filtrar por el año del contrato directamente
    return contract.anio?.toString() === selectedYear;
  };

  // ── Filtered contracts ──────────────────────────────────────────
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.numero_contrato
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStreet = selectedStreetKey
      ? normalizeStreet(contract.calle || "") === selectedStreetKey
      : streetTerm.trim() === ""
        ? true
        : normalizeStreet(contract.calle || "").includes(
            normalizeStreet(streetTerm),
          );

    return (
      matchesSearch &&
      matchesStreet &&
      filterByDateRange(contract) &&
      filterByStatus(contract) &&
      filterByYear(contract)
    );
  });

  // ── Table rows ──────────────────────────────────────────────────
  const tableRows: TableRow[] = React.useMemo(() => {
    return filteredContracts.map((contract) => {
      // Calcular el total pagado solo para el año seleccionado
      const pagosDelAnio = (contract.pagos || []).filter(
        (p) => selectedYear === "all" || p.anio?.toString() === selectedYear,
      );
      const pagosTotalesFila = pagosDelAnio.reduce(
        (sum, p) => sum + Number(p.monto_recibido || 0),
        0,
      );

      return {
        rowKey: `${contract.id}-${contract.anio}`,
        contract,
        anioFila: contract.anio?.toString() || "—",
        pagosTotalesFila,
        saldoPendienteFila: Number(contract.saldo_pendiente || 0),
        modalYear: selectedYear,
      };
    });
  }, [filteredContracts, selectedYear]);

  // ── Pagination ──────────────────────────────────────────────────
  const totalPages = Math.ceil(tableRows.length / itemsPerPage);
  const currentRows = tableRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getFilterLabel = () =>
    filterOptions.find((o) => o.value === selectedFilter)?.label || "Filtrar";
  const getStatusLabel = () =>
    statusOptions.find((o) => o.value === selectedStatus)?.label || "Estado";
  const getYearLabel = () =>
    yearOptions.find((o) => o.value === selectedYear)?.label || "Año";

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
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
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // ── Street groups ───────────────────────────────────────────────
  type StreetGroup = {
    key: string;
    label: string;
    count: number;
    variants: string[];
  };

  const streetGroups: StreetGroup[] = React.useMemo(() => {
    const map = new Map<
      string,
      { count: number; rawCount: Map<string, number> }
    >();
    for (const c of contracts) {
      const raw = (c.calle || "").trim();
      const key = normalizeStreet(raw);
      if (!key) continue;
      if (!map.has(key)) map.set(key, { count: 0, rawCount: new Map() });
      const entry = map.get(key)!;
      entry.count += 1;
      entry.rawCount.set(raw, (entry.rawCount.get(raw) || 0) + 1);
    }
    const groups: StreetGroup[] = [];
    for (const [key, entry] of map.entries()) {
      const sortedVariants = Array.from(entry.rawCount.entries()).sort(
        (a, b) => b[1] - a[1],
      );
      const labelRaw = sortedVariants[0]?.[0] || key;
      const label = prettyStreet(normalizeStreet(labelRaw));
      const variants = sortedVariants
        .map(([v]) => v)
        .filter((v) => normalizeStreet(v) !== normalizeStreet(labelRaw))
        .slice(0, 3);
      groups.push({ key, label, count: entry.count, variants });
    }
    return groups.sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );
  }, [contracts]);

  const streetSuggestions = React.useMemo(() => {
    const q = normalizeStreet(streetTerm);
    if (!q) return streetGroups.slice(0, 10);
    return streetGroups
      .filter((g) => g.key.includes(q) || normalizeStreet(g.label).includes(q))
      .slice(0, 10);
  }, [streetTerm, streetGroups]);

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="contracts-page-container">
      <div className="contracts-card">
        <h2 className="contracts-title">
          <span className="contracts-title-gradient">
            Consulta de Pagos Realizados
          </span>
        </h2>
        <div className="contracts-divider"></div>

        {/* ── TOOLBAR ─────────────────────────────────────────────── */}
        <div className="contracts-toolbar">
          {/* Filtro por fecha */}
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
                  {filterOptions.map((opt) => (
                    <li key={opt.id}>
                      <div
                        className="contracts-dropdown-item"
                        onClick={() => {
                          setSelectedFilter(opt.value);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <input
                          type="radio"
                          checked={selectedFilter === opt.value}
                          readOnly
                          className="radio"
                        />
                        <label className="radio-label">{opt.label}</label>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Filtro por estado */}
          <div className="contracts-dropdown-container">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="contracts-filter-button"
              type="button"
            >
              <Clock className="icon" />
              <span>{getStatusLabel()}</span>
              <ChevronDown className="icon-small" />
            </button>
            {isStatusDropdownOpen && (
              <div className="contracts-dropdown">
                <ul className="contracts-dropdown-list">
                  {statusOptions.map((opt) => (
                    <li key={opt.id}>
                      <div
                        className="contracts-dropdown-item"
                        onClick={() => {
                          setSelectedStatus(opt.value);
                          setIsStatusDropdownOpen(false);
                        }}
                      >
                        <input
                          type="radio"
                          checked={selectedStatus === opt.value}
                          readOnly
                          className="radio"
                        />
                        <label className="radio-label">{opt.label}</label>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Filtro por año */}
          <div className="contracts-dropdown-container">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="contracts-filter-button"
              type="button"
            >
              <Calendar className="icon" />
              <span>{getYearLabel()}</span>
              <ChevronDown className="icon-small" />
            </button>
            {isYearDropdownOpen && (
              <div className="contracts-dropdown">
                <ul className="contracts-dropdown-list">
                  {yearOptions.map((opt) => (
                    <li key={opt.id}>
                      <div
                        className="contracts-dropdown-item"
                        onClick={() => {
                          setSelectedYear(opt.value);
                          setIsYearDropdownOpen(false);
                        }}
                      >
                        <input
                          type="radio"
                          checked={selectedYear === opt.value}
                          readOnly
                          className="radio"
                        />
                        <label className="radio-label">{opt.label}</label>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Filtro por calle */}
          <div className="contracts-street-filter">
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                value={streetTerm}
                onChange={(e) => {
                  setStreetTerm(e.target.value);
                  setSelectedStreetKey("");
                  setIsStreetDropdownOpen(true);
                }}
                onFocus={() => setIsStreetDropdownOpen(true)}
                onBlur={() =>
                  setTimeout(() => setIsStreetDropdownOpen(false), 150)
                }
                className="contracts-search-input"
                placeholder="Filtrar por calle"
              />
              {isStreetDropdownOpen && (
                <div
                  className="contracts-dropdown"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                  }}
                >
                  <ul className="contracts-dropdown-list">
                    {streetSuggestions.length > 0 ? (
                      streetSuggestions.map((g) => (
                        <li key={g.key}>
                          <div
                            className="contracts-dropdown-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setStreetTerm(g.label);
                              setSelectedStreetKey(g.key);
                              setIsStreetDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{g.label}</span>
                            </div>
                            {g.variants.length > 0 && (
                              <div
                                style={{ fontSize: "0.75rem", color: "#aaa" }}
                              >
                                También aparece como: {g.variants.join(" · ")}
                              </div>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>
                        <div className="contracts-dropdown-item">
                          No hay coincidencias
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            {(streetTerm.trim() !== "" || selectedStreetKey) && (
              <button
                type="button"
                className="contracts-filter-button"
                style={{ padding: "0.55rem 0.8rem" }}
                onClick={() => {
                  setStreetTerm("");
                  setSelectedStreetKey("");
                }}
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Buscador */}
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

        {/* Indicador de totales */}
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
              <strong style={{ color: "#58b2ee" }}>{tableRows.length}</strong>
            </div>
          </div>
        )}

        {loading && (
          <p style={{ textAlign: "center", padding: "2rem" }}>
            Cargando datos...
          </p>
        )}
        {error && (
          <p style={{ textAlign: "center", padding: "2rem", color: "#ff6b6b" }}>
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
                    <th className="th">Calle</th>
                    <th className="th">Año</th>
                    <th className="th">Total pagado</th>
                    <th className="th">Total restante</th>
                    <th className="th">Estatus</th>
                    <th className="th">Detalles</th>
                  </tr>
                </thead>

                <tbody className="contracts-tbody">
                  {currentRows.map((row) => (
                    <tr key={row.rowKey}>
                      <td className="td">{row.contract.numero_contrato}</td>
                      <td className="td-name">
                        {row.contract.nombre_completo}
                      </td>
                      <td className="td">{row.contract.calle}</td>
                      <td className="td">{row.anioFila}</td>
                      <td className="td">
                        ${row.pagosTotalesFila.toLocaleString()}
                      </td>
                      <td className="td">
                        ${row.saldoPendienteFila.toLocaleString()}
                      </td>
                      <td className="td">
                        <span
                          className={`status-badge ${getStatusClass(row.contract.estatus_deuda)}`}
                          style={badgeStyle(row.contract.estatus_deuda)}
                        >
                          {row.contract.estatus_deuda}
                        </span>
                      </td>

                      {/* Ver más — pre-filtra modal al año de esta fila */}
                      <td className="td-actions">
                        <button
                          onClick={() => {
                            setModalPreYear(row.modalYear);
                            setSelectedContract(row.contract);
                          }}
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

              {currentRows.length === 0 && (
                <div className="no-results">No se encontraron datos</div>
              )}
            </div>

            {/* Paginación */}
            {tableRows.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
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
                      }}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={index} style={{ color: "#666" }}>
                      ...
                    </span>
                  ),
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
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────
          MODAL — pre-filtrado al año de la fila clickeada
      ──────────────────────────────────────────────────────────── */}
      {selectedContract &&
        (() => {
          const allPagos = selectedContract.pagos || [];

          const pagosFiltrados =
            modalPreYear !== "all"
              ? allPagos.filter((p) => p.anio?.toString() === modalPreYear)
              : allPagos;

          const pagosOrdenados = [...pagosFiltrados].sort((a, b) => {
            const fa = (a.fecha_pago || "").split("T")[0];
            const fb = (b.fecha_pago || "").split("T")[0];
            return new Date(fa).getTime() - new Date(fb).getTime();
          });

          const pagosPorAnio: Record<string, typeof allPagos> = {};
          pagosOrdenados.forEach((pago) => {
            const anio = pago.anio?.toString() || "Sin año";
            if (!pagosPorAnio[anio]) pagosPorAnio[anio] = [];
            pagosPorAnio[anio].push(pago);
          });

          const aniosOrdenados = Object.keys(pagosPorAnio).sort(
            (a, b) => Number(b) - Number(a),
          );

          const montoFiltrado = pagosOrdenados.reduce(
            (sum, p) => sum + Number(p.monto_recibido || 0),
            0,
          );

          const fechaInicioFiltrada = pagosOrdenados.length
            ? pagosOrdenados[0].fecha_pago
            : "";
          const ultimoPagoFiltrado = pagosOrdenados.length
            ? pagosOrdenados[pagosOrdenados.length - 1].fecha_pago
            : "";

          const pagosConComentarios = pagosOrdenados.filter(
            (p) => p.comentarios && p.comentarios.trim() !== "",
          );

          return (
            <div
              className="modal-overlay"
              onClick={() => setSelectedContract(null)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 className="modal-title">
                    Detalles del Contrato
                    {modalPreYear !== "all" && (
                      <span
                        style={{
                          marginLeft: "0.75rem",
                          fontSize: "0.85rem",
                          fontWeight: 400,
                          color: "#58b2ee",
                          backgroundColor: "#1a2a3a",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid #58b2ee44",
                        }}
                      >
                        Año {modalPreYear}
                      </span>
                    )}
                  </h3>
                  <button
                    className="close-button"
                    onClick={() => setSelectedContract(null)}
                  >
                    x
                  </button>
                </div>

                <div className="modal-body">
                  {/* INFO GENERAL */}
                  <div className="detail-section">
                    <h4 className="section-title">Información General</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Número de Contrato</div>
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
                          <span
                            className={`status-badge ${getStatusClass(selectedContract.estatus_deuda)}`}
                            style={badgeStyle(selectedContract.estatus_deuda)}
                          >
                            {selectedContract.estatus_deuda}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RESUMEN FINANCIERO */}
                  <div className="detail-section">
                    <h4 className="section-title">
                      Resumen Financiero
                      {modalPreYear !== "all" && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 400,
                            color: "#999",
                            marginLeft: "0.5rem",
                          }}
                        >
                          (solo {modalPreYear})
                        </span>
                      )}
                    </h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Total Pagado</div>
                        <div className="detail-value text-success">
                          ${montoFiltrado.toLocaleString()}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Primer pago</div>
                        <div className="detail-value">
                          {formatFechaLocal(fechaInicioFiltrada)}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Último Pago</div>
                        <div className="detail-value">
                          {formatFechaLocal(ultimoPagoFiltrado)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HISTORIAL agrupado por año */}
                  <div className="detail-section">
                    <h4 className="section-title">
                      Historial de Pagos ({pagosFiltrados.length})
                    </h4>

                    {pagosFiltrados.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#999",
                          padding: "1.5rem",
                        }}
                      >
                        No hay pagos registrados para este período
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.25rem",
                        }}
                      >
                        {aniosOrdenados.map((anio) => {
                          const pagosDeEsteAnio = pagosPorAnio[anio];
                          const totalAnio = pagosDeEsteAnio.reduce(
                            (sum, p) => sum + Number(p.monto_recibido || 0),
                            0,
                          );

                          return (
                            <div key={anio}>
                              {/* Encabezado de sección por año — solo si hay más de 1 */}
                              {aniosOrdenados.length > 1 && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    marginBottom: "0.6rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      fontWeight: 700,
                                      color: "#58b2ee",
                                      backgroundColor: "#1a2a3a",
                                      padding: "0.2rem 0.75rem",
                                      borderRadius: "6px",
                                      border: "1px solid #58b2ee55",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    {anio}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                    }}
                                  >
                                    {pagosDeEsteAnio.length} pago
                                    {pagosDeEsteAnio.length !== 1 ? "s" : ""} ·
                                    Total:{" "}
                                    <strong style={{ color: "#4ade80" }}>
                                      ${totalAnio.toLocaleString()}
                                    </strong>
                                  </span>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: "1px",
                                      backgroundColor: "#2a2a2a",
                                    }}
                                  />
                                </div>
                              )}
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
                                    {pagosDeEsteAnio.map((pago, index) => (
                                      <tr key={pago.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                          {formatFechaLocal(pago.fecha_pago)}
                                        </td>
                                        <td className="text-success">
                                          $
                                          {Number(
                                            pago.monto_recibido || 0,
                                          ).toLocaleString()}
                                        </td>
                                        <td>
                                          {pago.nombre_descuento ||
                                            "Sin descuento"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* COMENTARIOS */}
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
                      {pagosConComentarios.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          {pagosConComentarios.map((pago, index) => (
                            <div
                              key={pago.id}
                              style={{
                                backgroundColor: "#252831",
                                padding: "0.75rem 1rem",
                                borderRadius: "6px",
                                borderLeft: "3px solid #58b2ee",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#58b2ee",
                                  }}
                                >
                                  Pago del {formatFechaLocal(pago.fecha_pago)}
                                </span>
                                <span
                                  style={{ fontSize: "0.7rem", color: "#999" }}
                                >
                                  #{index + 1}
                                </span>
                              </div>
                              <p style={{ margin: 0, color: "#e0e0e0" }}>
                                {pago.comentarios}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#999",
                            padding: "1.5rem",
                          }}
                        >
                          No hay comentarios registrados
                          {modalPreYear !== "all"
                            ? ` para ${modalPreYear}`
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default ContractTable;
