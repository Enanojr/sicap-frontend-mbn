import React from "react";
import type { FormConfig } from "../forms/form";
import FormularioReutilizable from "../forms/form";
import { DollarSign, Tag, ToggleLeft } from "lucide-react";
import Swal from "sweetalert2";
import {
  createDescuento,
  type DescuentoCreate,
} from "../../services/descuento.service";
import { isAuthenticated, logout } from "../../services/auth.service";

const FormularioDescuentos: React.FC = () => {
  const validateMonto = (value: any): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return "Debe ser un monto mayor o igual a 0";
    }
    if (num > 999999.99) {
      return "El monto no puede exceder $999,999.99";
    }
    return null;
  };

  const validateNombre = (value: any): string | null => {
    if (!value || value.trim().length === 0) {
      return "El nombre es requerido";
    }
    if (value.trim().length > 30) {
      return "El nombre no puede exceder 30 caracteres";
    }
    return null;
  };

  const formConfig: FormConfig = {
    title: "Registro de Descuentos",
    fields: [
      {
        name: "nombre",
        label: "Nombre del Descuento",
        type: "text",
        placeholder: "Ej: Capacidades especiales, Promoción anual...",
        icon: Tag,
        required: true,
        validation: validateNombre,
      },
      {
        name: "monto",
        label: "Monto Descontable",
        type: "number",
        placeholder: "Ej: 60.00",
        icon: DollarSign,
        required: true,
        validation: validateMonto,
        defaultValue: "0",
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
        defaultValue: "true",
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
          title: "Enviando...",
          text: "Registrando el descuento, por favor espera.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const descuentoData: DescuentoCreate = {
          nombre_descuento: data.nombre.trim(),
          porcentaje: parseFloat(data.monto).toFixed(2),
          activo: data.activo === "true",
        };

        const result = await createDescuento(descuentoData);

        Swal.fire({
          icon: "success",
          title: "¡Descuento registrado exitosamente!",
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
          confirmButtonText: "Aceptar",
        });
      } catch (error: any) {
        console.error("Error al registrar el descuento:", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.message ||
            "Ocurrió un problema al procesar la solicitud. Intenta nuevamente.",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Cerrar",
        });
      }
    },

    submitButtonText: "Registrar Descuento",
    resetButtonText: "Limpiar Formulario",
    showResetButton: true,
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioDescuentos;
