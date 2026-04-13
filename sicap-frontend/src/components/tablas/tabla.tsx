import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Ban,
  FileText,
  MapPin,
  DollarSign,
  MessageSquare,
  CreditCard,
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
// Status Config
// ─────────────────────────────────────────────
const statusConfig: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
    dot: string;
  }
> = {
  pagado: {
    bg: "#0d2e1a",
    text: "#4ade80",
    border: "#166534",
    icon: <CheckCircle2 size={11} />,
    dot: "#4ade80",
  },
  corriente: {
    bg: "#0d1f2e",
    text: "#38bdf8",
    border: "#0c4a6e",
    icon: <Clock3 size={11} />,
    dot: "#38bdf8",
  },
  rezagado: {
    bg: "#2d1a00",
    text: "#fbbf24",
    border: "#92400e",
    icon: <AlertCircle size={11} />,
    dot: "#fbbf24",
  },
  adeudo: {
    bg: "#2d0a0a",
    text: "#f87171",
    border: "#7f1d1d",
    icon: <Ban size={11} />,
    dot: "#f87171",
  },
};

const getStatusConf = (estatus: string) =>
  statusConfig[estatus.trim().toLowerCase()] || {
    bg: "#1e2028",
    text: "#9ca3af",
    border: "#374151",
    icon: null,
    dot: "#9ca3af",
  };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const statusConfig: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
    dot: string;
  }
> = {
  pagado: {
    bg: "#0d2e1a",
    text: "#4ade80",
    border: "#166534",
    icon: <CheckCircle2 size={11} />,
    dot: "#4ade80",
  },
  corriente: {
    bg: "#0d1f2e",
    text: "#38bdf8",
    border: "#0c4a6e",
    icon: <Clock3 size={11} />,
    dot: "#38bdf8",
  },
  rezagado: {
    bg: "#2d1a00",
    text: "#fbbf24",
    border: "#92400e",
    icon: <AlertCircle size={11} />,
    dot: "#fbbf24",
  },
  adeudo: {
    bg: "#2d0a0a",
    text: "#f87171",
    border: "#7f1d1d",
    icon: <Ban size={11} />,
    dot: "#f87171",
  },
};

const defaultStatusConf = {
  bg: "#1e2028",
  text: "#9ca3af",
  border: "#374151",
  icon: null,
  dot: "#9ca3af",
};

const getStatusConf = (estatus: string) =>
  statusConfig[estatus.trim().toLowerCase()] ?? defaultStatusConf;

// ─────────────────────────────────────────────
// Helpers (fuera del componente — no se recrean)
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
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (amount: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

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
// Sub-components
// ─────────────────────────────────────────────
const StatusBadge: React.FC<{ estatus: string }> = ({ estatus }) => {
  const conf = getStatusConf(estatus);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        backgroundColor: conf.bg,
        color: conf.text,
        border: `1px solid ${conf.border}`,
        padding: "0.28rem 0.65rem",
        borderRadius: "9999px",
        fontSize: "0.72rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {conf.icon}
      {estatus}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, color = "#58b2ee", icon }) => (
  <div
    style={{
      backgroundColor: "#13151c",
      border: "1px solid #252831",
      borderRadius: "12px",
      padding: "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        backgroundColor: color,
        opacity: 0.6,
      }}
    />
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ color, opacity: 0.8 }}>{icon}</span>
      <span
        style={{
          fontSize: "0.72rem",
          color: "#6b7280",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        fontSize: "1.25rem",
        fontWeight: 700,
        color: color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{sub}</div>}
  </div>
);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const ContractTable: React.FC = () => {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Inputs con debounce — evitan filtrar en cada tecla
  const [searchInput, setSearchInput] = useState<string>("");
  const [streetInput, setStreetInput] = useState<string>("");
  const searchTerm = useDebounce(searchInput, 250);
  const streetTermDebounced = useDebounce(streetInput, 250);

  const [selectedStreetKey, setSelectedStreetKey] = useState<string>("");
  const [isStreetDropdownOpen, setIsStreetDropdownOpen] =
    useState<boolean>(false);

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] =
    useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState<boolean>(false);

  const [selectedContract, setSelectedContract] =
    useState<ContractSummary | null>(null);
  const [modalPreYear, setModalPreYear] = useState<string>("all");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Ref para evitar doble-fetch en StrictMode
  const fetchedRef = useRef(false);

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

  // ── Data loading ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    // Usar caché si ya se cargó antes
    if (cachedContracts) {
      setContracts(cachedContracts);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return;
      }
      const data = await getContractData();
      cachedContracts = data;
      setContracts(data);
    } catch (err: any) {
      const message =
        err.response?.status === 403
          ? "Acceso prohibido. Tu sesión puede haber expirado."
          : err.response?.status === 401
            ? "No autorizado. Por favor, inicia sesión nuevamente."
            : err.response?.status === 429
              ? "Demasiadas solicitudes. Espera un momento antes de recargar."
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
  }, []);

  // ── Year options ─────────────────────────────────────────────────
  const yearOptions: FilterOption[] = React.useMemo(() => {
    const years = Array.from(
      new Set(contracts.map((c) => c.anio?.toString()).filter(Boolean)),
    ).sort((a, b) => Number(b) - Number(a));
    return years.map((y) => ({ id: `year-${y}`, label: y!, value: y! }));
  }, [contracts]);

  useEffect(() => {
    if (!yearInitialized.current && yearOptions.length > 0) {
      setSelectedYear(yearOptions[0].value);
      yearInitialized.current = true;
    }
  }, [yearOptions]);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedFilter,
    selectedStatus,
    selectedYear,
    streetTermDebounced,
    selectedStreetKey,
  ]);

  // ── Street groups (calculado una sola vez por dataset) ───────────
  const streetGroups = React.useMemo(
    () => buildStreetGroups(contracts),
    [contracts],
  );

  const filterByYear = (contract: ContractSummary): boolean => {
    if (selectedYear === "all") return true;
    return contract.anio?.toString() === selectedYear;
  };

  // ── Filter helpers (funciones puras, memoizadas) ─────────────────
  const filterByDateRange = useCallback(
    (contract: ContractSummary): boolean => {
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
    },
    [selectedFilter],
  );

  // ── Filtered + table rows en un solo useMemo ─────────────────────
  const tableRows = React.useMemo<TableRow[]>(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const normalizedStreet = normalizeStreet(streetTermDebounced);

    return contracts
      .filter((contract) => {
        // Búsqueda por nombre/contrato
        if (
          lowerSearch &&
          !contract.numero_contrato
            .toString()
            .toLowerCase()
            .includes(lowerSearch) &&
          !contract.nombre_completo.toLowerCase().includes(lowerSearch)
        )
          return false;

  // ── Table rows ──────────────────────────────────────────────────
  const tableRows: TableRow[] = React.useMemo(() => {
    return filteredContracts.map((contract) => {
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

        // Filtro de año
        if (
          selectedYear &&
          selectedYear !== "all" &&
          contract.anio?.toString() !== selectedYear
        )
          return false;

        // Filtro de fecha
        if (!filterByDateRange(contract)) return false;

        return true;
      })
      .map((contract) => {
        const pagosDelAnio = (contract.pagos || []).filter(
          (p) =>
            !selectedYear ||
            selectedYear === "all" ||
            p.anio?.toString() === selectedYear,
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
          modalYear: selectedYear || "all",
        };
      });
  }, [
    contracts,
    searchTerm,
    streetTermDebounced,
    selectedStreetKey,
    selectedStatus,
    selectedYear,
    filterByDateRange,
  ]);

  // ── Pagination ───────────────────────────────────────────────────
  const totalPages = Math.ceil(tableRows.length / itemsPerPage);
  const currentRows = React.useMemo(
    () =>
      tableRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [tableRows, currentPage, itemsPerPage],
  );

  const getFilterLabel = () =>
    filterOptions.find((o) => o.value === selectedFilter)?.label || "Filtrar";
  const getStatusLabel = () =>
    statusOptions.find((o) => o.value === selectedStatus)?.label || "Estado";
  const getYearLabel = () =>
    yearOptions.find((o) => o.value === selectedYear)?.label || "Año";

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
    },
    [totalPages],
  );

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

  const activeFiltersCount = [
    selectedFilter !== "all",
    selectedStatus !== "all",
    selectedYear !== "all" && selectedYear !== "",
    streetInput.trim() !== "",
    searchInput.trim() !== "",
  ].filter(Boolean).length;

  const handleClearAll = useCallback(() => {
    setSelectedFilter("all");
    setSelectedStatus("all");
    setStreetInput("");
    setSelectedStreetKey("");
    setSearchInput("");
  }, []);

  const streetSuggestions = React.useMemo(() => {
    const q = normalizeStreet(streetTerm);
    if (!q) return streetGroups.slice(0, 10);
    return streetGroups
      .filter((g) => g.key.includes(q) || normalizeStreet(g.label).includes(q))
      .slice(0, 10);
  }, [streetTerm, streetGroups]);

  // ── Active filters count ─────────────────────────────────────────
  const activeFiltersCount = [
    selectedFilter !== "all",
    selectedStatus !== "all",
    selectedYear !== "all",
    streetTerm.trim() !== "",
    searchTerm.trim() !== "",
  ].filter(Boolean).length;

  // ── Shared dropdown style ────────────────────────────────────────
  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    minWidth: "200px",
    backgroundColor: "#13151c",
    border: "1px solid #252831",
    borderRadius: "10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    zIndex: 30,
    overflow: "hidden",
  };

  const dropdownItemStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.6rem 0.9rem",
    cursor: "pointer",
    backgroundColor: active ? "#1e2533" : "transparent",
    color: active ? "#58b2ee" : "#d1d5db",
    fontSize: "0.82rem",
    transition: "background 0.15s",
  });

  const filterButtonStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.5rem 0.85rem",
    backgroundColor: active ? "#1a2a3a" : "#13151c",
    border: `1px solid ${active ? "#58b2ee55" : "#252831"}`,
    borderRadius: "8px",
    color: active ? "#58b2ee" : "#9ca3af",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  });

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="contracts-page-container">
      <div
        className="contracts-card"
        style={{ backgroundColor: "#0d0f14", border: "1px solid #1a1d24" }}
      >
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div style={{ padding: "1.5rem 1.75rem 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#f9fafb",
                }}
              >
                Consulta de Pagos Realizados
              </h2>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.78rem",
                  color: "#6b7280",
                }}
              >
                Gestión y seguimiento de contratos y pagos
              </p>
            </div>
            {!loading && !error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#13151c",
                  border: "1px solid #252831",
                  borderRadius: "8px",
                  padding: "0.5rem 0.9rem",
                }}
              >
                <FileText size={14} style={{ color: "#58b2ee" }} />
                <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                  Total:{" "}
                  <strong style={{ color: "#58b2ee", fontSize: "0.9rem" }}>
                    {tableRows.length}
                  </strong>{" "}
                  contratos
                </span>
              </div>
            )}
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: "#1a1d24",
              marginBottom: "1.25rem",
            }}
          />
        </div>

        {/* ── TOOLBAR ─────────────────────────────────────────────── */}
        <div
          style={{
            padding: "0 1.75rem 1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          {/* Filtro fecha */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={filterButtonStyle(selectedFilter !== "all")}
              type="button"
            >
              <Clock size={13} />
              <span>{getFilterLabel()}</span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
            {isDropdownOpen && (
              <div style={dropdownStyle}>
                {filterOptions.map((opt) => (
                  <div
                    key={opt.id}
                    style={dropdownItemStyle(selectedFilter === opt.value)}
                    onClick={() => {
                      setSelectedFilter(opt.value);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor:
                          selectedFilter === opt.value ? "#58b2ee" : "#374151",
                        flexShrink: 0,
                      }}
                    />
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtro estado */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              style={filterButtonStyle(selectedStatus !== "all")}
              type="button"
            >
              <TrendingUp size={13} />
              <span>{getStatusLabel()}</span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
            {isStatusDropdownOpen && (
              <div style={dropdownStyle}>
                {statusOptions.map((opt) => {
                  const conf = getStatusConf(opt.value);
                  return (
                    <div
                      key={opt.id}
                      style={dropdownItemStyle(selectedStatus === opt.value)}
                      onClick={() => {
                        setSelectedStatus(opt.value);
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor:
                            opt.value !== "all" ? conf.dot : "#374151",
                          flexShrink: 0,
                        }}
                      />
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filtro año */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              style={filterButtonStyle(selectedYear !== "all")}
              type="button"
            >
              <Calendar size={13} />
              <span>{getYearLabel()}</span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
            {isYearDropdownOpen && (
              <div style={dropdownStyle}>
                {yearOptions.map((opt) => (
                  <div
                    key={opt.id}
                    style={dropdownItemStyle(selectedYear === opt.value)}
                    onClick={() => {
                      setSelectedYear(opt.value);
                      setIsYearDropdownOpen(false);
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor:
                          selectedYear === opt.value ? "#58b2ee" : "#374151",
                        flexShrink: 0,
                      }}
                    />
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtro calle */}
          <div style={{ position: "relative", display: "flex", gap: "0.4rem" }}>
            <div style={{ position: "relative" }}>
              <MapPin
                size={13}
                style={{
                  position: "absolute",
                  left: "0.65rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={streetInput}
                onChange={(e) => {
                  setStreetInput(e.target.value);
                  setSelectedStreetKey("");
                  setIsStreetDropdownOpen(true);
                }}
                onFocus={() => setIsStreetDropdownOpen(true)}
                onBlur={() =>
                  setTimeout(() => setIsStreetDropdownOpen(false), 150)
                }
                style={{
                  backgroundColor: selectedStreetKey ? "#1a2a3a" : "#13151c",
                  border: `1px solid ${selectedStreetKey ? "#58b2ee55" : "#252831"}`,
                  borderRadius: "8px",
                  color: "#d1d5db",
                  fontSize: "0.8rem",
                  padding: "0.5rem 0.75rem 0.5rem 2rem",
                  outline: "none",
                  width: "190px",
                }}
                placeholder="Filtrar por calle..."
              />
              {isStreetDropdownOpen && (
                <div style={{ ...dropdownStyle, width: "240px" }}>
                  {streetSuggestions.length > 0 ? (
                    streetSuggestions.map((g) => (
                      <div
                        key={g.key}
                        style={{
                          ...dropdownItemStyle(selectedStreetKey === g.key),
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "0.2rem",
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setStreetTerm(g.label);
                          setSelectedStreetKey(g.key);
                          setIsStreetDropdownOpen(false);
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{g.label}</span>
                        {g.variants.length > 0 && (
                          <span
                            style={{ fontSize: "0.68rem", color: "#6b7280" }}
                          >
                            {g.variants.join(" · ")}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "0.75rem 0.9rem",
                        color: "#6b7280",
                        fontSize: "0.8rem",
                      }}
                    >
                      Sin coincidencias
                    </div>
                  )}
                </div>
              )}
            </div>
            {(streetInput.trim() !== "" || selectedStreetKey) && (
              <button
                type="button"
                onClick={() => {
                  setStreetInput("");
                  setSelectedStreetKey("");
                }}
                style={{ ...filterButtonStyle(false), padding: "0.5rem" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Buscador */}
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "0.65rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: "#13151c",
                border: `1px solid ${searchTerm ? "#58b2ee55" : "#252831"}`,
                borderRadius: "8px",
                color: "#d1d5db",
                fontSize: "0.8rem",
                padding: "0.5rem 0.75rem 0.5rem 2rem",
                outline: "none",
                width: "220px",
              }}
              placeholder="Contrato o nombre..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0.1rem",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Limpiar todo */}
          {activeFiltersCount > 1 && (
            <button
              type="button"
              onClick={() => {
                setSelectedFilter("all");
                setSelectedStatus("all");
                setStreetTerm("");
                setSelectedStreetKey("");
                setSearchTerm("");
              }}
              style={{
                ...filterButtonStyle(false),
                color: "#f87171",
                borderColor: "#7f1d1d22",
                gap: "0.3rem",
              }}
            >
              <X size={12} />
              Limpiar todo
            </button>
          )}
        </div>

        {loading && (
          <div
            style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}
          >
            <div style={{ fontSize: "0.9rem" }}>Cargando datos...</div>
          </div>
        )}
        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#f87171",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── TABLE ───────────────────────────────────────────── */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.82rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#0a0c10",
                      borderBottom: "1px solid #1a1d24",
                    }}
                  >
                    {[
                      "N° Contrato",
                      "Nombre",
                      "Calle",
                      "Año",
                      "Total pagado",
                      "Total restante",
                      "Estatus",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: i >= 4 && i <= 5 ? "right" : "left",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          whiteSpace: "nowrap",
                          borderRight: i < 7 ? "1px solid #1a1d24" : "none",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {currentRows.map((row) => {
                    const isHovered = hoveredRow === row.rowKey;
                    return (
                      <tr
                        key={row.rowKey}
                        onMouseEnter={() => setHoveredRow(row.rowKey)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          backgroundColor: isHovered
                            ? "#13151c"
                            : "transparent",
                          borderBottom: "1px solid #1a1d24",
                          transition: "background 0.1s",
                          cursor: "default",
                        }}
                      >
                        {/* N° Contrato */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                              color: "#58b2ee",
                              backgroundColor: "#0d1f2e",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "5px",
                              fontWeight: 600,
                            }}
                          >
                            #{row.contract.numero_contrato}
                          </span>
                        </td>

                        {/* Nombre */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            color: "#e5e7eb",
                            fontWeight: 500,
                            maxWidth: "200px",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.contract.nombre_completo}
                          </div>
                        </td>

                        {/* Calle */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            color: "#9ca3af",
                            maxWidth: "160px",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <MapPin
                              size={11}
                              style={{ flexShrink: 0, color: "#4b5563" }}
                            />
                            {row.contract.calle || "—"}
                          </div>
                        </td>

                        {/* Año */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            color: "#6b7280",
                            fontFamily: "monospace",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          {row.anioFila}
                        </td>

                        {/* Total pagado */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            textAlign: "right",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              fontSize: "0.83rem",
                              color:
                                row.pagosTotalesFila > 0
                                  ? "#4ade80"
                                  : "#6b7280",
                            }}
                          >
                            {formatMoney(row.pagosTotalesFila)}
                          </span>
                        </td>

                        {/* Total restante */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            textAlign: "right",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              fontSize: "0.83rem",
                              color:
                                row.saldoPendienteFila > 0
                                  ? "#f87171"
                                  : "#4ade80",
                            }}
                          >
                            {formatMoney(row.saldoPendienteFila)}
                          </span>
                        </td>

                        {/* Estatus */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            borderRight: "1px solid #1a1d24",
                          }}
                        >
                          <StatusBadge estatus={row.contract.estatus_deuda} />
                        </td>

                        {/* Acción */}
                        <td
                          style={{
                            padding: "0.7rem 1rem",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() => {
                              setModalPreYear(row.modalYear);
                              setSelectedContract(row.contract);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.35rem 0.7rem",
                              backgroundColor: isHovered
                                ? "#1a2a3a"
                                : "#13151c",
                              border: "1px solid #252831",
                              borderRadius: "6px",
                              color: "#58b2ee",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <Eye size={12} />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {currentRows.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#6b7280",
                    fontSize: "0.85rem",
                    borderTop: "1px solid #1a1d24",
                  }}
                >
                  <Search
                    size={24}
                    style={{
                      margin: "0 auto 0.75rem",
                      display: "block",
                      opacity: 0.3,
                    }}
                  />
                  No se encontraron resultados con los filtros actuales
                </div>
              )}
            </div>

            {/* ── PAGINATION ──────────────────────────────────────── */}
            {tableRows.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "1.25rem 1.75rem",
                  borderTop: "1px solid #1a1d24",
                }}
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#13151c",
                    border: "1px solid #252831",
                    borderRadius: "7px",
                    color: currentPage === 1 ? "#374151" : "#9ca3af",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={15} />
                </button>

                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <button
                      key={index}
                      onClick={() => goToPage(page)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "32px",
                        height: "32px",
                        padding: "0 0.5rem",
                        backgroundColor:
                          currentPage === page ? "#58b2ee" : "#13151c",
                        border: `1px solid ${currentPage === page ? "#58b2ee" : "#252831"}`,
                        borderRadius: "7px",
                        color: currentPage === page ? "#0a0c10" : "#9ca3af",
                        fontWeight: currentPage === page ? 700 : 400,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={index}
                      style={{ color: "#374151", padding: "0 0.1rem" }}
                    >
                      ···
                    </span>
                  ),
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#13151c",
                    border: "1px solid #252831",
                    borderRadius: "7px",
                    color: currentPage === totalPages ? "#374151" : "#9ca3af",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={15} />
                </button>

                <span
                  style={{
                    marginLeft: "0.75rem",
                    fontSize: "0.75rem",
                    color: "#4b5563",
                  }}
                >
                  Página {currentPage} de {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────
          MODAL
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
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem",
              }}
              onClick={() => setSelectedContract(null)}
            >
              <div
                style={{
                  backgroundColor: "#0d0f14",
                  border: "1px solid #1a1d24",
                  borderRadius: "16px",
                  width: "100%",
                  maxWidth: "680px",
                  maxHeight: "90vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid #1a1d24",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    background: "linear-gradient(to bottom, #13151c, #0d0f14)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          color: "#58b2ee",
                          backgroundColor: "#0d1f2e",
                          border: "1px solid #1a3a5a",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          fontWeight: 700,
                        }}
                      >
                        #{selectedContract.numero_contrato}
                      </span>
                      <StatusBadge estatus={selectedContract.estatus_deuda} />
                      {modalPreYear !== "all" && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#9ca3af",
                            backgroundColor: "#1a1d24",
                            border: "1px solid #252831",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "5px",
                          }}
                        >
                          {modalPreYear}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#f9fafb",
                      }}
                    >
                      {selectedContract.nombre_completo}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginTop: "0.3rem",
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <CreditCard size={11} />{" "}
                        {selectedContract.nombre_servicio}
                      </span>
                      {selectedContract.calle && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <MapPin size={11} /> {selectedContract.calle}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedContract(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#13151c",
                      border: "1px solid #252831",
                      borderRadius: "7px",
                      color: "#6b7280",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Modal Body */}
                <div
                  style={{
                    overflowY: "auto",
                    flex: 1,
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  {/* Stat Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "0.75rem",
                    }}
                  >
                    <StatCard
                      label="Total pagado"
                      value={formatMoney(montoFiltrado)}
                      sub={`${pagosOrdenados.length} pagos`}
                      color="#4ade80"
                      icon={<DollarSign size={14} />}
                    />
                    <StatCard
                      label="Primer pago"
                      value={formatFechaLocal(fechaInicioFiltrada)}
                      color="#38bdf8"
                      icon={<Calendar size={14} />}
                    />
                    <StatCard
                      label="Último pago"
                      value={formatFechaLocal(ultimoPagoFiltrado)}
                      color="#a78bfa"
                      icon={<Clock size={14} />}
                    />
                  </div>

                  {/* Historial */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.9rem",
                      }}
                    >
                      <CreditCard size={13} style={{ color: "#6b7280" }} />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Historial de Pagos
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          backgroundColor: "#1a1d24",
                          color: "#6b7280",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        {pagosFiltrados.length}
                      </span>
                    </div>

                    {pagosFiltrados.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#6b7280",
                          padding: "2rem",
                          backgroundColor: "#0a0c10",
                          borderRadius: "10px",
                          border: "1px solid #1a1d24",
                          fontSize: "0.82rem",
                        }}
                      >
                        Sin pagos registrados para este período
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        }}
                      >
                        {aniosOrdenados.map((anio) => {
                          const pagosDeEsteAnio = pagosPorAnio[anio];
                          const totalAnio = pagosDeEsteAnio.reduce(
                            (sum, p) => sum + Number(p.monto_recibido || 0),
                            0,
                          );
                          return (
                            <div
                              key={anio}
                              style={{
                                backgroundColor: "#0a0c10",
                                border: "1px solid #1a1d24",
                                borderRadius: "10px",
                                overflow: "hidden",
                              }}
                            >
                              {aniosOrdenados.length > 1 && (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.6rem 0.9rem",
                                    backgroundColor: "#13151c",
                                    borderBottom: "1px solid #1a1d24",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      color: "#58b2ee",
                                    }}
                                  >
                                    {anio}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {pagosDeEsteAnio.length} pago
                                    {pagosDeEsteAnio.length !== 1
                                      ? "s"
                                      : ""} ·{" "}
                                    <strong style={{ color: "#4ade80" }}>
                                      {formatMoney(totalAnio)}
                                    </strong>
                                  </span>
                                </div>
                              )}
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  fontSize: "0.78rem",
                                }}
                              >
                                <thead>
                                  <tr
                                    style={{
                                      borderBottom: "1px solid #1a1d24",
                                    }}
                                  >
                                    <th
                                      style={{
                                        padding: "0.5rem 0.9rem",
                                        textAlign: "left",
                                        color: "#4b5563",
                                        fontWeight: 600,
                                        fontSize: "0.68rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      #
                                    </th>
                                    <th
                                      style={{
                                        padding: "0.5rem 0.9rem",
                                        textAlign: "left",
                                        color: "#4b5563",
                                        fontWeight: 600,
                                        fontSize: "0.68rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      Fecha
                                    </th>
                                    <th
                                      style={{
                                        padding: "0.5rem 0.9rem",
                                        textAlign: "right",
                                        color: "#4b5563",
                                        fontWeight: 600,
                                        fontSize: "0.68rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      Monto
                                    </th>
                                    <th
                                      style={{
                                        padding: "0.5rem 0.9rem",
                                        textAlign: "left",
                                        color: "#4b5563",
                                        fontWeight: 600,
                                        fontSize: "0.68rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      Descuento
                                    </th>

                                    <th
                                      style={{
                                        padding: "0.5rem 0.9rem",
                                        textAlign: "left",
                                        color: "#4b5563",
                                        fontWeight: 600,
                                        fontSize: "0.68rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      Cobrador
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pagosDeEsteAnio.map((pago, index) => (
                                    <tr
                                      key={pago.id}
                                      style={{
                                        borderBottom:
                                          index < pagosDeEsteAnio.length - 1
                                            ? "1px solid #13151c"
                                            : "none",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "0.55rem 0.9rem",
                                          color: "#4b5563",
                                          fontFamily: "monospace",
                                        }}
                                      >
                                        {index + 1}
                                      </td>
                                      <td
                                        style={{
                                          padding: "0.55rem 0.9rem",
                                          color: "#9ca3af",
                                        }}
                                      >
                                        {formatFechaLocal(pago.fecha_pago)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "0.55rem 0.9rem",
                                          textAlign: "right",
                                          fontFamily: "monospace",
                                          fontWeight: 700,
                                          color: "#4ade80",
                                        }}
                                      >
                                        {formatMoney(
                                          Number(pago.monto_recibido || 0),
                                        )}
                                      </td>
                                      <td style={{ padding: "0.55rem 0.9rem" }}>
                                        {pago.nombre_descuento ? (
                                          <span
                                            style={{
                                              fontSize: "0.68rem",
                                              backgroundColor: "#2d1a00",
                                              color: "#fbbf24",
                                              border: "1px solid #92400e44",
                                              padding: "0.15rem 0.45rem",
                                              borderRadius: "4px",
                                            }}
                                          >
                                            {pago.nombre_descuento}
                                          </span>
                                        ) : (
                                          <span
                                            style={{
                                              color: "#374151",
                                              fontSize: "0.75rem",
                                            }}
                                          >
                                            —
                                          </span>
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          padding: "0.55rem 0.9rem",
                                          color: "#9ca3af",
                                        }}
                                      >
                                        {pago.cobrador || (
                                          <span style={{ color: "#374151" }}>
                                            —
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Comentarios */}
                  {pagosConComentarios.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <MessageSquare size={13} style={{ color: "#6b7280" }} />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Comentarios
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            backgroundColor: "#1a1d24",
                            color: "#6b7280",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                          }}
                        >
                          {pagosConComentarios.length}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {pagosConComentarios.map((pago) => (
                          <div
                            key={pago.id}
                            style={{
                              backgroundColor: "#0a0c10",
                              border: "1px solid #1a1d24",
                              borderLeft: "3px solid #58b2ee",
                              borderRadius: "8px",
                              padding: "0.75rem 1rem",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#58b2ee",
                                marginBottom: "0.4rem",
                              }}
                            >
                              Pago del {formatFechaLocal(pago.fecha_pago)}
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.8rem",
                                color: "#d1d5db",
                                lineHeight: 1.5,
                              }}
                            >
                              {pago.comentarios}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default ContractTable;
