
import { registerUser } from "../../services/Rcolonias.service";
// Importa los íconos
import { House, MapPin } from "lucide-react";
import Swal from "sweetalert2";

// Importa los componentes y tipos del formulario reutilizable
import FormularioReutilizable from "../../components/forms/form"; // Asegúrate que la ruta sea correcta
import type { FormConfig } from "../../components/forms/form"; // Asegúrate que la ruta sea correcta

export default function RegisterColonia() {
  // --- Función de Validación Específica (para C.P.) ---
  const validatePostalCode = (value: string): string | null => {
    if (!value) {
      return "El código postal es requerido";
    }
    // Opcional: Podrías añadir más validaciones aquí, como:
    // if (!/^\d{5}$/.test(value)) {
    //   return "Debe ser un código postal de 5 dígitos";
    // }
    return null;
  };

  // --- Configuración del Formulario ---

  const formConfig: FormConfig = {
    title: "REGISTRO DE COLONIA",
    fields: [
      {
        name: "nombre_colonia",
        label: "Nombre de colonia",
        type: "text",
        icon: House,
        required: true,
        placeholder: "Ingrese la colonia",
        validation: (value: string) =>
          !value.trim() ? "La colonia es requerida" : null,
      },
      {
        name: "codigo_postal",
        label: "Codigo Postal",
        type: "number", // El tipo 'number' para el input
        icon: MapPin,
        required: true,
        placeholder: "Ingrese el codigo postal",
        validation: validatePostalCode, // Usa la función de validación
      },
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      // El componente reutilizable ya hizo la validación
      try {
        const result = await registerUser(data as any);

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            // Texto actualizado para 'colonia'
            text: "La colonia ha sido registrada correctamente",
            confirmButtonColor: "#667eea",
            timer: 3000,
            timerProgressBar: true,
          });
          // El formulario se limpiará automáticamente
        } else {
          // Manejar errores específicos del servidor
          let errorMessage = "Error al registrar la colonia"; // Texto actualizado

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
            text: "Ocurrió un error al registrar la colonia. Por favor, intente nuevamente.",
            confirmButtonColor: "#667eea",
          });
        }
        
        // Relanzamos el error para el componente
        throw error;
      }
    },

    // --- Configuración de Botones ---
    submitButtonText: "Registrar Colonia",
    resetButtonText: "Limpiar",
    showResetButton: true,
  };

  // Simplemente renderiza el formulario reutilizable con la config
  return <FormularioReutilizable config={formConfig} />;
}