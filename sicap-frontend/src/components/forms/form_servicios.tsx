import React from "react";
import type { FormConfig } from "../forms/form";
import FormularioReutilizable from "../forms/form";
import { DollarSign, Briefcase } from "lucide-react";
import Swal from "sweetalert2";
import {
  createServicio,
  updateServicio,
  type ServicioCreate,
  type ServicioResponse,
} from "../../services/servicios.service";
import { isAuthenticated, logout } from "../../services/auth.service";

// AGREGAR INTERFAZ DE PROPS
interface FormularioServiciosProps {
  servicioToEdit?: ServicioResponse | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

//  CAMBIAR LA FIRMA DEL COMPONENTE
const FormularioServicios: React.FC<FormularioServiciosProps> = ({
  servicioToEdit,
  onSuccess,
}) => {
  // DETECTAR SI ESTAMOS EN MODO EDICIÓN
  const isEditMode = !!servicioToEdit;

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
    //  TÍTULO DINÁMICO
    title: isEditMode ? "Editar Servicio" : "Registro de Servicios",
    fields: [
      {
        name: "nombre",
        label: "Nombre del Servicio",
        type: "text",
        placeholder: "Ej: Agua Potable, Drenaje, Balneario...",
        icon: Briefcase,
        required: true,
        validation: validateNombre,
        defaultValue: servicioToEdit?.nombre || "",
      },
      {
        name: "costo",
        label: "Costo del Servicio (MXN)",
        type: "number",
        placeholder: "0.00",
        icon: DollarSign,
        required: true,
        validation: validateCosto,
        defaultValue: servicioToEdit?.costo?.toString() || "0",
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
          title: isEditMode ? "Actualizando..." : "Enviando...",
          text: isEditMode
            ? "Actualizando el servicio, por favor espera."
            : "Registrando el servicio, por favor espera.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const servicioData: ServicioCreate = {
          nombre: data.nombre.trim(),
          costo: parseFloat(data.costo),
        };

        console.log(" Datos a enviar:", servicioData);

        let result: ServicioResponse;

        //  CREAR O ACTUALIZAR SEGÚN EL MODO
        if (isEditMode) {
          result = await updateServicio(
            servicioToEdit!.id_servicio!,
            servicioData
          );
        } else {
          result = await createServicio(servicioData);
        }

        // Mostrar éxito
        Swal.fire({
          icon: "success",
          title: isEditMode
            ? "¡Servicio actualizado exitosamente!"
            : "¡Servicio registrado exitosamente!",
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>Servicio:</strong> ${result.nombre}</p>
              <p><strong>Costo:</strong> $${result.costo.toFixed(2)} MXN</p>
            </div>
          `,
          confirmButtonColor: "#58b2ee",
          confirmButtonText: "Aceptar",
        });

        // LLAMAR CALLBACK DE ÉXITO
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        console.error(" Error al procesar el servicio:", error);

        if (!error.message?.includes("Sesión expirada")) {
          Swal.fire({
            icon: "error",
            title: isEditMode ? "Error al Actualizar" : "Error al Registrar",
            text:
              error.message ||
              "Ocurrió un problema al procesar la solicitud. Intenta nuevamente.",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Cerrar",
          });
        }
      }
    },

    //  TEXTOS DINÁMICOS
    submitButtonText: isEditMode ? "Guardar Cambios" : "Registrar Servicio",
    resetButtonText: isEditMode ? "Cancelar" : "Limpiar Formulario",
    showResetButton: true,
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioServicios;
