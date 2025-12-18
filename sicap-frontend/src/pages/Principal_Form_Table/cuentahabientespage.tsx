import React, { useState } from "react";

import FormularioCuentahabientes from "../../pages/Rcuentahabientes/Rcuentahabientes";
import TablaCuentahabientes from "../../components/tablas/registro_cuentahabientes";

import type { CuentahabienteResponse } from "../../services/Rcuentahabientes.service";

const CuentahabientesPage: React.FC = () => {
  const [cuentahabienteToEdit, setCuentahabienteToEdit] =
    useState<CuentahabienteResponse | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (item: CuentahabienteResponse) => {
    setCuentahabienteToEdit(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setCuentahabienteToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setCuentahabienteToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {cuentahabienteToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando cuentahabiente:{" "}
              <strong>
                {cuentahabienteToEdit.nombres} {cuentahabienteToEdit.ap}{" "}
                {cuentahabienteToEdit.am}
              </strong>
            </span>
          </div>
        </div>
      )}
      <div className="cuentahabientes-wide">
        <FormularioCuentahabientes
          cuentahabienteToEdit={cuentahabienteToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <TablaCuentahabientes key={refreshKey} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default CuentahabientesPage;
