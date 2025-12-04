import { MapPinHouse, BookOpenText } from "lucide-react";
import Swal from "sweetalert2";

import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

import {
  registerSector,
  updateSector,
  type SectorResponse,
} from "../../services/Rsector.service";

interface RegisterSectorProps {
  sectorToEdit: SectorResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RegisterSector({
  sectorToEdit,
  onSuccess,
  onCancel,
}: RegisterSectorProps) {
  const formConfig: FormConfig = {
    title: sectorToEdit ? "Editar Sector" : "Registro de Sectores",

    fields: [
      {
        name: "nombre_sector",
        label: "Nombre de sector",
        type: "text",
        icon: MapPinHouse,
        required: true,
        placeholder: "Ingrese el sector",
        defaultValue: sectorToEdit?.nombre_sector ?? "",
        validation: (value: string | number) =>
          !value || value.toString().trim() === ""
            ? "El nombre del sector es requerido"
            : null,
      },
      {
        name: "descripcion",
        label: "Descripción",
        type: "text",
        icon: BookOpenText,
        required: true,
        placeholder: "Ingrese una descripción",
        defaultValue: sectorToEdit?.descripcion ?? "",
        validation: (value: string | number) =>
          !value || value.toString().trim() === ""
            ? "La descripción es requerida"
            : null,
      },
    ],

    onSubmit: async (data) => {
      const payload = {
        nombre_sector: data.nombre_sector,
        descripcion: data.descripcion,
      };

      let result;

      try {
        if (sectorToEdit) {
          // 🔥 EDITAR
          result = await updateSector(sectorToEdit.id_sector, payload);
        } else {
          // 🟢 REGISTRAR
          result = await registerSector(payload);
        }

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: sectorToEdit ? "¡Sector actualizado!" : "¡Registro exitoso!",
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
          text: "No se pudo guardar el sector",
        });
      }
    },

    submitButtonText: sectorToEdit ? "Guardar Cambios" : "Registrar Sector",
    resetButtonText: sectorToEdit ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (sectorToEdit) onCancel();
    },
  };

  return <FormularioReutilizable config={formConfig} />;
}
