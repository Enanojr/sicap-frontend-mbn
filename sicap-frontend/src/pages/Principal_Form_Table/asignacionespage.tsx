import React, { useState } from "react";

import RegisterAsignacion from "../../pages/Asignaciones/Asignaciones";
import TablaAsignaciones from "../../components/tablas/registro_asignaciones";

import type { AsignacionResponse } from "../../services/Asignaciones.service";

const AsignacionesPage: React.FC = () => {
  const [asignacionToEdit, setAsignacionToEdit] =
    useState<AsignacionResponse | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (item: AsignacionResponse) => {
    setAsignacionToEdit(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setAsignacionToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setAsignacionToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {asignacionToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>

            <span className="edit-banner-text">
              Editando asignación:
              <strong>
                {" "}
                {asignacionToEdit.cobrador.nombre}{" "}
                {asignacionToEdit.cobrador.apellidos}
                {" — "}
                {asignacionToEdit.sector.nombre_sector}
              </strong>
            </span>
          </div>

          <button onClick={handleCancel} className="edit-banner-button">
            ✖ Cancelar Edición
          </button>
        </div>
      )}

      <div className="cuentahabientes-wide">
        <RegisterAsignacion
          asignacionToEdit={asignacionToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <TablaAsignaciones key={refreshKey} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default AsignacionesPage;
