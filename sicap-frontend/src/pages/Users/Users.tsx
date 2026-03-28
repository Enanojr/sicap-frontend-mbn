import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Battery,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Calendar, // <-- Nuevo icono importado
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
  const progressStr = String(progreso || "0").replace("%", "").trim();
  const progressValue = parseInt(progressStr) || 0;

  let color = "#10b981"; // Verde
  let fillLevel = Math.min(Math.max(progressValue, 0), 100);

  if (progressValue >= 80 && progressValue <= 100) {
    color = "#10b981";
  } else if (progressValue >= 40 && progressValue < 80) {
    color = "#f59e0b";
  } else if (progressValue >= 0 && progressValue < 40) {
    color = "#ef4444";
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
        {fillLevel}%
      </span>
    </div>
  );
};

const ProgresoTable: React.FC = () => {
  const [progresos, setProgresos] = useState<Progreso[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all"); // <-- Estado para el año seleccionado
  const [availableYears, setAvailableYears] = useState<number[]>([]); // <-- Años disponibles en la base
  
  // Estados de UI
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState<boolean>(false); // <-- Menú de años
  const [retryCount, setRetryCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const itemsPerPage = 15;

  const getStatusClass = (estatus: string) => {
    if (!estatus) return "status-pending-light";
    const value = String(estatus).trim().toLowerCase();
    if (["pagado", "corriente"].includes(value)) return "status-complete-light";
    if (["rezagado"].includes(value)) return "status-warning-light";
    if (["adeudo"].includes(value)) return "status-danger-light";
    return "status-pending-light";
  };

  useEffect(() => {
    console.log("Limpiando localStorage...");
    localStorage.clear();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Resetear página cuando cambien los filtros (ahora incluye selectedYear)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, selectedYear]);

  const loadData = async (isRetry: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllProgresos();

      if (response.success && response.data) {
        if (!Array.isArray(response.data)) {
          throw new Error("Formato de datos inválido");
        }

        const validData = response.data.filter((item: any) => {
          return (
            item &&
            typeof item === "object" &&
            item.numero_contrato !== undefined &&
            item.nombre !== undefined
          );
        });

        // <-- Lógica para extraer años únicos dinámicamente de tu vista
        const years = Array.from(
          new Set(validData.map((item: any) => item.anio_pago).filter(Boolean))
        ) as number[];
        years.sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
        setAvailableYears(years);

        // Seleccionar automáticamente el año actual si existe, si no, el más reciente
        const currentYear = new Date().getFullYear();
        if (years.includes(currentYear)) {
          setSelectedYear(String(currentYear));
        } else if (years.length > 0) {
          setSelectedYear(String(years[0]));
        }

        setProgresos(validData);
        setRetryCount(0);
      } else {
        const errorMsg = response.errors?.general || "Error al cargar los datos de progreso";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      err.message || 
                      "Ocurrió un error al cargar los datos.";
      setError(message);

      if (!isRetry) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: message,
          showCancelButton: true,
          confirmButtonText: "Reintentar",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
        }).then((result) => {
          if (result.isConfirmed) loadData();
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error && retryCount < 3) {
      const timeout = setTimeout(() => {
        setRetryCount(retryCount + 1);
        loadData(true);
      }, 2000 * (retryCount + 1));
      return () => clearTimeout(timeout);
    }
  }, [error, retryCount]);

  // <-- Lógica de filtrado combinada
  const filteredProgresos = progresos.filter((progreso: any) => {
    if (!progreso) return false;

    const matchesSearch =
      String(progreso.numero_contrato || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(progreso.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedFilter === "all" ||
      String(progreso.estatus || "").toLowerCase() === selectedFilter.toLowerCase();

    const matchesYear =
      selectedYear === "all" ||
      String(progreso.anio_pago) === selectedYear;

    return matchesSearch && matchesStatus && matchesYear;
  });

  const totalPages = Math.ceil(filteredProgresos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProgresos = filteredProgresos.slice(startIndex, endIndex);

  const getFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === selectedFilter);
    return option ? option.label : "Todos los estatus";
  };

  const getYearLabel = () => {
    if (selectedYear === "all") return "Todos los años";
    return selectedYear;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "1rem" }}>
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
        {/* ENCABEZADO Y BOTONES */}
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <button
            onClick={() => window.location.href = "https://comisiondeaguaguadalupehidalgo.wordpress.com/"}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6", color: "white", border: "none",
              borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem",
              fontWeight: 500, transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            <ArrowLeft size={18} />
            <span style={{ display: windowWidth < 640 ? "none" : "inline" }}>Regresar al Sitio Principal</span>
            <span style={{ display: windowWidth >= 640 ? "none" : "inline" }}>Regresar</span>
          </button>

          <button
            onClick={() => { setRetryCount(0); loadData(); }}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
              backgroundColor: loading ? "#9ca3af" : "#10b981", color: "white", border: "none",
              borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem", fontWeight: 500, transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#059669"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#10b981"; }}
          >
            <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span style={{ display: windowWidth < 640 ? "none" : "inline" }}>Actualizar</span>
          </button>
        </div>

        <div style={{ padding: "1rem" }}>
          <h2
            style={{
              fontSize: windowWidth < 640 ? "1.5rem" : "2rem",
              fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: "0.5rem",
            }}
          >
            PROGRESO DE PAGOS
          </h2>
          <div style={{ height: "4px", width: "100px", backgroundColor: "#3b82f6", margin: "0 auto 1.5rem", borderRadius: "2px" }}></div>

          {/* TOOLBAR */}
          <div
            style={{
              display: "flex", gap: "0.75rem", marginBottom: "1.5rem",
              flexDirection: windowWidth < 768 ? "column" : "row",
            }}
          >
            {/* <-- NUEVO: Filtro de Año --> */}
            <div style={{ position: "relative", width: windowWidth < 768 ? "100%" : "auto", minWidth: windowWidth >= 768 ? "150px" : "auto" }}>
              <button
                onClick={() => { setIsYearDropdownOpen(!isYearDropdownOpen); setIsDropdownOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem",
                  backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px",
                  cursor: "pointer", fontSize: "0.875rem", color: "#374151", width: "100%", justifyContent: "space-between",
                }}
                type="button"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={18} color="#6b7280" />
                  <span>{getYearLabel()}</span>
                </div>
                <ChevronDown size={16} color="#6b7280" />
              </button>

              {isYearDropdownOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.5rem", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", zIndex: 10 }}>
                  <ul style={{ listStyle: "none", padding: "0.5rem", margin: 0, maxHeight: "200px", overflowY: "auto" }}>
                    <li>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", cursor: "pointer", borderRadius: "4px" }}
                        onClick={() => { setSelectedYear("all"); setIsYearDropdownOpen(false); }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <input type="radio" checked={selectedYear === "all"} onChange={() => {}} style={{ margin: 0 }} />
                        <label style={{ cursor: "pointer", color: "#374151", fontSize: "0.875rem" }}>Todos los años</label>
                      </div>
                    </li>
                    {availableYears.map((year) => (
                      <li key={year}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", cursor: "pointer", borderRadius: "4px" }}
                          onClick={() => { setSelectedYear(String(year)); setIsYearDropdownOpen(false); }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <input type="radio" checked={selectedYear === String(year)} onChange={() => {}} style={{ margin: 0 }} />
                          <label style={{ cursor: "pointer", color: "#374151", fontSize: "0.875rem" }}>{year}</label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Filtro de Estatus Original */}
            <div style={{ position: "relative", width: windowWidth < 768 ? "100%" : "auto", minWidth: windowWidth >= 768 ? "200px" : "auto" }}>
              <button
                onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsYearDropdownOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem",
                  backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px",
                  cursor: "pointer", fontSize: "0.875rem", color: "#374151", width: "100%", justifyContent: "space-between",
                }}
                type="button"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Battery size={18} color="#6b7280" />
                  <span>{getFilterLabel()}</span>
                </div>
                <ChevronDown size={16} color="#6b7280" />
              </button>

              {isDropdownOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.5rem", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", zIndex: 10 }}>
                  <ul style={{ listStyle: "none", padding: "0.5rem", margin: 0 }}>
                    {filterOptions.map((option) => (
                      <li key={option.id}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", cursor: "pointer", borderRadius: "4px" }}
                          onClick={() => { setSelectedFilter(option.value); setIsDropdownOpen(false); }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <input type="radio" checked={selectedFilter === option.value} onChange={() => {}} style={{ margin: 0 }} />
                          <label style={{ cursor: "pointer", color: "#374151", fontSize: "0.875rem" }}>{option.label}</label>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Barra de búsqueda */}
            {/* Barra de búsqueda */}
            <div style={{ position: "relative", flex: 1, width: windowWidth < 768 ? "100%" : "auto", maxWidth: windowWidth >= 768 ? "500px" : "100%" }}>
              <Search size={18} color="#9ca3af" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", 
                  padding: "0.75rem 0.75rem 0.75rem 2.5rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "8px",
                  fontSize: "0.875rem", 
                  color: "#111827", // Fuerza el texto a ser oscuro
                  backgroundColor: "#ffffff", // Fuerza el fondo a ser blanco
                  colorScheme: "light", // Le dice al navegador que no use UI oscura
                  outline: "none", 
                  boxSizing: "border-box"
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                placeholder="Buscar por contrato o nombre..."
              />
            </div>
          </div>

          {/* INDICADOR TOTAL */}
          {!loading && !error && (
            <div style={{ display: "flex", justifyContent: windowWidth < 640 ? "center" : "flex-end", padding: "0.75rem 0", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.875rem", color: "#6b7280", padding: "0.5rem 1rem", backgroundColor: "#f3f4f6", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                Total de registros: <strong style={{ color: "#3b82f6" }}>{filteredProgresos.length}</strong>
              </div>
            </div>
          )}

          {/* TABLA O ESTADOS */}
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f4f6", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: "1rem", color: "#6b7280" }}>Cargando datos...</p>
            </div>
          )}
          
          {error && !loading && (
            <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
              <p style={{ color: "#ef4444", marginBottom: "1rem", fontWeight: 600 }}>{error}</p>
              <button onClick={() => { setRetryCount(0); loadData(); }} style={{ padding: "0.5rem 1rem", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Reintentar ahora</button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e5e7eb", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                  <thead style={{ backgroundColor: "#f9fafb" }}>
                    <tr>
                      {["N° Contrato", "Nombre", "Año", "Estatus", "Pendiente", "Progreso"].map((header) => (
                        <th key={header} style={{
                          padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", textAlign: header === "Progreso" ? "center" : "left",
                          fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e5e7eb"
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentProgresos.map((progreso: any, index) => (
                      <tr key={`${progreso.numero_contrato}-${progreso.anio_pago}`} style={{ backgroundColor: index % 2 === 0 ? "white" : "#f9fafb", transition: "background-color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f9fafb")}>
                        <td style={{ padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", fontSize: "0.875rem", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                          {progreso.numero_contrato || "—"}
                        </td>
                        <td style={{ padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", fontSize: "0.875rem", color: "#111827", fontWeight: 500, borderBottom: "1px solid #e5e7eb" }}>
                          {progreso.nombre || "Sin nombre"}
                        </td>
                        <td style={{ padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", fontSize: "0.875rem", color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
                          {progreso.anio_pago}
                        </td>
                        <td style={{ padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", borderBottom: "1px solid #e5e7eb" }}>
                          <span style={{
                            padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap",
                            ...(getStatusClass(progreso.estatus) === "status-complete-light" && { backgroundColor: "#d1fae5", color: "#065f46" }),
                            ...(getStatusClass(progreso.estatus) === "status-warning-light" && { backgroundColor: "#fef3c7", color: "#92400e" }),
                            ...(getStatusClass(progreso.estatus) === "status-danger-light" && { backgroundColor: "#fee2e2", color: "#991b1b" }),
                          }}>
                            {progreso.estatus || "Pendiente"}
                          </span>
                        </td>
                        <td style={{ padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", fontSize: "0.875rem", color: "#374151", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                          ${Number(progreso.saldo || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: windowWidth < 640 ? "0.75rem 0.5rem" : "1rem", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>
                          <BatteryIcon progreso={progreso.progreso} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {currentProgresos.length === 0 && (
                  <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
                    No se encontraron datos para los filtros seleccionados.
                  </div>
                )}
              </div>

              {/* PAGINACIÓN */}
              {filteredProgresos.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", flexWrap: "wrap", padding: "0.5rem" }}>
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ backgroundColor: currentPage === 1 ? "#f3f4f6" : "#3b82f6", color: currentPage === 1 ? "#9ca3af" : "white", border: currentPage === 1 ? "1px solid #e5e7eb" : "none", padding: "0.6rem 0.8rem", borderRadius: "8px", cursor: currentPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
                    <ChevronLeft size={18} />
                  </button>

                  {getPageNumbers().map((page, index) =>
                    typeof page === "number" ? (
                      <button key={index} onClick={() => goToPage(page)} style={{ backgroundColor: currentPage === page ? "#3b82f6" : "white", color: currentPage === page ? "white" : "#374151", border: currentPage === page ? "none" : "1px solid #e5e7eb", padding: windowWidth < 640 ? "0.5rem 0.75rem" : "0.6rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: currentPage === page ? 600 : 400, minWidth: windowWidth < 640 ? "36px" : "40px" }}>
                        {page}
                      </button>
                    ) : (
                      <span key={index} style={{ color: "#9ca3af", padding: "0 0.25rem" }}>...</span>
                    )
                  )}

                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ backgroundColor: currentPage === totalPages ? "#f3f4f6" : "#3b82f6", color: currentPage === totalPages ? "#9ca3af" : "white", border: currentPage === totalPages ? "1px solid #e5e7eb" : "none", padding: "0.6rem 0.8rem", borderRadius: "8px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ProgresoTable;