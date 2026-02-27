import React, { useEffect, useState } from "react";
import { User, Phone, Home, MapPin, FileText, Briefcase } from "lucide-react";

import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

import {
  createCuentahabiente,
  updateCuentahabiente,
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
        if ((colResp as any)?.data?.results)
          coloniasRaw = (colResp as any).data.results;
        else if ((colResp as any)?.data) coloniasRaw = (colResp as any).data;
        else if (Array.isArray(colResp)) coloniasRaw = colResp;

        setColoniaOptions(
          coloniasRaw.map((c: any) => ({
            value: c.id_colonia.toString(),
            label: `${c.nombre_colonia} (CP: ${c.codigo_postal})`,
          })),
        );

        let serviciosRaw: any[] = [];
        if ((servResp as any)?.results)
          serviciosRaw = (servResp as any).results;
        else if (Array.isArray(servResp)) serviciosRaw = servResp;

        setServicioOptions(
          serviciosRaw.map((s: any) => ({
            value: s.id_tipo_servicio.toString(),
            label: s.nombre,
          })),
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
    if (value === "" || value === "s/n") return null;
    if (/^\d{10}$/.test(value)) return null;
    return "Debe ser un número de 10 dígitos o 'S/N'";
  };

  const isDuplicateContratoError = (errors: any) => {
    const raw = JSON.stringify(errors ?? {}).toLowerCase();
    return (
      raw.includes("unique") ||
      raw.includes("already exists") ||
      raw.includes("ya existe") ||
      raw.includes("duplicad") ||
      raw.includes("existe un registro") ||
      (raw.includes("numero_contrato") && raw.includes("existe"))
    );
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
        label: "Número de Casa",
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
        defaultValue:
          (cuentahabienteToEdit as any)?.colonia?.toString?.() ?? "",
      },
      {
        name: "servicio",
        label: "Servicio",
        type: "select",
        icon: Briefcase,
        required: true,
        options: servicioOptions,
        defaultValue:
          (cuentahabienteToEdit as any)?.servicio?.toString?.() ?? "",
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
      const payload: any = {
        numero_contrato: Number(data.numero_contrato),
        nombres: String(data.nombres ?? ""),
        ap: String(data.ap ?? ""),
        am: String(data.am ?? ""),
        calle: String(data.calle ?? ""),
        numero: Number(data.numero),
        telefono: String(data.telefono ?? ""),
        colonia: Number(data.colonia),
        servicio: Number(data.servicio),
      };

      // ─────────────── EDIT ───────────────
      if (isEditMode) {
        Swal.fire({
          title: "Actualizando...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const resp = await updateCuentahabiente(
          cuentahabienteToEdit!.id_cuentahabiente,
          payload,
        );

        if (!resp.success) {
          Swal.fire({
            icon: "error",
            title: "No se pudo completar",
            text: "Ocurrió un problema al procesar la solicitud. Intente nuevamente.",
            confirmButtonColor: "#58b2ee",
          });
          return;
        }

        Swal.fire({
          icon: "success",
          title: "Listo",
          text: "El cuentahabiente se actualizó correctamente.",
          confirmButtonColor: "#58b2ee",
        });

        onSuccess?.();
        return;
      }

      // ─────────────── CREATE ──────────────
      const toma = await Swal.fire({
        icon: "question",
        title: "Nueva toma",
        html: `
          <div style="text-align:left; line-height:1.35">
            <p style="margin:0 0 .6rem 0">
              ¿Este registro corresponde a una <b>nueva toma</b>?
            </p>
            <p style="margin:0;color:#9ca3af">
              Si selecciona <b>Sí</b>, se aplicará el cargo de <b>$1,500.00</b>.
              Si selecciona <b>No</b>, el usuario se registrará sin ese cargo.
            </p>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Sí, es nueva toma",
        denyButtonText: "No, registrar sin cargo",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#58b2ee",
        denyButtonColor: "#0ea5e9",
        cancelButtonColor: "#374151",
        reverseButtons: true,
        focusCancel: true,
      });

      if (toma.isDismissed) return;

      payload.es_toma_nueva = toma.isConfirmed ? true : false;

      Swal.fire({
        title: "Registrando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const resp = await createCuentahabiente(payload);

      if (!resp.success) {
        Swal.close();

        if (isDuplicateContratoError(resp.errors)) {
          await Swal.fire({
            icon: "info",
            title: "Contrato ya registrado",
            html: `
              <div style="text-align:left; line-height:1.35">
                <p style="margin:0 0 .5rem 0">
                  El contrato <b>#${payload.numero_contrato}</b> ya se encuentra registrado.
                </p>
                <p style="margin:0;color:#9ca3af">
                  No se realizó ningún cambio.
                </p>
              </div>
            `,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#58b2ee",
          });
          return;
        }

        await Swal.fire({
          icon: "error",
          title: "No se pudo completar",
          text: "Ocurrió un problema al registrar. Revise los datos e intente nuevamente.",
          confirmButtonColor: "#58b2ee",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Listo",
        text: payload.es_toma_nueva
          ? "El cuentahabiente se registró y se marcó como nueva toma."
          : "El cuentahabiente se registró correctamente.",
        confirmButtonColor: "#58b2ee",
      });

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
