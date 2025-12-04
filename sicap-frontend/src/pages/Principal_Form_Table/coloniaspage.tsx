import React, { useState } from "react";

import RegisterColonia from "../../pages/Rcolonias/Rcolonias";
import TablaColonias from "../../components/tablas/registro_colonias";

import type { ColoniaResponse } from "../../services/Rcolonias.service";

const ColoniasPage: React.FC = () => {
  const [coloniaToEdit, setColoniaToEdit] = useState<ColoniaResponse | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (item: ColoniaResponse) => {
    setColoniaToEdit(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setColoniaToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setColoniaToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {coloniaToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando colonia: <strong>{coloniaToEdit.nombre_colonia}</strong>
            </span>
          </div>

          <button onClick={handleCancel} className="edit-banner-button">
            ✖ Cancelar Edición
          </button>
        </div>
      )}

      <div className="cuentahabientes-wide">
        <RegisterColonia
          coloniaToEdit={coloniaToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <TablaColonias key={refreshKey} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default ColoniasPage;
