import React, { useEffect, useState } from "react";
import { User, Phone, Home, MapPin, FileText, Briefcase } from "lucide-react";

import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

import {
  createCuentahabiente,
  updateCuentahabiente,
  type CuentahabienteBase,
  type CuentahabienteResponse,
} from "../../services/Rcuentahabientes.service";

import { getColonias } from "../../services/Rcolonias.service";
import { getAllServicios } from "../../services/servicios.service";

import Swal from "sweetalert2";

interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  cuentahabienteToEdit?: CuentahabienteResponse | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FormularioCuentahabientes: React.FC<Props> = ({
  cuentahabienteToEdit,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!cuentahabienteToEdit;

  const [coloniaOptions, setColoniaOptions] = useState<SelectOption[]>([]);
  const [servicioOptions, setServicioOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        Swal.fire({
          title: "Cargando datos...",
          text: "Espere un momento...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const [colResp, servResp] = await Promise.all([
          getColonias(),
          getAllServicios(),
        ]);

        let coloniasRaw: any[] = [];

        if ((colResp as any)?.data?.results) {
          coloniasRaw = (colResp as any).data.results;
        } else if ((colResp as any)?.data) {
          coloniasRaw = (colResp as any).data;
        } else if (Array.isArray(colResp)) {
          coloniasRaw = colResp;
        }

        setColoniaOptions(
          coloniasRaw.map((c: any) => ({
            value: c.id_colonia.toString(),
            label: `${c.nombre_colonia} (CP: ${c.codigo_postal})`,
          }))
        );

        let serviciosRaw: any[] = [];

        if ((servResp as any)?.results) {
          serviciosRaw = (servResp as any).results;
        } else if (Array.isArray(servResp)) {
          serviciosRaw = servResp;
        }

        setServicioOptions(
          serviciosRaw.map((s: any) => ({
            value: s.id_tipo_servicio.toString(),
            label: s.nombre,
          }))
        );

        Swal.close();
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        Swal.fire("Error", "No se pudieron cargar los catálogos", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const validateRequired = (v: any) => {
    const value = String(v ?? "").trim();
    return !value ? "Este campo es requerido" : null;
  };

  const validateNumber = (v: any) => {
    const value = String(v ?? "").trim();
    if (!value) return "Requerido";
    if (isNaN(Number(value))) return "Debe ser numérico";
    return null;
  };

  const validateTelefono = (v: any) => {
    const value = String(v ?? "")
      .trim()
      .toLowerCase();

    if (value === "" || value === "s/n") {
      return null;
    }

    if (/^\d{10}$/.test(value)) {
      return null;
    }

    return "Debe ser un número de 10 dígitos o 'S/N'";
  };

  const cfg: FormConfig = {
    title: isEditMode ? "Editar Cuentahabiente" : "Registro de Cuentahabientes",

    showResetButton: true,
    submitButtonText: isEditMode ? "Guardar Cambios" : "Registrar",
    resetButtonText: isEditMode ? "Cancelar" : "Limpiar",

    fields: [
      {
        name: "numero_contrato",
        label: "Número de Contrato",
        type: "number",
        icon: FileText,
        required: true,

        defaultValue: cuentahabienteToEdit?.numero_contrato ?? "",
        validation: validateNumber,
      },
      {
        name: "nombres",
        label: "Nombre(s)",
        type: "text",
        icon: User,
        required: true,
        defaultValue: cuentahabienteToEdit?.nombres ?? "",
        validation: validateRequired,
      },
      {
        name: "ap",
        label: "Apellido Paterno",
        type: "text",
        icon: User,
        required: true,
        defaultValue: cuentahabienteToEdit?.ap ?? "",
        validation: validateRequired,
      },
      {
        name: "am",
        label: "Apellido Materno",
        type: "text",
        icon: User,
        required: true,
        defaultValue: cuentahabienteToEdit?.am ?? "",
        validation: validateRequired,
      },

      {
        name: "numero",
        label: "Número",
        type: "number",
        icon: Home,
        required: true,
        defaultValue: cuentahabienteToEdit?.numero ?? "",
        validation: validateNumber,
      },
      {
        name: "telefono",
        label: "Teléfono",
        type: "tel",
        icon: Phone,
        required: false,
        defaultValue: cuentahabienteToEdit?.telefono ?? "",
        validation: validateTelefono,
      },
      {
        name: "colonia",
        label: "Colonia",
        type: "select",
        icon: MapPin,
        required: true,
        options: coloniaOptions,
        defaultValue: cuentahabienteToEdit?.colonia?.toString() ?? "",
      },
      {
        name: "servicio",
        label: "Servicio",
        type: "select",
        icon: Briefcase,
        required: true,
        options: servicioOptions,
        defaultValue: cuentahabienteToEdit?.servicio?.toString() ?? "",
      },
      {
        name: "calle",
        label: "Calle",
        type: "text",
        icon: Home,
        required: true,
        defaultValue: cuentahabienteToEdit?.calle ?? "",
        validation: validateRequired,
      },
    ],

    onSubmit: async (data) => {
      const payload: CuentahabienteBase = {
        numero_contrato: Number(data.numero_contrato),
        nombres: data.nombres,
        ap: data.ap,
        am: data.am,
        calle: data.calle,
        numero: Number(data.numero),
        telefono: data.telefono,
        colonia: Number(data.colonia),
        servicio: Number(data.servicio),
      };

      Swal.fire({
        title: isEditMode ? "Actualizando..." : "Registrando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const resp = isEditMode
        ? await updateCuentahabiente(
            cuentahabienteToEdit!.id_cuentahabiente,
            payload
          )
        : await createCuentahabiente(payload);

      if (!resp.success) {
        Swal.fire("Error", "No se pudo procesar la solicitud", "error");
        return;
      }

      Swal.fire(
        "Éxito",
        isEditMode
          ? "Cuentahabiente actualizado correctamente"
          : "Cuentahabiente registrado correctamente",
        "success"
      );

      onSuccess?.();
    },

    onReset: () => {
      if (isEditMode) onCancel?.();
    },
  };

  if (isLoading) return null;

  return (
    <FormularioReutilizable
      key={cuentahabienteToEdit?.id_cuentahabiente ?? "new"}
      config={cfg}
      isEditMode={isEditMode}
    />
  );
};

export default FormularioCuentahabientes;
