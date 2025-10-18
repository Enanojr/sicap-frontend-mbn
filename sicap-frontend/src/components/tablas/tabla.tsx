import React, { useEffect, useState } from "react";
import { Search, ChevronDown, Clock, Eye } from 'lucide-react';
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
  { id: 'last-day', label: 'Último día', value: 'day' },
  { id: 'last-week', label: 'Últimos 7 días', value: 'week' },
  { id: 'last-month', label: 'Últimos 30 días', value: 'month' },
  { id: 'last-year', label: 'Último año', value: 'year' },
];

const ContractTable: React.FC = () => {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('month');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] = useState<ContractSummary | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
    
        return;
      }

      const data = await getContractData();
      setContracts(data);
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

  const filteredContracts = contracts.filter(contract =>
    String(contract.numero_contrato).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(contract.nombre_completo).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilterLabel = () => {
    const option = filterOptions.find(opt => opt.value === selectedFilter);
    return option ? option.label : 'Últimos 30 días';
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

        {/* TABLA */}
        {loading && <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</p>}
        {error && <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '2rem' }}>{error}</p>}

        {!loading && !error && (
          <div className="contracts-table-wrapper">
            <table className="contracts-table">
              <thead className="contracts-thead">
                <tr>
                  <th className="th">N° Contrato</th>
                  <th className="th">Nombre</th>
                  <th className="th">Servicio</th>
                  <th className="th">Año</th>
                  <th className="th">Monto Recibido</th>
                  <th className="th">Estatus</th>
                  <th className="th">Detalles</th>
                </tr>
              </thead>

              <tbody className="contracts-tbody">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="td">{contract.numero_contrato}</td>
                    <td className="td-name">{contract.nombre_completo}</td>
                    <td className="td">{contract.nombre_servicio}</td>
                    <td className="td">{contract.anio}</td>
                    <td className="td">${Number(contract.monto_total_recibido || 0).toLocaleString()}</td>
                    <td className="td">
                      <span className={`status-badge ${
                        contract.estatus_deuda === 'Completado' ? 'status-complete' : 'status-pending'
                      }`}>
                        {contract.estatus_deuda}
                      </span>
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

            {filteredContracts.length === 0 && (
              <div className="no-results">
                No se encontraron contratos que coincidan con tu búsqueda
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalles del Contrato</h3>
              <button 
                className="close-button" 
                onClick={() => setSelectedContract(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4 className="section-title">Información General</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Número de Contrato</div>
                    <div className="detail-value">{selectedContract.numero_contrato}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Nombre del Cliente</div>
                    <div className="detail-value">{selectedContract.nombre_completo}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Servicio</div>
                    <div className="detail-value">{selectedContract.nombre_servicio}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Estatus</div>
                    <div className="detail-value">
                      <span className={`status-badge ${
                        selectedContract.estatus_deuda === 'Completado' ? 'status-complete' : 'status-pending'
                      }`}>
                        {selectedContract.estatus_deuda}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Resumen Financiero</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Monto Total Recibido</div>
                    <div className="detail-value text-success">${Number(selectedContract.monto_total_recibido || 0).toLocaleString()}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Pagos Totales</div>
                    <div className="detail-value">{selectedContract.pagos_totales}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Fecha de Inicio</div>
                    <div className="detail-value">
                      {selectedContract.fecha_inicio
                        ? new Date(selectedContract.fecha_inicio).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Último Pago</div>
                    <div className="detail-value">
                      {selectedContract.ultimo_pago
                        ? new Date(selectedContract.ultimo_pago).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Historial de Pagos ({selectedContract.pagos?.length || 0})</h4>
                <div className="overflow-x-auto rounded-lg">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fecha Pago</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedContract.pagos && selectedContract.pagos.length > 0 ? (
                        selectedContract.pagos.map((pago, index) => (
                          <tr key={pago.id}>
                            <td>{index + 1}</td>
                            <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                            <td className="text-success">${Number(pago.monto_recibido || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>No hay pagos registrados</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTable;