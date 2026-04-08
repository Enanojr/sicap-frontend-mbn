import Swal from "sweetalert2";
import { DollarSign, FileText } from "lucide-react";
import type { FormConfig } from "../../components/forms/form";
import FormularioReutilizable from "../../components/forms/form";
import { createCargo, updateCargo, type CargoResponse } from "../../services/tcargos.service";

interface FormularioCargosProps {
  cargoToEdit: CargoResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FormularioCargos({ cargoToEdit, onSuccess, onCancel }: FormularioCargosProps) {
  
  const formConfig: FormConfig = {
    title: cargoToEdit ? "Editar Cargo" : "Registrar Cargo",
    fields: [
      {
        name: "nombre",
        label: "Nombre del Cargo",
        type: "text",
        icon: FileText,
        required: true,
        defaultValue: cargoToEdit?.nombre ?? "",
        validation: (value: string | number) => !String(value).trim() ? "El nombre es obligatorio" : null,
      },
      {
        name: "monto",
        label: "Monto del Cargo (MXN)",
        type: "number",
        icon: DollarSign,
        required: true,
        defaultValue: cargoToEdit?.monto ?? "",
        validation: (value: string | number) => Number(value) <= 0 ? "El monto debe ser mayor que 0" : null,
      },
    ],
    onSubmit: async (data) => {
      try {
        const payload = {
          nombre: String(data.nombre),
          monto: Number(data.monto),
        };

        if (cargoToEdit) {
          await updateCargo(cargoToEdit.id, payload);
          // Si llega aquí es porque NO hubo error
          await Swal.fire({
            icon: "success",
            title: "Cargo actualizado",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await createCargo(payload);
          // Si llega aquí es porque NO hubo error
          await Swal.fire({
            icon: "success",
            title: "Cargo registrado",
            timer: 1500,
            showConfirmButton: false,
          });
        }
        onSuccess();
      } catch (e) {
        // No hacemos nada aquí porque el SERVICE ya mostró la alerta de error
        console.warn("Operación cancelada por error en API");
      }
    },
    submitButtonText: cargoToEdit ? "Guardar Cambios" : "Registrar Cargo",
    resetButtonText: cargoToEdit ? "Cancelar" : "Limpiar",
    showResetButton: true,
    onReset: () => cargoToEdit && onCancel(),
  };

  return <FormularioReutilizable key={cargoToEdit?.id ?? "new"} config={formConfig} />;
}