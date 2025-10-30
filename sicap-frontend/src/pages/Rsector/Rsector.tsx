import React, { useState } from "react";
import { registerSector } from "../../services/Rsector.service";
import { Botones } from "../../components/botones/Botones";
import Swal from "sweetalert2";
import "../../styles/styles.css";

interface FormData {
  nombre_sector: string;
  descripcion: string;
}

interface FormErrors {
  nombre_sector?: string;
  descripcion?: string;
}

export default function RegisterSector() {
  const [formData, setFormData] = useState<FormData>({
    nombre_sector: "",
    descripcion: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.nombre_sector.trim()) {
      newErrors.nombre_sector= "El sector es requerido";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Mostrar primer error encontrado
      const firstError = Object.values(newErrors)[0];
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: firstError,
        confirmButtonColor: "#667eea",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await registerSector(formData);

      if (result.success) {
        // Limpiar formulario
        setFormData({
          nombre_sector: "",
          descripcion: "",
        });
        setErrors({});

        // Mostrar éxito con SweetAlert
        Swal.fire({
          icon: "success",
          title: "¡Registro exitoso!",
          text: "El usuario ha sido registrado correctamente",
          confirmButtonColor: "#667eea",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        // Manejar errores del servidor
        let errorMessage = "Error al registrar usuario";

        if (result.errors) {
          // Si hay errores específicos de campos
          if (typeof result.errors === "object") {
            // Mostrar el primer error
            const firstErrorKey = Object.keys(result.errors)[0];
            const firstErrorValue = result.errors[firstErrorKey];

            errorMessage = Array.isArray(firstErrorValue)
              ? firstErrorValue[0]
              : firstErrorValue;

            // Actualizar errores en el formulario
            setErrors(result.errors);
          } else if (result.errors.general) {
            errorMessage = result.errors.general;
          }
        }

        Swal.fire({
          icon: "error",
          title: "Error de registro",
          text: errorMessage,
          confirmButtonColor: "#667eea",
        });
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "Ocurrió un error al registrar el usuario. Por favor, intente nuevamente.",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      nombre_sector: "",
      descripcion: "",
    });
    setErrors({});
  };

  return (
    <div className="register-page-container-sector">
      <div className="register-card-sector">
        <h2 className="register-title-sector">
          <span className="register-title-gradient">
            REGISTRO DE SECTOR
          </span>
        </h2>
        <div className="register-divider-sector"></div>

        <div className="register-form-container-sector">
          <div className="register-form-grid">
            {/* sector*/}
            <div className="form-field">
              <label className="form-label">Nombre de sector *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="nombre_sector"
                  value={formData.nombre_sector}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese el sector"
                />
              </div>
              {errors.nombre_sector && (
                <span className="form-error">{errors.nombre_sector}</span>
              )}
            </div>

            {/* Descripcion */}
            <div className="form-field">
              <label className="form-label">Descripcion *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese una descripción del sector"
                />
              </div>
              {errors.descripcion && (
                <span className="form-error">{errors.descripcion}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <Botones onClick={handleClear} style={{backgroundColor: 'white', color:'black', opacity: 0.7}} disabled={loading}>
              Limpiar
            </Botones>
            <Botones onClick={handleSubmit} disabled={loading}>
              {loading ? "Registrando..." : "Registrar Sector"}
            </Botones>
          </div>
        </div>
      </div>
    </div>
  );
}
