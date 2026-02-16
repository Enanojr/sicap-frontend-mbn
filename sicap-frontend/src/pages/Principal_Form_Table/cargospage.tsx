import React, { useState } from "react";
import FormularioCargos from "../cargos/tcargos";
import TablaCargos from "../cargos/tabla_cargos";
import type { CargoResponse } from "../../services/tcargos.service";


const CargosPage: React.FC = () => {
  const [cargoToEdit, setCargoToEdit] = useState<CargoResponse | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (cargo: CargoResponse) => {
    setCargoToEdit(cargo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setCargoToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setCargoToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {/* Banner de edición */}
      {cargoToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando: <strong>{cargoToEdit.nombre}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Formulario */}

      <FormularioCargos
        cargoToEdit={cargoToEdit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Tabla */}

      <TablaCargos onEdit={handleEdit} key={refreshKey} />
    </div>
  );
};

export default CargosPage;