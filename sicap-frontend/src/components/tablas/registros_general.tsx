import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "../../styles/styles.css";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  filterFn?: (item: any) => boolean;
}

export interface ReusableTableProps<T> {
  columns: Column<T>[];
  fetchData: () => Promise<T[]>;
  searchableFields?: (keyof T)[];
  filterOptions?: FilterOption[];
  itemsPerPage?: number;
  title?: string;
  onError?: (error: any) => void;
  getStatusClass?: (status: string) => string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  showActions?: boolean;
}

export function ReusableTable<T extends Record<string, any>>({
  columns,
  fetchData,
  searchableFields = [],
  filterOptions = [],
  itemsPerPage = 15,
  title = "DATOS",
  onError,
  onEdit,
  onDelete,
  showActions = false,
}: ReusableTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>(
    filterOptions[0]?.value || "all"
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchData();

      if (Array.isArray(result)) {
        setData(result);
        console.log(
          " Datos cargados correctamente:",
          result.length,
          "registros"
        );
      } else {
        console.error(" La API no devolvió un array:", result);
        setData([]);
        setError("Los datos recibidos no son válidos");
      }
    } catch (err: any) {
      const message = err.message || "Error al cargar los datos";
      setError(message);
      setData([]);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = Array.isArray(data)
    ? data.filter((item) => {
        const matchesSearch =
          searchableFields.length === 0 ||
          searchableFields.some((field) => {
            const value = item[field];
            return String(value)
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          });

        const selectedFilterOption = filterOptions.find(
          (opt) => opt.value === selectedFilter
        );
        const matchesFilter =
          !selectedFilterOption?.filterFn ||
          selectedFilterOption.filterFn(item);

        return matchesSearch && matchesFilter;
      })
    : [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

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

  const getCellValue = (item: T, column: Column<T>) => {
    if (typeof column.key === "string" && column.key.includes(".")) {
      const keys = column.key.split(".");
      let value: any = item;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return item[column.key as keyof T];
  };

  return (
    <div className="table-wrapper-outer">
      <div className="form_tabla">
        {/* Header */}
        <div className="table-header">
          <h2 className="card-title">{title}</h2>
          <div className="card-title-divider" />
        </div>

        {/* Contenido */}
        <div className="table-content">
          {/* Toolbar */}
          <div className="table-toolbar">
            {filterOptions.length > 0 && (
              <div className="table-filter-container">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="table-filter-button"
                  type="button"
                >
                  <Clock size={18} />
                  <span>{getFilterLabel()}</span>
                  <ChevronDown size={16} />
                </button>

                {isDropdownOpen && (
                  <div className="table-dropdown">
                    <ul>
                      {filterOptions.map((option) => (
                        <li key={option.id}>
                          <div
                            className="table-dropdown-item"
                            onClick={() => {
                              setSelectedFilter(option.value);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <input
                              type="radio"
                              checked={selectedFilter === option.value}
                              onChange={() => {}}
                            />
                            <label>{option.label}</label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="table-search-container">
              <Search size={18} className="table-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="table-search-input"
                placeholder="Buscar..."
              />
            </div>
          </div>

          {/* Contador de registros */}
          {!loading && !error && (
            <div className="table-records-counter">
              <div className="table-counter-badge">
                Total de registros: <strong>{data.length}</strong>
              </div>
            </div>
          )}

          {/* Estados de carga y error */}
          {loading && <p className="table-loading">Cargando datos...</p>}
          {error && <p className="table-error">{error}</p>}

          {/* Tabla */}
          {!loading && !error && (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {columns.map((column, idx) => (
                        <th key={idx}>{column.label}</th>
                      ))}
                      {showActions && (
                        <th className="table-actions-header">Acciones</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {currentData.map((item, rowIdx) => {
                      const getKey = () => {
                        if ("id" in item && item.id != null) return item.id;
                        if ("id_servicio" in item && item.id_servicio != null)
                          return item.id_servicio;
                        if ("id_contrato" in item && item.id_contrato != null)
                          return item.id_contrato;
                        if ("numero_contrato" in item)
                          return item.numero_contrato;
                        return rowIdx;
                      };

                      return (
                        <tr key={getKey()}>
                          {columns.map((column, colIdx) => {
                            const value = getCellValue(item, column);
                            return (
                              <td key={colIdx}>
                                {column.render
                                  ? column.render(value, item)
                                  : value}
                              </td>
                            );
                          })}

                          {showActions && (
                            <td className="table-actions-cell">
                              <div className="table-actions-container">
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(item)}
                                    className="table-btn-edit"
                                  >
                                    Editar
                                  </button>
                                )}

                                {onDelete && (
                                  <button
                                    onClick={() => onDelete(item)}
                                    className="table-btn-delete"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {currentData.length === 0 && (
                  <div className="table-no-data">No se encontraron datos</div>
                )}
              </div>

              {/* Paginación */}
              {filteredData.length > 0 && (
                <div className="table-pagination">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="table-pagination-btn"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {getPageNumbers().map((page, index) =>
                    typeof page === "number" ? (
                      <button
                        key={index}
                        onClick={() => goToPage(page)}
                        className={`table-page-number ${
                          currentPage === page ? "active" : ""
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="table-page-ellipsis">
                        ...
                      </span>
                    )
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="table-pagination-btn"
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
}
