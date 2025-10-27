import React, { useState } from "react";
import {  Plus } from 'lucide-react';
import type { LucideIcon } from "lucide-react";
import Swal from "sweetalert2";
import "../../styles/styles.css";

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  validation?: (value: any) => string | null;
  options?: { value: string; label: string }[];
  rows?: number;
  gridColumn?: '1' | '2' | 'full';
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

const FormularioReutilizable: React.FC<FormularioReutilizableProps> = ({ config }) => {
  const [fields, setFields] = useState<FormField[]>(config.fields);
  const [formData, setFormData] = useState<Record<string, any>>(
    config.fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: field.defaultValue ?? '',
    }), {})
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
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
        icon: 'error',
        title: 'Error',
        text: firstError || 'Por favor, completa todos los campos correctamente',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await config.onSubmit(formData);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: config.successMessage || 'Formulario enviado correctamente',
      });

      setFormData(
        fields.reduce((acc, field) => ({
          ...acc,
          [field.name]: field.defaultValue ?? '',
        }), {})
      );
      setErrors({});
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: config.errorMessage || error.message || 'Ocurrió un error al enviar el formulario',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(
      fields.reduce((acc, field) => ({
        ...acc,
        [field.name]: field.defaultValue ?? '',
      }), {})
    );
    setErrors({});
  };

  const handleAddField = (baseField: FormField) => {
    const count = fields.filter(f => f.name.startsWith(baseField.name)).length;
    const newField: FormField = {
      ...baseField,
      name: `${baseField.name}_${count + 1}`,
      label: `${baseField.label} (${count + 1})`,
      dynamic: false,
    };

    setFields(prev => [...prev, newField]);
    setFormData(prev => ({ ...prev, [newField.name]: '' }));
  };

  const renderField = (field: FormField) => {
    const Icon = field.icon;
    const hasError = !!errors[field.name];
    const value = formData[field.name] ?? '';

    return (
      <div className="form-field" key={field.name}>
        <label className="form-label">
          {Icon && <Icon size={18} style={{ color: '#58b2ee' }} />}
          {field.label} {field.required && '*'}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            name={field.name}
            value={value}
            onChange={handleChange}
            rows={field.rows || 4}
            className="form-textarea"
            placeholder={field.placeholder}
          />
        ) : field.type === 'select' ? (
          <select
            name={field.name}
            value={value}
            onChange={handleChange}
            className={`form-input form-select ${hasError ? 'form-input-error' : ''}`}
          >
            <option value="">Seleccione una opción</option>
            {field.options?.map(option => (
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
            className={`form-input ${field.type === 'date' ? 'form-date-input' : ''} ${hasError ? 'form-input-error' : ''}`}
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

  fields.forEach(field => {
    if (field.gridColumn === 'full' || field.type === 'textarea') {
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
      <div className="contracts-card" style={{ maxWidth: '800px' }}>
        <h2 className="contracts-title">
          <span className="contracts-title-gradient">{config.title}</span>
        </h2>
        <div className="contracts-divider"></div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-grid">
            {groupedFields.map((row, rowIndex) => (
              <div
                className={`form-row ${row.length === 1 ? 'single' : ''}`}
                key={`row-${rowIndex}`}
              >
                {row.map(field => renderField(field))}
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
                {config.resetButtonText || 'Limpiar'}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-button form-button-primary"
            >
              {isSubmitting ? 'Enviando...' : (config.submitButtonText || 'Guardar')}
            </button>
          </div>
        </form>

        {fields.some(f => f.required) && (
          <div className="form-note">
            <p>* Los campos marcados con asterisco son obligatorios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormularioReutilizable;