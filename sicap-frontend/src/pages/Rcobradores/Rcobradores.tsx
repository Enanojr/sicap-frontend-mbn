import { registerUser } from "../../services/Rcobradores.service";
import Swal from "sweetalert2";
import { User, Mail, Lock, UserPlus } from "lucide-react";

// Importa los componentes y tipos del formulario reutilizable
import FormularioReutilizable from "../../components/forms/form";
import type { FormConfig } from "../../components/forms/form";

export default function RegisterCobrador() {
  // --- Configuración del Formulario ---

  const formConfig: FormConfig = {
    title: "Registro de Cobradores",
    fields: [
      {
        name: "nombre",
        label: "Nombre",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese el nombre",
        validation: (value: string | number) =>
          typeof value === "string" && !value.trim()
            ? "El nombre es requerido"
            : null,
      },
      {
        name: "apellidos",
        label: "Apellidos",
        type: "text",
        icon: User,
        required: true,
        placeholder: "Ingrese los apellidos",
        validation: (value: string | number) =>
          typeof value === "string" && !value.trim()
            ? "Los apellidos son requeridos"
            : null,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        icon: Mail,
        required: true,
        placeholder: "correo@ejemplo.com",
        validation: (
          value: string | number,
          _allData?: Record<string, any>
        ) => {
          const strValue = String(value);
          if (!strValue.trim()) {
            return "El email es requerido";
          }
          if (!/\S+@\S+\.\S+/.test(strValue)) {
            return "El email no es válido";
          }
          return null;
        },
      },
      {
        name: "usuario",
        label: "Usuario",
        type: "text",
        icon: UserPlus,
        required: true,
        placeholder: "Nombre de usuario",
        validation: (value: string | number) =>
          typeof value === "string" && !value.trim()
            ? "El usuario es requerido"
            : null,
      },
      {
        name: "password",
        label: "Contraseña",
        type: "password",
        icon: Lock,
        required: true,
        placeholder: "Ingrese contraseña",
        validation: (value: string | number) => {
          const strValue = String(value);
          if (!strValue) {
            return "La contraseña es requerida";
          }
          if (strValue.length < 6) {
            return "La contraseña debe tener al menos 6 caracteres";
          }
          return null;
        },
      },
      {
        name: "password2",
        label: "Confirmar Contraseña",
        type: "password",
        icon: Lock,
        required: true,
        placeholder: "Confirme contraseña",
        validation: (value: string | number, allData?: Record<string, any>) => {
          const strValue = String(value);
          if (!strValue) {
            return "Debe confirmar la contraseña";
          }
          if (!allData) {
            return null;
          }
          if (strValue !== allData.password) {
            return "Las contraseñas no coinciden";
          }
          return null;
        },
      },
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      try {
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

          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error("Error inesperado:", error);

        if (!error.message.includes("Error al registrar usuario")) {
          Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: "Ocurrió un error al registrar el usuario. Por favor, intente nuevamente.",
            confirmButtonColor: "#667eea",
          });
        }

        throw error;
      }
    },

    // --- Configuración de Botones ---
    submitButtonText: "Registrar Usuario",
    resetButtonText: "Limpiar Formulario",
    showResetButton: true,
  };

  return <FormularioReutilizable config={formConfig} />;
}
