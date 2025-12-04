import { useEffect } from "react";
import Swal from "sweetalert2";
import { DollarSign, FileText } from "lucide-react";

import type { FormConfig } from "./form";
import FormularioReutilizable from "./form";

import {
  createServicio,
  updateServicio,
  type ServicioResponse,
} from "../../services/servicios.service";

interface FormularioServiciosProps {
  servicioToEdit: ServicioResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FormularioServicios({
  servicioToEdit,
  onSuccess,
  onCancel,
}: FormularioServiciosProps) {
  useEffect(() => {}, [servicioToEdit]);

  const formConfig: FormConfig = {
    title: servicioToEdit ? "Editar Servicio" : "Registrar Servicio",

    fields: [
      {
        name: "nombre",
        label: "Nombre del Servicio",
        type: "text",
        icon: FileText,
        required: true,
        defaultValue: servicioToEdit?.nombre ?? "",
        validation: (value: string | number) =>
          !String(value).trim() ? "El nombre es obligatorio" : null,
      },
      {
        name: "costo",
        label: "Costo del Servicio (MXN)",
        type: "number",
        icon: DollarSign,
        required: true,
        defaultValue: servicioToEdit?.costo ?? "",
        validation: (value: string | number) =>
          Number(value) <= 0 ? "El costo debe ser mayor que 0" : null,
      },
    ],

    onSubmit: async (data) => {
      try {
        if (servicioToEdit) {
          await updateServicio(servicioToEdit.id_servicio!, {
            nombre: data.nombre,
            costo: Number(data.costo),
          });

          Swal.fire({
            icon: "success",
            title: "Servicio actualizado",
            timer: 2000,
          });
        } else {
          await createServicio({
            nombre: data.nombre,
            costo: Number(data.costo),
          });

          Swal.fire({
            icon: "success",
            title: "Servicio registrado",
            timer: 2000,
          });
        }

        onSuccess();
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
        });
      }
    },

    submitButtonText: servicioToEdit ? "Guardar Cambios" : "Registrar Servicio",
    resetButtonText: servicioToEdit ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (servicioToEdit) {
        onCancel();
      }
    },
  };

  return <FormularioReutilizable config={formConfig} />;
}
