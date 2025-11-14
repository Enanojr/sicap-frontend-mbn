
import { registerSector } from "../../services/Rsector.service";
// Importa los íconos
import { MapPinHouse, BookOpenText } from "lucide-react";
import Swal from "sweetalert2";

// Importa los componentes y tipos del formulario reutilizable
import FormularioReutilizable from "../../components/forms/form"; // Asegúrate que la ruta sea correcta
import type { FormConfig } from "../../components/forms/form"; // Asegúrate que la ruta sea correcta

export default function RegisterSector() {
  // --- Configuración del Formulario ---

  const formConfig: FormConfig = {
    title: "REGISTRO DE SECTOR",
    fields: [
      {
        name: "nombre_sector",
        label: "Nombre de sector",
        type: "text",
        icon: MapPinHouse,
        required: true,
        placeholder: "Ingrese el sector",
        validation: (value: string) =>
          !value.trim() ? "El sector es requerido" : null,
      },
      {
        name: "descripcion",
        label: "Descripcion",
        type: "text", // El original usa 'input', no 'textarea'
        icon: BookOpenText,
        required: true,
        placeholder: "Ingrese una descripción del sector",
        validation: (value: string) =>
          !value.trim() ? "La descripción es requerida" : null,
      },
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      // El componente reutilizable ya hizo la validación
      try {
        const result = await registerSector(data as any);

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            // Texto actualizado para 'sector'
            text: "El sector ha sido registrado correctamente",
            confirmButtonColor: "#667eea",
            timer: 3000,
            timerProgressBar: true,
          });
          // El formulario se limpiará automáticamente
        } else {
          // Manejar errores específicos del servidor
          let errorMessage = "Error al registrar el sector"; // Texto actualizado

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
            confirmButtonColor: "#667eea",
          });

          // Lanzamos un error para que el formulario reutilizable sepa que falló
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error("Error inesperado:", error);
        
        // Evita mostrar dos alertas si el error ya fue manejado
        if (!error.message.includes("Error al registrar")) {
          Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: "Ocurrió un error al registrar el sector. Por favor, intente nuevamente.",
            confirmButtonColor: "#667eea",
          });
        }
        
        // Relanzamos el error para el componente
        throw error;
      }
    },

    // --- Configuración de Botones ---
    submitButtonText: "Registrar Sector",
    resetButtonText: "Limpiar",
    showResetButton: true,
  };

  // Simplemente renderiza el formulario reutilizable con la config
  return <FormularioReutilizable config={formConfig} />;
}