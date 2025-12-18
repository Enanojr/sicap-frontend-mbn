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
  onCancel: () => void;
}

const FormularioDescuentos: React.FC<FormularioDescuentosProps> = ({
  descuentoToEdit,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!descuentoToEdit;

  // Validaciones mejoradas
  const validateMonto = (value: any): string | null => {
    const strValue = String(value).trim();
    
    if (!strValue) return "El monto es requerido";
    
    const num = parseFloat(strValue);
    
    if (isNaN(num)) return "Debe ser un número válido";
    if (num <= 0) return "El monto debe ser mayor a 0";
    if (num > 999999.99) return "El monto no puede exceder $999,999.99";
    
    // Validar máximo 2 decimales
    if (!/^\d+(\.\d{1,2})?$/.test(strValue)) {
      return "Máximo 2 decimales permitidos";
    }
    
    return null;
  };

  const validateNombre = (value: any): string | null => {
    const strValue = String(value).trim();
    
    if (!strValue) return "El nombre es requerido";
    if (strValue.length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (strValue.length > 50) return "El nombre no puede exceder 50 caracteres";
    
    // Validar que no sea solo espacios
    if (!/\S/.test(value)) return "El nombre no puede contener solo espacios";
    
    // Validar caracteres especiales excesivos
    if (/[<>{}[\]\\]/.test(strValue)) {
      return "El nombre contiene caracteres no permitidos";
    }
    
    return null;
  };

  // Función auxiliar para manejar errores de autenticación
  const handleAuthError = () => {
    Swal.fire({
      icon: "error",
      title: "Sesión expirada",
      text: "Por favor, inicia sesión nuevamente.",
      confirmButtonColor: "#ef4444",
    }).then(() => {
      logout();
    });
  };

  // Función para mostrar confirmación antes de guardar (opcional pero recomendado)
  const confirmSave = async (data: any): Promise<boolean> => {
    const result = await Swal.fire({
      title: isEditMode ? "¿Actualizar descuento?" : "¿Registrar descuento?",
      html: `
        <div style="text-align: left; margin-top: 1rem;">
          <p><strong>Nombre:</strong> ${data.nombre}</p>
          <p><strong>Monto:</strong> $${parseFloat(data.monto).toFixed(2)}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isEditMode ? "Sí, actualizar" : "Sí, registrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    });

    return result.isConfirmed;
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
        defaultValue: descuentoToEdit?.porcentaje?.toString() || "",
      },
    ],

    onSubmit: async (data) => {
      try {
        // Verificar autenticación
        if (!isAuthenticated()) {
          handleAuthError();
          return;
        }

        // Confirmación opcional (comenta si no la quieres)
        const confirmed = await confirmSave(data);
        if (!confirmed) return;

        // Mostrar loading
        Swal.fire({
          title: isEditMode ? "Actualizando..." : "Registrando...",
          text: "Por favor espera",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        });

        // Preparar payload
        const payload: DescuentoCreate = {
          nombre_descuento: data.nombre.trim(),
          porcentaje: parseFloat(data.monto).toFixed(2),
          activo: isEditMode ? descuentoToEdit!.activo : true,
        };

        console.log("Enviando payload:", payload);

        // Ejecutar operación
        let result: DescuentoResponse;

        if (isEditMode) {
          result = await updateDescuento(
            descuentoToEdit!.id_descuento,
            payload
          );
          console.log("Descuento actualizado:", result);
        } else {
          result = await createDescuento(payload);
          console.log("Descuento creado:", result);
        }

        // Mostrar éxito
        await Swal.fire({
          icon: "success",
          title: isEditMode
            ? "¡Descuento actualizado!"
            : "¡Descuento registrado!",
          text: `"${result.nombre_descuento}" se guardó correctamente`,
          confirmButtonColor: "#10b981",
          timer: 2500,
          timerProgressBar: true,
        });

        // Llamar callback de éxito
        onSuccess();
      } catch (error: any) {
        console.error("Error en formulario de descuentos:", error);

        // Manejar errores específicos
        let errorMessage = "Ocurrió un error inesperado";

        if (error.response) {
          switch (error.response.status) {
            case 401:
            case 403:
              handleAuthError();
              return;
            case 400:
              errorMessage = error.response.data?.detail || 
                           error.response.data?.message ||
                           "Datos inválidos. Verifica la información.";
              break;
            case 409:
              errorMessage = "Ya existe un descuento con ese nombre";
              break;
            case 500:
              errorMessage = "Error en el servidor. Intenta más tarde.";
              break;
            default:
              errorMessage = error.message || errorMessage;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#ef4444",
        });
      }
    },

    submitButtonText: isEditMode ? "Guardar Cambios" : "Registrar Descuento",
    resetButtonText: isEditMode ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (isEditMode) {
        // Confirmación antes de cancelar edición
        Swal.fire({
          title: "¿Cancelar edición?",
          text: "Los cambios no guardados se perderán",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, cancelar",
          cancelButtonText: "No, continuar editando",
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#6b7280",
        }).then((result) => {
          if (result.isConfirmed) {
            onCancel();
          }
        });
      }
    },
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioDescuentos;
