import React, { useState } from "react";

import RegisterCalle from "../../pages/calles/calles";
import TablaCalles from "../../components/tablas/registro_calles";

import type { CalleResponse } from "../../services/calle.service";

const CallesPage: React.FC = () => {
  const [calleToEdit, setCalleToEdit] = useState<CalleResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (calle: CalleResponse) => {
    setCalleToEdit(calle);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setCalleToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setCalleToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {calleToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando calle: <strong>{calleToEdit.nombre_calle}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="cuentahabientes-wide">
        <RegisterCalle
          calleToEdit={calleToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <TablaCalles key={refreshKey} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default CallesPage;
