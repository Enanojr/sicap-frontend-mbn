import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Home,
  MapPin,
  FileText,
  Briefcase,
} from "lucide-react";
import { registerCuentahabiente } from "../../services/Rcuentahabientes.service";
import { getColonias } from "../../services/Rcolonias.service";
import { getAllServicios } from "../../services/servicios.service";
import type { ServicioResponse } from "../../services/servicios.service";
import Swal from "sweetalert2";

// Importa los componentes y tipos del formulario reutilizable
import FormularioReutilizable from "../../components/forms/form"; // Asegúrate que la ruta sea correcta
import type { FormConfig } from "../../components/forms/form"; // Asegúrate que la ruta sea correcta

// Interfaz para las opciones de los 'select'
interface SelectOption {
  value: string;
  label: string;
}

export default function RegisterCuentahabiente() {
  const [coloniaOptions, setColoniaOptions] = useState<SelectOption[]>([]);
  const [servicioOptions, setServicioOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Un solo estado de carga

  // Cargar colonias y servicios al montar el componente
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
        const [coloniasResult, serviciosData] = await Promise.all([
          getColonias(),
          getAllServicios(),
        ]);

        // Procesar Colonias
        if (coloniasResult.success) {
          const data = (coloniasResult.data as any).results || coloniasResult.data;
          if (Array.isArray(data)) {
            setColoniaOptions(
              data.map((c: any) => ({
                value: c.id_colonia.toString(),
                label: `${c.nombre_colonia} CP: ${c.codigo_postal}`,
              }))
            );
          }
        } else {
          throw new Error("No se pudieron cargar las colonias");
        }

        // Procesar Servicios
        const data = (serviciosData as any).results || serviciosData;
        if (Array.isArray(data)) {
          setServicioOptions(
            data.map((s: ServicioResponse) => ({
              value: s.id_tipo_servicio.toString(),
              label: s.nombre,
            }))
          );
        } else {
          throw new Error("No se pudieron cargar los servicios");
        }

        Swal.close(); // Cierra el loader si todo salió bien
      } catch (error: any) {
        console.error("Error al cargar datos:", error);
        Swal.fire({
          icon: "error",
          title: "Error al cargar datos",
          text: error.message || "No se pudieron obtener los datos para el formulario.",
          confirmButtonColor: "#ef4444",
        });
        // Aquí podrías navegar a otra página o mostrar un estado de error
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

  const validateNumber = (value: string): string | null => {
    if (!value.trim()) return "Este campo es requerido";
    if (isNaN(Number(value))) return "Debe ser un valor numérico";
    return null;
  };

  const validateTelefono = (value: string): string | null => {
    if (!value.trim()) return "El teléfono es requerido";
    if (!/^\d{10}$/.test(value)) return "El teléfono debe tener 10 dígitos";
    return null;
  };

  // --- Configuración del Formulario ---
  // (Se define aquí, pero solo se usa después de que isLoading=false)

  const formConfig: FormConfig = {
    title: "REGISTRO DE CUENTAHABIENTES",
    fields: [
      {
        name: "numero_contrato",
        label: "Número de Contrato",
        type: "number",
        icon: FileText,
        required: true,
        placeholder: "Ingrese el número de contrato",
        validation: validateNumber,
      },
      {
        name: "nombres",
        label: "Nombre(s)",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese el nombre",
        validation: validateRequired,
      },
      {
        name: "ap",
        label: "Apellido Paterno",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese el apellido paterno",
        validation: validateRequired,
      },
      {
        name: "am",
        label: "Apellido Materno",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese el apellido materno",
        validation: validateRequired,
      },
      {
        name: "calle",
        label: "Calle",
        type: "text",
        icon: Home,
        required: true,
        placeholder: "Ingrese la calle",
        validation: validateRequired,
      },
      {
        name: "numero",
        label: "Número",
        type: "number",
        icon: Home,
        required: true,
        placeholder: "Número de domicilio",
        validation: validateNumber,
      },
      {
        name: "telefono",
        label: "Teléfono",
        type: "tel",
        icon: Phone,
        required: true,
        placeholder: "10 dígitos",
        validation: validateTelefono,
      },
      {
        name: "colonia",
        label: "Colonia",
        type: "select", // 'select' o 'search-select' si tienes muchas
        icon: MapPin,
        required: true,
        options: coloniaOptions, // Pasa las opciones cargadas
        placeholder: "Seleccione una colonia",
        validation: validateRequired,
      },
      {
        name: "servicio",
        label: "Servicio",
        type: "select",
        icon: Briefcase,
        required: true,
        options: servicioOptions, // Pasa las opciones cargadas
        placeholder: "Seleccione un servicio",
        validation: validateRequired,
      },
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      try {
        // Convierte los campos de string a número antes de enviar
        const payload = {
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

        const result = await registerCuentahabiente(payload);

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            text: "El cuentahabiente ha sido registrado correctamente",
            confirmButtonColor: "#667eea",
            timer: 3000,
            timerProgressBar: true,
          });
          // El formulario se limpiará automáticamente
        } else {
          let errorMessage = "Error al registrar cuentahabiente";
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
            text: "Ocurrió un error al registrar el cuentahabiente. Por favor, intente nuevamente.",
            confirmButtonColor: "#ef4444",
          });
        }
        throw error;
      }
    },

    // --- Configuración de Botones ---
    submitButtonText: "Registrar Cuentahabiente",
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