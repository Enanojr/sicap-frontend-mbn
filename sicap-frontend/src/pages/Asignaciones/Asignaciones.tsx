import { useState, useEffect } from "react";
import { User, MapPin, Calendar } from "lucide-react";

import {
  registerAsignacion,
  updateAsignacion,
  type AsignacionResponse,
} from "../../services/Asignaciones.service";

import { getCobradores } from "../../services/Rcobradores.service";
import { getSectores } from "../../services/Rsector.service";

import Swal from "sweetalert2";
import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

interface SelectOption {
  value: string;
  label: string;
}

interface RegisterAsignacionProps {
  asignacionToEdit: AsignacionResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function RegisterAsignacion({
  asignacionToEdit,
  onSuccess,
  onCancel,
}: RegisterAsignacionProps) {
  const [cobradorOptions, setCobradorOptions] = useState<SelectOption[]>([]);
  const [sectorOptions, setSectorOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        Swal.fire({
          title: "Cargando datos...",
          text: "Por favor, espere...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const [cobradoresResult, sectoresResult] = await Promise.all([
          getCobradores(),
          getSectores(),
        ]);

        if (cobradoresResult.success) {
          const data =
            (cobradoresResult.data as any).results || cobradoresResult.data;

          setCobradorOptions(
            data.map((c: any) => ({
              value: c.id_cobrador.toString(),
              label: `${c.nombre} ${c.apellidos}`,
            }))
          );
        }

        if (sectoresResult.success) {
          const data =
            (sectoresResult.data as any).results || sectoresResult.data;

          setSectorOptions(
            data.map((s: any) => ({
              value: (s.id || s.id_sector).toString(),
              label: s.descripcion
                ? `${s.nombre_sector} - ${s.descripcion}`
                : s.nombre_sector,
            }))
          );
        }

        Swal.close();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error al cargar datos",
          text: "No se pudieron obtener los datos.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formConfig: FormConfig = {
    title: asignacionToEdit ? "Editar Asignación" : "Registro de Asignaciones",

    fields: [
      {
        name: "cobrador",
        label: "Cobrador",
        type: "select",
        icon: User,
        required: true,
        options: cobradorOptions,
        defaultValue: asignacionToEdit?.cobrador.id_cobrador ?? "",
      },
      {
        name: "sector",
        label: "Sector",
        type: "select",
        icon: MapPin,
        required: true,
        options: sectorOptions,
        defaultValue: asignacionToEdit?.sector.id_sector ?? "",
      },
      {
        name: "fecha_asignacion",
        label: "Fecha de Asignación",
        type: "date",
        icon: Calendar,
        required: true,
        defaultValue: asignacionToEdit?.fecha_asignacion ?? getTodayDate(),
      },
    ],

    onSubmit: async (data) => {
      const payload = {
        cobrador: Number(data.cobrador),
        sector: Number(data.sector),
        fecha_asignacion: data.fecha_asignacion,
      };

      let result;

      if (asignacionToEdit) {
        // 🔥 MODO EDICIÓN
        result = await updateAsignacion(
          asignacionToEdit.id_asignacion,
          payload
        );
      } else {
        // 🟢 MODO REGISTRO
        result = await registerAsignacion(payload);
      }

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: asignacionToEdit
            ? "¡Asignación actualizada!"
            : "¡Registro exitoso!",
          confirmButtonColor: "#667eea",
          timer: 2500,
        });

        onSuccess();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo guardar la asignación.",
        });
      }
    },

    submitButtonText: asignacionToEdit
      ? "Guardar Cambios"
      : "Registrar Asignación",
    resetButtonText: asignacionToEdit ? "Cancelar" : "Limpiar",
    showResetButton: true,

    onReset: () => {
      if (asignacionToEdit) onCancel();
    },
  };

  if (isLoading) return null;

  return <FormularioReutilizable config={formConfig} />;
}
