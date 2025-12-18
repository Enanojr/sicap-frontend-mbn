import React from "react";
import type { FormConfig } from "../forms/form";
import FormularioReutilizable from "../forms/form";
import { DollarSign, Tag } from "lucide-react";
import Swal from "sweetalert2";

import {
  createDescuento,
  updateDescuento,
  type DescuentoCreate,
  type DescuentoResponse,
} from "../../services/descuento.service";

import { isAuthenticated, logout } from "../../services/auth.service";

interface FormularioDescuentosProps {
  descuentoToEdit: DescuentoResponse | null;
  onSuccess: () => void;
  onCancel: () => void; // ← OBLIGATORIO
}

const FormularioDescuentos: React.FC<FormularioDescuentosProps> = ({
  descuentoToEdit,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!descuentoToEdit;

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
    ],

    onSubmit: async (data) => {
      try {
        if (!isAuthenticated()) {
          Swal.fire({
            icon: "error",
            title: "Sesión expirada",
            text: "Por favor, inicia sesión nuevamente.",
          });
          logout();
          return;
        }

        Swal.fire({
          title: isEditMode ? "Actualizando..." : "Registrando...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const payload: DescuentoCreate = {
          nombre_descuento: data.nombre.trim(),
          porcentaje: parseFloat(data.monto).toFixed(2),
          activo: isEditMode ? descuentoToEdit!.activo : true,
        };

        let result: DescuentoResponse;

        if (isEditMode) {
          result = await updateDescuento(
            descuentoToEdit!.id_descuento,
            payload
          );
        } else {
          result = await createDescuento(payload);
        }

        Swal.fire({
          icon: "success",
          title: isEditMode
            ? "¡Descuento actualizado!"
            : "¡Descuento registrado!",
        });

        onSuccess();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Ocurrió un error inesperado",
        });
      }
    },

    submitButtonText: isEditMode ? "Guardar Cambios" : "Registrar Descuento",
    resetButtonText: isEditMode ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (isEditMode) {
        onCancel();
      }
    },
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioDescuentos;
