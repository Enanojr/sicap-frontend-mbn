
import { registerUser } from "../../services/Rcobradores.service";
import Swal from "sweetalert2";
import { User, Mail, Lock, UserPlus } from "lucide-react";

// Importa los componentes y tipos del formulario reutilizable
import FormularioReutilizable from "../../components/forms/form"; // Asegúrate que la ruta sea correcta
import type { FormConfig } from "../../components/forms/form"; // Asegúrate que la ruta sea correcta

export default function RegisterCobrador() {
  // --- Funciones de Validación Específicas ---
  // (Son las mismas que definimos para RegisterAdmin)

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) {
      return "El email es requerido";
    }
    if (!/\S+@\S+\.\S+/.test(value)) {
      return "El email no es válido";
    }
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (!value) {
      return "La contraseña es requerida";
    }
    if (value.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    return null;
  };

  // Usamos la versión corregida que acepta 'allData' como opcional
  const validatePassword2 = (
    value: string,
    allData?: Record<string, any>
  ): string | null => {
    if (!value) {
      return "Debe confirmar la contraseña";
    }
    if (!allData) {
      return null; // No se puede comparar si no hay datos
    }
    if (value !== allData.password) {
      return "Las contraseñas no coinciden";
    }
    return null;
  };

  // --- Configuración del Formulario ---

  const formConfig: FormConfig = {
    title: "REGISTRO DE COBRADORES", // Título actualizado
    fields: [
      {
        name: "nombre",
        label: "Nombre",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese el nombre",
        validation: (value: string) =>
          !value.trim() ? "El nombre es requerido" : null,
      },
      {
        name: "apellidos",
        label: "Apellidos",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese los apellidos",
        validation: (value: string) =>
          !value.trim() ? "Los apellidos son requeridos" : null,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        icon: Mail,
        required: true,
        placeholder: "correo@ejemplo.com",
        validation: validateEmail,
      },
      {
        name: "usuario",
        label: "Usuario",
        type: "text",
        icon: UserPlus,
        required: true,
        placeholder: "Nombre de usuario",
        validation: (value: string) =>
          !value.trim() ? "El usuario es requerido" : null,
      },
      {
        name: "password",
        label: "Contraseña",
        type: "password",
        icon: Lock,
        required: true,
        placeholder: "Ingrese contraseña",
        validation: validatePassword,
      },
      {
        name: "password2",
        label: "Confirmar Contraseña",
        type: "password",
        icon: Lock,
        required: true,
        placeholder: "Confirme contraseña",
        validation: validatePassword2, // Usa la validación corregida
      },
      // Nota: Este formulario no tiene el campo 'role', así que simplemente
      // no se añade al array de 'fields'.
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      // El componente reutilizable ya hizo la validación
      try {
        // Usamos el 'registerUser' importado de 'Rcobradores.service'
        const result = await registerUser(data as any);

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            text: "El usuario ha sido registrado correctamente",
            confirmButtonColor: "#667eea",
            timer: 3000,
            timerProgressBar: true,
          });
          // El formulario se limpiará automáticamente si la promesa se resuelve
        } else {
          // Manejar errores específicos del servidor
          let errorMessage = "Error al registrar usuario";
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
        
        // Si no es el error que ya mostramos, mostramos uno genérico
        if (!error.message.includes("Error al registrar usuario")) {
          Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: "Ocurrió un error al registrar el usuario. Por favor, intente nuevamente.",
            confirmButtonColor: "#667eea",
          });
        }
        
        // Relanzamos el error para el componente
        throw error;
      }
    },

    // --- Configuración de Botones ---
    submitButtonText: "Registrar Usuario",
    resetButtonText: "Limpiar Formulario",
    showResetButton: true,
  };

  // Simplemente renderiza el formulario reutilizable con la config
  return <FormularioReutilizable config={formConfig} />;
}