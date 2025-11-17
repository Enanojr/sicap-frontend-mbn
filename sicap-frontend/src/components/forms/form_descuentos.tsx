import React from "react";
import type { FormConfig } from "../forms/form";
import FormularioReutilizable from "../forms/form";
import { DollarSign, Tag, ToggleLeft } from "lucide-react";
import Swal from "sweetalert2";

import {
  createDescuento,
  updateDescuento,
  type DescuentoCreate,
  type DescuentoResponse,
} from "../../services/descuento.service";

import { isAuthenticated, logout } from "../../services/auth.service";

interface FormularioDescuentosProps {
  descuentoToEdit?: DescuentoResponse | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FormularioDescuentos: React.FC<FormularioDescuentosProps> = ({
  descuentoToEdit,
  onSuccess,
}) => {
  // Detectar modo edición
  const isEditMode = !!descuentoToEdit;

  // Validaciones
  const validateMonto = (value: any): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return "Debe ser un monto mayor o igual a 0";
    if (num > 999999.99) return "El monto no puede exceder $999,999.99";
    return null;
  };

  const validateNombre = (value: any): string | null => {
    if (!value || value.trim().length === 0) return "El nombre es requerido";
    if (value.trim().length > 30)
      return "El nombre no puede exceder 30 caracteres";
    return null;
  };

  const formConfig: FormConfig = {
    title: isEditMode ? "Editar Descuento" : "Registro de Descuentos",

    fields: [
      {
        name: "nombre",
        label: "Nombre del Descuento",
        type: "text",
        placeholder: "Ej: Capacidades especiales, Promoción anual...",
        icon: Tag,
        required: true,
        validation: validateNombre,
        defaultValue: descuentoToEdit?.nombre_descuento || "",
      },
      {
        name: "monto",
        label: "Monto Descontable",
        type: "number",
        placeholder: "Ej: 60.00",
        icon: DollarSign,
        required: true,
        validation: validateMonto,
        defaultValue: descuentoToEdit?.porcentaje?.toString() || "0",
      },
      {
        name: "activo",
        label: "Estado del Descuento",
        type: "select",
        icon: ToggleLeft,
        required: true,
        options: [
          { value: "true", label: "Activo" },
          { value: "false", label: "Inactivo" },
        ],
        defaultValue:
          descuentoToEdit?.activo !== undefined
            ? descuentoToEdit.activo.toString()
            : "true",
      },
    ],

    onSubmit: async (data) => {
      try {
        if (!isAuthenticated()) {
          Swal.fire({
            icon: "error",
            title: "Sesión expirada",
            text: "Por favor, inicia sesión nuevamente.",
            confirmButtonColor: "#ef4444",
          });
          logout();
          return;
        }

        Swal.fire({
          title: isEditMode ? "Actualizando..." : "Registrando...",
          text: isEditMode
            ? "Actualizando descuento, por favor espera."
            : "Creando descuento, por favor espera.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const descuentoData: DescuentoCreate = {
          nombre_descuento: data.nombre.trim(),
          porcentaje: parseFloat(data.monto).toFixed(2),
          activo: data.activo === "true",
        };

        let result: DescuentoResponse;

        if (isEditMode) {
          result = await updateDescuento(
            descuentoToEdit!.id_descuento,
            descuentoData
          );
        } else {
          result = await createDescuento(descuentoData);
        }

        Swal.fire({
          icon: "success",
          title: isEditMode
            ? "¡Descuento actualizado!"
            : "¡Descuento registrado!",
          html: `
            <p><strong>Descuento:</strong> ${result.nombre_descuento}</p>
            <p><strong>Monto:</strong> $${parseFloat(result.porcentaje).toFixed(
              2
            )}</p>
            <p><strong>Estado:</strong> ${
              result.activo
                ? '<span style="color: #10b981;">Activo</span>'
                : '<span style="color: #ef4444;">Inactivo</span>'
            }</p>
          `,
          confirmButtonColor: "#58b2ee",
        });

        if (onSuccess) onSuccess();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: isEditMode ? "Error al actualizar" : "Error al registrar",
          text: error.message || "Ocurrió un error inesperado",
          confirmButtonColor: "#ef4444",
        });
      }
    },

    submitButtonText: isEditMode ? "Guardar Cambios" : "Registrar Descuento",
    resetButtonText: isEditMode ? "Cancelar" : "Limpiar Formulario",
    showResetButton: true,
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioDescuentos;
