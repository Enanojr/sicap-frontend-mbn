import { House, MapPin } from "lucide-react";
import Swal from "sweetalert2";

import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

import type { ColoniaResponse } from "../../services/Rcolonias.service";
import { registerUser, updateColonia } from "../../services/Rcolonias.service";

interface RegisterColoniaProps {
  coloniaToEdit: ColoniaResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RegisterColonia({
  coloniaToEdit,
  onSuccess,
  onCancel,
}: RegisterColoniaProps) {
  const validatePostalCode = (value: string | number): string | null => {
    const strValue = String(value);
    if (!strValue.trim()) return "El código postal es requerido";
    return null;
  };

  const formConfig: FormConfig = {
    title: coloniaToEdit ? "Editar Colonia" : "Registro de Colonias",
    fields: [
      {
        name: "nombre_colonia",
        label: "Nombre de colonia",
        type: "text",
        icon: House,
        required: true,
        placeholder: "Ingrese la colonia",
        defaultValue: coloniaToEdit?.nombre_colonia ?? "",
        validation: (value: string | number) =>
          !String(value).trim() ? "La colonia es requerida" : null,
      },
      {
        name: "codigo_postal",
        label: "Código Postal",
        type: "number",
        icon: MapPin,
        required: true,
        placeholder: "Ingrese el código postal",
        defaultValue: coloniaToEdit?.codigo_postal ?? "",
        validation: validatePostalCode,
      },
    ],

    onSubmit: async (data) => {
      try {
        const payload = {
          nombre_colonia: data.nombre_colonia,
          codigo_postal: data.codigo_postal,
        };

        let result;

        if (coloniaToEdit) {
          result = await updateColonia(coloniaToEdit.id_colonia, payload);
        } else {
          result = await registerUser(payload);
        }

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: coloniaToEdit
              ? "¡Colonia actualizada!"
              : "¡Registro exitoso!",
            text: coloniaToEdit
              ? "La colonia fue modificada correctamente."
              : "La colonia fue registrada correctamente.",
            confirmButtonColor: "#667eea",
            timer: 3000,
          });

          onSuccess();
        } else {
          let errorMessage = "Error al procesar la solicitud.";
          const firstKey = Object.keys(result.errors)[0];
          const firstValue = result.errors[firstKey];
          errorMessage = Array.isArray(firstValue) ? firstValue[0] : firstValue;

          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
            confirmButtonColor: "#667eea",
          });

          throw new Error(errorMessage);
        }
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error inesperado",
          text: "Ocurrió un problema al guardar los datos.",
          confirmButtonColor: "#667eea",
        });
        throw error;
      }
    },

    submitButtonText: coloniaToEdit ? "Guardar Cambios" : "Registrar Colonia",
    resetButtonText: coloniaToEdit ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (coloniaToEdit) onCancel();
    },
  };

  return <FormularioReutilizable config={formConfig} />;
}
