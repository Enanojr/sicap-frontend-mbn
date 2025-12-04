import React, { useState } from "react";

import RegisterSector from "../../pages/Rsector/Rsector";
import TablaSectores from "../../components/tablas/registro_sectores";

import type { SectorResponse } from "../../services/Rsector.service";

const SectoresPage: React.FC = () => {
  const [sectorToEdit, setSectorToEdit] = useState<SectorResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (sector: SectorResponse) => {
    setSectorToEdit(sector);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setSectorToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setSectorToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {sectorToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando sector: <strong>{sectorToEdit.nombre_sector}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="cuentahabientes-wide">
        <RegisterSector
          sectorToEdit={sectorToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <TablaSectores key={refreshKey} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default SectoresPage;
