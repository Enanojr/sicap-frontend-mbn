import { MapPin, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

import {
  createCalle,
  updateCalle,
  type CalleResponse,
} from "../../services/calle.service";

interface RegisterCalleProps {
  calleToEdit: CalleResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RegisterCalle({
  calleToEdit,
  onSuccess,
  onCancel,
}: RegisterCalleProps) {
  const formConfig: FormConfig = {
    title: calleToEdit ? "Editar Calle" : "Registro de Calles",

    fields: [
      {
        name: "nombre_calle",
        label: "Nombre de la calle",
        type: "text",
        icon: MapPin,
        required: true,
        placeholder: "Ingrese el nombre de la calle",
        defaultValue: calleToEdit?.nombre_calle ?? "",
        validation: (value: string | number) =>
          !value || value.toString().trim() === ""
            ? "El nombre de la calle es requerido"
            : null,
      },
      {
        name: "activo",
        label: "¿Está activa?",
        type: "select",
        icon: CheckCircle2,
        required: true,
        defaultValue:
          calleToEdit?.activo !== undefined
            ? String(calleToEdit.activo)
            : "true",
        options: [
          { value: "true", label: "Sí" },
          { value: "false", label: "No" },
        ],
        validation: (value: string | number) =>
          value === "" || value === null || value === undefined
            ? "Debe seleccionar si la calle está activa"
            : null,
      },
    ],

    onSubmit: async (data) => {
      const payload = {
        nombre_calle: data.nombre_calle,
        activo: data.activo === "true",
      };

      let result;

      try {
        if (calleToEdit) {
          result = await updateCalle(calleToEdit.id_calle, payload);
        } else {
          result = await createCalle(payload);
        }

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: calleToEdit ? "¡Calle actualizada!" : "¡Registro exitoso!",
            timer: 2500,
            confirmButtonColor: "#667eea",
          });

          onSuccess();
        } else {
          throw new Error("Error en la operación");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo guardar la calle",
        });
      }
    },

    submitButtonText: calleToEdit ? "Guardar Cambios" : "Registrar Calle",
    resetButtonText: calleToEdit ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (calleToEdit) onCancel();
    },
  };

  return <FormularioReutilizable config={formConfig} />;
}
