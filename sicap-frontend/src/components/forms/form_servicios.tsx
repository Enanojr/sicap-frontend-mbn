import React from "react";
import type { FormConfig } from "../forms/form";
import FormularioReutilizable from "../forms/form";
import { DollarSign, Briefcase } from "lucide-react";
import Swal from "sweetalert2";
import {
  createServicio,
  type ServicioCreate,
} from "../../services/servicios.service";
import { isAuthenticated, logout } from "../../services/auth.service";

const FormularioServicios: React.FC = () => {
  const validateCosto = (value: any): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "El costo debe ser mayor a 0";
    }
    if (num > 999999.99) {
      return "El costo no puede exceder $999,999.99";
    }
    return null;
  };

  const validateNombre = (value: any): string | null => {
    if (!value || value.trim().length === 0) {
      return "El nombre es requerido";
    }
    if (value.trim().length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }
    if (value.trim().length > 100) {
      return "El nombre no puede exceder 100 caracteres";
    }
    return null;
  };

  const formConfig: FormConfig = {
    title: "Registro de Servicios",
    fields: [
      {
        name: "nombre",
        label: "Nombre del Servicio",
        type: "text",
        placeholder: "Ej: Agua Potable, Drenaje, Balneario...",
        icon: Briefcase,
        required: true,
        validation: validateNombre,
      },
      {
        name: "costo",
        label: "Costo del Servicio (MXN)",
        type: "number",
        placeholder: "0.00",
        icon: DollarSign,
        required: true,
        validation: validateCosto,
        defaultValue: "0",
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
          text: "Registrando el servicio, por favor espera.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const servicioData: ServicioCreate = {
          nombre: data.nombre.trim(),
          costo: parseFloat(data.costo),
        };

        console.log(" Datos a enviar:", servicioData);

        // Llamar al servicio
        const result = await createServicio(servicioData);

        // Mostrar éxito
        Swal.fire({
          icon: "success",
          title: "¡Servicio registrado exitosamente!",
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>Servicio:</strong> ${result.nombre}</p>
              <p><strong>Costo:</strong> $${result.costo.toFixed(2)} MXN</p>
            </div>
          `,
          confirmButtonColor: "#58b2ee",
          confirmButtonText: "Aceptar",
        });
      } catch (error: any) {
        console.error(" Error al registrar el servicio:", error);

        // Solo mostrar el error si no fue manejado por el servicio
        if (!error.message?.includes("Sesión expirada")) {
          Swal.fire({
            icon: "error",
            title: "Error al Registrar",
            text:
              error.message ||
              "Ocurrió un problema al procesar la solicitud. Intenta nuevamente.",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Cerrar",
          });
        }
      }
    },

    submitButtonText: "Registrar Servicio",
    resetButtonText: "Limpiar Formulario",
    showResetButton: true,
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioServicios;
