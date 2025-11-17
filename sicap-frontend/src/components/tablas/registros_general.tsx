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

  /** NUEVO: identificar el ID */
  getRowId?: (row: T) => string | number;

  /** Acciones */
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  showActions?: boolean;
}

export function ReusableTable<T extends Record<string, any>>({
  columns,
  fetchData,
  searchableFields = [],
  filterOptions = [],
  itemsPerPage = 10,
  title = "Datos",
  getRowId,
  onEdit,
  onDelete,
  showActions = true,
}: ReusableTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(Array.isArray(result) ? result : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  const filtered = data.filter((item) => {
    const matchesSearch =
      searchableFields.length === 0 ||
      searchableFields.some((field) =>
        String(item[field] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );

    const filterOption = filterOptions.find((f) => f.value === selectedFilter);
    const matchesFilter =
      !filterOption?.filterFn || filterOption.filterFn(item);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getValue = (item: T, column: Column<T>): any => {
    if (typeof column.key === "string" && column.key.includes(".")) {
      const parts = column.key.split(".");
      let value = item;
      for (const p of parts) value = value?.[p];
      return value;
    }
    return item[column.key];
  };

  return (
    <div className="table-wrapper-outer">
      <div className="form_tabla">
        {/* Título uniforme */}
        <div className="table-header">
          <h2 className="card-title">
            <span className="contracts-title-gradient">{title}</span>
          </h2>
          <div className="card-title-divider"></div>
        </div>

        <div className="table-content">
          {/* Toolbar */}
          <div className="table-toolbar">
            {filterOptions.length > 0 && (
              <div className="table-filter-container">
                <button
                  type="button"
                  className="table-filter-button"
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                >
                  <Clock size={18} />
                  <span>
                    {filterOptions.find((f) => f.value === selectedFilter)
                      ?.label || "Todos"}
                  </span>
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
                              setDropdownOpen(false);
                              setPage(1);
                            }}
                          >
                            <input
                              type="radio"
                              checked={selectedFilter === option.value}
                              readOnly
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

            {/* Search */}
            <div className="table-search-container">
              <Search size={18} className="table-search-icon" />
              <input
                className="table-search-input"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla */}
          {!loading && (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i}>{col.label}</th>
                    ))}
                    {showActions && (
                      <th className="table-actions-header">Acciones</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {currentData.map((row, idx) => (
                    <tr key={getRowId ? getRowId(row) : idx}>
                      {columns.map((col, i) => {
                        const rawValue = getValue(row, col);
                        const content: React.ReactNode = col.render
                          ? col.render(rawValue, row)
                          : (rawValue as React.ReactNode);

                        return <td key={i}>{content}</td>;
                      })}

                      {showActions && (
                        <td className="table-actions-cell">
                          <div className="table-actions-container">
                            {onEdit && (
                              <button
                                className="table-btn-edit"
                                onClick={() => onEdit(row)}
                              >
                                Editar
                              </button>
                            )}
                            {onDelete && (
                              <button
                                className="table-btn-delete"
                                onClick={() => onDelete(row)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentData.length === 0 && (
                <div className="table-no-data">No se encontraron datos</div>
              )}
            </div>
          )}

          {/* Paginación */}
          {filtered.length > 0 && (
            <div className="table-pagination">
              <button
                className="table-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={18} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`table-page-number ${
                    page === i + 1 ? "active" : ""
                  }`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="table-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
