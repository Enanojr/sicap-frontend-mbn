import React, { useState } from "react";
import FormularioDescuentos from "../../components/forms/form_descuentos";
import TablaDescuentos from "../../components/tablas/registro_descuentos";
import type { DescuentoResponse } from "../../services/descuento.service";

const DescuentosPage: React.FC = () => {
  const [descuentoToEdit, setDescuentoToEdit] =
    useState<DescuentoResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (descuento: DescuentoResponse) => {
    setDescuentoToEdit(descuento);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = () => {
    setDescuentoToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setDescuentoToEdit(null);
  };

  return (
    <div className="servicios-content-wrapper">
      {/* Banner superior indicando edición */}
      {descuentoToEdit && (
        <div className="edit-banner">
          <div className="edit-banner-content">
            <span className="edit-banner-icon">📝</span>
            <span className="edit-banner-text">
              Editando descuento:{" "}
              <strong>{descuentoToEdit.nombre_descuento}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Formulario dinámico */}
      <FormularioDescuentos
        descuentoToEdit={descuentoToEdit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Tabla de descuentos */}
      <TablaDescuentos onEdit={handleEdit} key={refreshKey} />
    </div>
  );
};

export default DescuentosPage;
