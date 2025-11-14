import React, { useState, useRef, useEffect } from "react";
// Importa Eye y EyeOff para el toggle de contraseña
import { Plus, Eye, EyeOff } from "lucide-react"; // <-- MODIFICADO
import type { LucideIcon } from "lucide-react";
import Swal from "sweetalert2";
import "../../styles/styles.css";

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "date"
    | "password" // <-- AÑADIDO: Permitir el tipo password
    | "select"
    | "textarea"
    | "search-select";
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  validation?: (value: any, allData?: Record<string, any>) => string | null; // <-- MODIFICADO: Pasa allData
  options?: { value: string; label: string }[];
  rows?: number;
  gridColumn?: "1" | "2" | "full";
  defaultValue?: any;
  dynamic?: boolean;
}

export interface FormConfig {
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface FormularioReutilizableProps {
  config: FormConfig;
}

const FormularioReutilizable: React.FC<FormularioReutilizableProps> = ({
  config,
}) => {
  const [fields, setFields] = useState<FormField[]>(config.fields);
  const [formData, setFormData] = useState<Record<string, any>>(
    config.fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: field.defaultValue ?? "",
      }),
      {}
    )
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [showDropdowns, setShowDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  // Estado para manejar la visibilidad de las contraseñas
  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<string, boolean>
  >({}); // <-- AÑADIDO
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Inicializar searchInputs con las etiquetas de las opciones seleccionadas
  useEffect(() => {
    const initialSearchInputs: Record<string, string> = {};
    fields.forEach((field) => {
      if (
        field.type === "search-select" &&
        formData[field.name] &&
        field.options
      ) {
        const selectedOption = field.options.find(
          (opt) => opt.value === formData[field.name]
        );
        if (selectedOption) {
          initialSearchInputs[field.name] = selectedOption.label;
        }
      }
    });
    setSearchInputs(initialSearchInputs);
  }, []); // Dependencia de 'fields' y 'formData' eliminada intencionalmente

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSearchInputChange = (fieldName: string, value: string) => {
    setSearchInputs((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setShowDropdowns((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const handleSelectOption = (
    fieldName: string,
    value: string,
    label: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setSearchInputs((prev) => ({
      ...prev,
      [fieldName]: label,
    }));
    setShowDropdowns((prev) => ({
      ...prev,
      [fieldName]: false,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // <-- AÑADIDO: Función para cambiar la visibilidad de la contraseña -->
  const togglePasswordVisibility = (fieldName: string) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };
  // <-- FIN AÑADIDO -->

  const getFilteredOptions = (field: FormField) => {
    if (!field.options) return [];
    const searchTerm = searchInputs[field.name] || "";
    if (!searchTerm) return field.options;

    return field.options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(dropdownRefs.current).forEach((key) => {
        if (
          dropdownRefs.current[key] &&
          !dropdownRefs.current[key]?.contains(event.target as Node)
        ) {
          setShowDropdowns((prev) => ({
            ...prev,
            [key]: false,
          }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && !value?.toString().trim()) {
        newErrors[field.name] = `${field.label} es requerido`;
        return;
      }

      if (field.validation) {
        // <-- MODIFICADO: Pasa formData para validaciones cruzadas (ej. password2)
        const error = field.validation(value, formData);
        if (error) newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // <-- MODIFICADO: Busca el primer error en el *orden de los campos*
      const firstErrorField = fields.find((f) => errors[f.name]);
      const firstError = firstErrorField ? errors[firstErrorField.name] : null;

      Swal.fire({
        icon: "error",
        title: "Error de validación", // Título más específico
        text:
          firstError || "Por favor, completa todos los campos correctamente",
        confirmButtonColor: "#ef4444", // Color de botón para error
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await config.onSubmit(formData);
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: config.successMessage || "Formulario enviado correctamente",
        confirmButtonColor: "#3b82f6", // Color de botón para éxito
      });

      // Limpia el formulario reseteando al estado inicial
      handleReset(); // <-- MODIFICADO: Llama a handleReset para consistencia
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          config.errorMessage ||
          error.message ||
          "Ocurrió un error al enviar el formulario",
        confirmButtonColor: "#ef4444", // Color de botón para error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(
      fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.defaultValue ?? "",
        }),
        {}
      )
    );
    setErrors({});
    setSearchInputs({});
    setShowDropdowns({});
    setPasswordVisibility({}); // <-- AÑADIDO: Resetea la visibilidad
  };

  const handleAddField = (baseField: FormField) => {
    const count = fields.filter((f) =>
      f.name.startsWith(baseField.name)
    ).length;
    const newField: FormField = {
      ...baseField,
      name: `${baseField.name}_${count + 1}`,
      label: `${baseField.label} (${count + 1})`,
      dynamic: false,
    };

    setFields((prev) => [...prev, newField]);
    setFormData((prev) => ({ ...prev, [newField.name]: "" }));
  };

  const renderField = (field: FormField) => {
    const Icon = field.icon;
    const hasError = !!errors[field.name];
    const value = formData[field.name] ?? "";
    const searchValue = searchInputs[field.name] ?? "";
    const isDropdownOpen = showDropdowns[field.name] ?? false;
    const filteredOptions = getFilteredOptions(field);

    return (
      <div className="form-field" key={field.name}>
        <label className="form-label">
          {Icon && <Icon size={18} style={{ color: "#58b2ee" }} />}
          {field.label} {field.required && "*"}
        </label>

        {/* ----- RENDERIZADO DE CAMPOS (MODIFICADO) ----- */}
        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            value={value}
            onChange={handleChange}
            rows={field.rows || 4}
            className={`form-textarea ${hasError ? "form-input-error" : ""}`} // <-- Añadido error
            placeholder={field.placeholder}
          />
        ) : field.type === "search-select" ? (
          <div
            ref={(el) => {
              dropdownRefs.current[field.name] = el;
            }}
            style={{ position: "relative" }}
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) =>
                handleSearchInputChange(field.name, e.target.value)
              }
              onFocus={() =>
                setShowDropdowns((prev) => ({ ...prev, [field.name]: true }))
              }
              className={`form-input ${hasError ? "form-input-error" : ""}`}
              placeholder={field.placeholder || "Buscar..."}
              autoComplete="off"
            />

            {isDropdownOpen && filteredOptions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: "250px",
                  overflowY: "auto",
                  backgroundColor: "#1f2937",
                  border: "2px solid #58b2ee",
                  borderRadius: "8px",
                  marginTop: "4px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                  zIndex: 1000,
                }}
              >
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() =>
                      handleSelectOption(field.name, option.value, option.label)
                    }
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #374151",
                      fontSize: "14px",
                      color: "#e5e7eb",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#374151";
                      e.currentTarget.style.color = "#58b2ee";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#e5e7eb";
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}

            {isDropdownOpen && searchValue && filteredOptions.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#1f2937",
                  border: "2px solid #ef4444",
                  borderRadius: "8px",
                  marginTop: "4px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  zIndex: 1000,
                  padding: "20px",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                No se encontraron resultados para "{searchValue}"
              </div>
            )}
          </div>
        ) : field.type === "select" ? (
          <select
            name={field.name}
            value={value}
            onChange={handleChange}
            className={`form-input form-select ${
              hasError ? "form-input-error" : ""
            }`}
          >
            {/* <-- MODIFICADO: Usa placeholder si se proporciona --> */}
            <option value="">
              {field.placeholder || "Seleccione una opción"}
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "password" ? ( // <-- AÑADIDO: Bloque para tipo password
          <div className="input-wrapper" style={{ position: "relative" }}>
            <input
              type={passwordVisibility[field.name] ? "text" : "password"}
              name={field.name}
              value={value}
              onChange={handleChange}
              className={`form-input ${hasError ? "form-input-error" : ""}`}
              placeholder={field.placeholder}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="password-toggle" // Añade esta clase en tu CSS
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: hasError ? "#ef4444" : "#9ca3af", // Color del icono
              }}
            >
              {passwordVisibility[field.name] ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        ) : (
          // <-- FIN AÑADIDO -->
          <input
            type={field.type} // Esto ahora es seguro, 'password' se maneja arriba
            name={field.name}
            value={value}
            onChange={handleChange}
            className={`form-input ${
              field.type === "date" ? "form-date-input" : ""
            } ${hasError ? "form-input-error" : ""}`}
            placeholder={field.placeholder}
          />
        )}
        {/* ----- FIN RENDERIZADO DE CAMPOS ----- */}

        {hasError && <span className="form-error">{errors[field.name]}</span>}

        {field.dynamic && (
          <button
            type="button"
            onClick={() => handleAddField(field)}
            className="form-add-button"
            title="Agregar otro campo"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    );
  };

  const groupedFields: FormField[][] = [];
  let currentRow: FormField[] = [];

  fields.forEach((field) => {
    if (field.gridColumn === "full" || field.type === "textarea") {
      if (currentRow.length > 0) {
        groupedFields.push(currentRow);
        currentRow = [];
      }
      groupedFields.push([field]);
    } else {
      currentRow.push(field);
      if (currentRow.length === 2) {
        groupedFields.push(currentRow);
        currentRow = [];
      }
    }
  });
  if (currentRow.length > 0) groupedFields.push(currentRow);

  return (
    <div className="contracts-page-container">
      <div className="contracts-card" style={{ maxWidth: "800px" }}>
        <h2 className="contracts-title">
          <span className="contracts-title-gradient">{config.title}</span>
        </h2>
        <div className="contracts-divider"></div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div className="form-grid">
            {groupedFields.map((row, rowIndex) => (
              <div
                className={`form-row ${row.length === 1 ? "single" : ""}`}
                key={`row-${rowIndex}`}
              >
                {row.map((field) => renderField(field))}
              </div>
            ))}
          </div>

          <div className="form-buttons">
            {config.showResetButton !== false && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="form-button form-button-secondary"
              >
                {config.resetButtonText || "Limpiar"}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-button form-button-primary"
            >
              {isSubmitting
                ? "Enviando..."
                : config.submitButtonText || "Guardar"}
            </button>
          </div>
        </form>

        {fields.some((f) => f.required) && (
          <div className="form-note">
            <p>* Los campos marcados con asterisco son obligatorios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormularioReutilizable;