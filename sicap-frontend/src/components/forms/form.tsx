import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
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
    | "select"
    | "textarea"
    | "search-select";
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  validation?: (value: any) => string | null;
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
  onReset?: () => void;
}

interface FormularioReutilizableProps {
  config: FormConfig;
  isEditMode?: boolean;
}

const FormularioReutilizable: React.FC<FormularioReutilizableProps> = ({
  config,
  isEditMode = false,
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
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Cuando cambian los valores default, recarga todo el formulario
    const newFormData = config.fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {} as Record<string, any>);

    setFormData(newFormData);
    setErrors({});

    const initialSearchInputs: Record<string, string> = {};

    config.fields.forEach((field) => {
      if (field.type === "search-select" && field.options) {
        const selected = field.options.find(
          (opt) => opt.value === newFormData[field.name]
        );
        if (selected) {
          initialSearchInputs[field.name] = selected.label;
        }
      }
    });

    setSearchInputs(initialSearchInputs);
  }, [config.fields]);

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
  }, []);

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

      if (field.validation && value) {
        const error = field.validation(value);
        if (error) newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          firstError || "Por favor, completa todos los campos correctamente",
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
      });

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
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          config.errorMessage ||
          error.message ||
          "Ocurrió un error al enviar el formulario",
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

        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            value={value}
            onChange={handleChange}
            rows={field.rows || 4}
            className="form-textarea"
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
            <option value="">Seleccione una opción</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            name={field.name}
            value={value}
            onChange={handleChange}
            className={`form-input ${
              field.type === "date" ? "form-date-input" : ""
            } ${hasError ? "form-input-error" : ""}`}
            placeholder={field.placeholder}
          />
        )}

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
    <div className="form-wrapper">
      <div className={`form_tabla ${isEditMode ? "form-edit-mode" : ""}`}>
        <h2 className="card-title">
          <span className="contracts-title-gradient">{config.title}</span>
        </h2>
        <div className="card-title-divider"></div>

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
