import React, { useState } from "react";
import FormularioServicios from "../../components/forms/form_servicios";
import TablaServicios from "../../components/tablas/registro_servicios";
import type { ServicioResponse } from "../../services/servicios.service";

const ServiciosPage: React.FC = () => {
  const [servicioToEdit, setServicioToEdit] = useState<ServicioResponse | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (servicio: ServicioResponse) => {
    setServicioToEdit(servicio);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setServicioToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setServicioToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {/* Banner de edición */}
      {servicioToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando: <strong>{servicioToEdit.nombre}</strong>
            </span>
          </div>
          <button onClick={handleCancel} className="edit-banner-button">
            ✖ Cancelar Edición
          </button>
        </div>
      )}

      {/* Formulario */}

      <FormularioServicios
        servicioToEdit={servicioToEdit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Tabla */}

      <TablaServicios onEdit={handleEdit} key={refreshKey} />
    </div>
  );
};

export default ServiciosPage;
