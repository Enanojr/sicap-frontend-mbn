import React, { useState, useRef, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
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
    | "password"
    | "select"
    | "textarea"
    | "search-select";
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  validation?: (
    value: string | number,
    allData?: Record<string, any>
  ) => string | null;
  options?: { value: string; label: string }[];
  rows?: number;
  gridColumn?: "1" | "2" | "full";
  defaultValue?: string | number;
  dynamic?: boolean;
  disabled?: boolean;
  onSearch?: (input: string) => void;
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

interface Props {
  config: FormConfig;
  isEditMode?: boolean;
}

const highlightMatch = (label: string, term: string): React.ReactNode => {
  if (!term) return label;

  const lowerLabel = label.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerLabel.indexOf(lowerTerm);

  if (index === -1) return label;

  const before = label.slice(0, index);
  const match = label.slice(index, index + term.length);
  const after = label.slice(index + term.length);

  return (
    <>
      {before}
      <strong>{match}</strong>
      {after}
    </>
  );
};

const FormularioReutilizable: React.FC<Props> = ({ config, isEditMode }) => {
  const [fields, setFields] = useState<FormField[]>(config.fields);

  const [formData, setFormData] = useState<Record<string, string | number>>(
    config.fields.reduce(
      (acc, f) => ({ ...acc, [f.name]: f.defaultValue ?? "" }),
      {} as Record<string, string | number>
    )
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [showDropdowns, setShowDropdowns] = useState<Record<string, boolean>>(
    {}
  );

  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<string, boolean>
  >({});

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setFields(config.fields);
    const newForm = config.fields.reduce(
      (acc, f) => ({ ...acc, [f.name]: f.defaultValue ?? "" }),
      {} as Record<string, string | number>
    );
    setFormData(newForm);
    setErrors({});
  }, [config.fields]);

  // ✅ Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([name, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setShowDropdowns((prev) => ({ ...prev, [name]: false }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // ✅ Usar useCallback para evitar recrear la función
  const handleSearchInputChange = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: "" }));
      setSearchInputs((prev) => ({ ...prev, [name]: value }));
      setShowDropdowns((prev) => ({ ...prev, [name]: true }));

      const field = fields.find((f) => f.name === name);
      if (field?.onSearch) field.onSearch(value);
    },
    [fields]
  );

  // ✅ Usar useCallback para evitar recrear la función
  const handleSelectOption = useCallback(
    (fieldName: string, value: string, label: string) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      setSearchInputs((prev) => ({ ...prev, [fieldName]: label }));
      setShowDropdowns((prev) => ({ ...prev, [fieldName]: false }));

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    },
    []
  );

  const togglePasswordVisibility = (name: string) => {
    setPasswordVisibility((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach((f) => {
      const v = formData[f.name];

      if (f.required && !v?.toString().trim()) {
        newErrors[f.name] = `${f.label} es requerido`;
        return;
      }

      if (f.validation) {
        const msg = f.validation(v, formData);
        if (msg) newErrors[f.name] = msg;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: firstError ?? "Complete correctamente el formulario",
        confirmButtonColor: "#ef4444",
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
        confirmButtonColor: "#3b82f6",
      });

      handleReset();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: config.errorMessage || "Error al enviar el formulario",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(
      fields.reduce(
        (acc, f) => ({ ...acc, [f.name]: f.defaultValue ?? "" }),
        {} as Record<string, string | number>
      )
    );
    setErrors({});
    setSearchInputs({});
    setShowDropdowns({});
    setPasswordVisibility({});

    if (config.onReset) config.onReset();
  };

  const renderField = (field: FormField) => {
    const Icon = field.icon;
    const val = formData[field.name] ?? "";
    const error = errors[field.name];

    const searchValue = searchInputs[field.name] ?? "";

    return (
      <div className="form-field" key={field.name}>
        <label className="form-label">
          {Icon && <Icon size={18} style={{ color: "#58b2ee" }} />}{" "}
          {field.label}
          {field.required && "*"}
        </label>

        {/* SEARCH SELECT - SIN KEY DINÁMICO */}
        {field.type === "search-select" ? (
          <div
            ref={(el) => {
              dropdownRefs.current[field.name] = el;
            }}
            className="search-select-container"
          >
            <input
              type="text"
              autoComplete="off"
              value={searchValue}
              disabled={field.disabled}
              placeholder={field.placeholder}
              onChange={(e) =>
                handleSearchInputChange(field.name, e.target.value)
              }
              onFocus={() =>
                setShowDropdowns((p) => ({ ...p, [field.name]: true }))
              }
              className={`form-input ${error ? "form-input-error" : ""}`}
            />

            {showDropdowns[field.name] && (field.options?.length ?? 0) > 0 && (
              <div className="dropdown-panel">
                {field.options!.map((opt) => (
                  <div
                    key={opt.value}
                    className="dropdown-item"
                    onClick={() =>
                      handleSelectOption(field.name, opt.value, opt.label)
                    }
                  >
                    {highlightMatch(opt.label, searchValue)}
                  </div>
                ))}
              </div>
            )}

            {showDropdowns[field.name] &&
              (field.options?.length ?? 0) === 0 && (
                <div className="dropdown-panel">
                  <div className="dropdown-no-results">
                    No se encontraron resultados
                  </div>
                </div>
              )}
          </div>
        ) : field.type === "textarea" ? (
          <textarea
            name={field.name}
            value={val.toString()}
            rows={field.rows || 4}
            disabled={field.disabled}
            placeholder={field.placeholder}
            onChange={handleChange}
            className={`form-textarea ${error ? "form-input-error" : ""}`}
          />
        ) : field.type === "select" ? (
          <select
            name={field.name}
            value={val.toString()}
            disabled={field.disabled}
            onChange={handleChange}
            className={`form-input ${error ? "form-input-error" : ""}`}
          >
            <option value="">Seleccione una opción</option>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : field.type === "password" ? (
          <div className="input-wrapper" style={{ position: "relative" }}>
            <input
              type={passwordVisibility[field.name] ? "text" : "password"}
              name={field.name}
              value={val.toString()}
              disabled={field.disabled}
              placeholder={field.placeholder}
              onChange={handleChange}
              className={`form-input ${error ? "form-input-error" : ""}`}
            />

            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="password-toggle"
            >
              {passwordVisibility[field.name] ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        ) : (
          <input
            type={field.type}
            name={field.name}
            value={val.toString()}
            disabled={field.disabled}
            placeholder={field.placeholder}
            onChange={handleChange}
            className={`form-input ${error ? "form-input-error" : ""}`}
          />
        )}

        {error && <span className="form-error">{error}</span>}
      </div>
    );
  };

  // AGRUPAR GRID
  const grouped: FormField[][] = [];
  let row: FormField[] = [];

  fields.forEach((f) => {
    if (f.gridColumn === "full" || f.type === "textarea") {
      if (row.length > 0) {
        grouped.push(row);
        row = [];
      }
      grouped.push([f]);
    } else {
      row.push(f);
      if (row.length === 2) {
        grouped.push(row);
        row = [];
      }
    }
  });

  if (row.length > 0) grouped.push(row);

  return (
    <div className="form-wrapper">
      <div className={`form_tabla ${isEditMode ? "form-edit-mode" : ""}`}>
        <h2 className="card-title">
          <span className="contracts-title-gradient">{config.title}</span>
        </h2>

        <div className="card-title-divider"></div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {grouped.map((r, idx) => (
              <div
                className={`form-row ${r.length === 1 ? "single" : ""}`}
                key={idx}
              >
                {r.map((f) => renderField(f))}
              </div>
            ))}
          </div>

          <div className="form-buttons">
            {config.showResetButton && (
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

          <div className="form-note">
            <p>* Los campos marcados con asterisco son obligatorios</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioReutilizable;
