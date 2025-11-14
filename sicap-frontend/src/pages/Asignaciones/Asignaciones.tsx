import { useState, useEffect } from "react";
import { User, MapPin, Calendar } from "lucide-react";
import { registerAsignacion } from "../../services/Asignaciones.service";
import { getCobradores } from "../../services/Rcobradores.service";
import { getSectores } from "../../services/Rsector.service";
import Swal from "sweetalert2";

// Importa los componentes y tipos del formulario reutilizable
import FormularioReutilizable from "../../components/forms/form"; // Asegúrate que la ruta sea correcta
import type { FormConfig } from "../../components/forms/form"; // Asegúrate que la ruta sea correcta

// Interfaz para las opciones de los 'select'
interface SelectOption {
  value: string;
  label: string;
}

// Helper para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

export default function RegisterAsignacion() {
  const [cobradorOptions, setCobradorOptions] = useState<SelectOption[]>([]);
  const [sectorOptions, setSectorOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Un solo estado de carga

  // Cargar cobradores y sectores al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        Swal.fire({
          title: "Cargando datos...",
          text: "Por favor, espere...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        // Carga ambos recursos en paralelo
        const [cobradoresResult, sectoresResult] = await Promise.all([
          getCobradores(),
          getSectores(),
        ]);

        // Procesar Cobradores
        if (cobradoresResult.success) {
          const data =
            (cobradoresResult.data as any).results || cobradoresResult.data;
          if (Array.isArray(data)) {
            setCobradorOptions(
              data.map((c: any) => ({
                value: c.id_cobrador.toString(),
                label: `${c.nombre} ${c.apellidos}`,
              }))
            );
          }
        } else {
          throw new Error("No se pudieron cargar los cobradores");
        }

        // Procesar Sectores
        if (sectoresResult.success) {
          const data =
            (sectoresResult.data as any).results || sectoresResult.data;
          if (Array.isArray(data)) {
            setSectorOptions(
              data.map((s: any) => ({
                value: (s.id || s.id_sector).toString(),
                label: s.descripcion
                  ? `${s.nombre_sector} - ${s.descripcion}`
                  : s.nombre_sector,
              }))
            );
          }
        } else {
          throw new Error("No se pudieron cargar los sectores");
        }

        Swal.close(); // Cierra el loader si todo salió bien
      } catch (error: any) {
        console.error("Error al cargar datos:", error);
        Swal.fire({
          icon: "error",
          title: "Error al cargar datos",
          text:
            error.message ||
            "No se pudieron obtener los datos para el formulario.",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- Funciones de Validación Específicas ---

  const validateRequired = (value: string): string | null => {
    return !value.trim() ? "Este campo es requerido" : null;
  };

  // --- Configuración del Formulario ---

  const formConfig: FormConfig = {
    title: "REGISTRO DE ASIGNACIONES",
    fields: [
      {
        name: "cobrador",
        label: "Cobrador",
        type: "select",
        icon: User,
        required: true,
        options: cobradorOptions,
        placeholder: "Seleccione un cobrador",
        validation: validateRequired,
      },
      {
        name: "sector",
        label: "Sector",
        type: "select",
        icon: MapPin,
        required: true,
        options: sectorOptions,
        placeholder: "Seleccione un sector",
        validation: validateRequired,
      },
      {
        name: "fecha_asignacion",
        label: "Fecha de Asignación",
        type: "date",
        icon: Calendar,
        required: true,
        // Asigna la fecha de hoy como valor por defecto
        defaultValue: getTodayDate(),
        validation: validateRequired,
      },
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      try {
        // Convierte los campos de string a número antes de enviar
        const payload = {
          cobrador: Number(data.cobrador),
          sector: Number(data.sector),
          fecha_asignacion: data.fecha_asignacion,
        };

        const result = await registerAsignacion(payload);

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            text: "La asignación ha sido registrada correctamente",
            confirmButtonColor: "#667eea",
            timer: 3000,
            timerProgressBar: true,
          });
          // El formulario se limpiará automáticamente
        } else {
          let errorMessage = "Error al registrar asignación";
          if (result.errors) {
            if (typeof result.errors === "object") {
              const firstErrorKey = Object.keys(result.errors)[0];
              const firstErrorValue = result.errors[firstErrorKey];
              errorMessage = Array.isArray(firstErrorValue)
                ? firstErrorValue[0]
                : firstErrorValue;
            } else if (result.errors.general) {
              errorMessage = result.errors.general;
            }
          }
          Swal.fire({
            icon: "error",
            title: "Error de registro",
            text: errorMessage,
            confirmButtonColor: "#ef4444", // Color de error
          });
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error("Error inesperado:", error);
        if (!error.message.includes("Error al registrar")) {
          Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: "Ocurrió un error al registrar la asignación. Por favor, intente nuevamente.",
            confirmButtonColor: "#ef4444",
          });
        }
        throw error;
      }
    },

    // --- Configuración de Botones ---
    submitButtonText: "Registrar Asignación",
    resetButtonText: "Limpiar Formulario",
    showResetButton: true,
  };

  // No renderiza el formulario hasta que los datos estén cargados
  if (isLoading) {
    return null; // El Swal de carga ya se está mostrando
  }

  // Una vez que isLoading es false, renderiza el formulario
  return <FormularioReutilizable config={formConfig} />;
}