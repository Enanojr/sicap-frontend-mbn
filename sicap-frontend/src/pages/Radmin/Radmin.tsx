import { registerUser } from "../../services/Radmin.service";
import Swal from "sweetalert2";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import FormularioReutilizable from "../../components/forms/form"; // Asegúrate que la ruta sea correcta
import type { FormConfig } from "../../components/forms/form"; // Asegúrate que la ruta sea correcta

export default function RegisterAdmin() {
  // --- Funciones de Validación Específicas ---

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

  // Asumimos que tu componente reutilizable pasa todos los datos del formulario
  // a la función de validación para poder comparar campos.
  const validatePassword2 = (
  value: string,
  allData?: Record<string, any> // <-- AÑADE EL '?' AQUÍ
): string | null => {
  if (!value) {
    return "Debe confirmar la contraseña";
  }

  // Como 'allData' ahora es opcional (allData?), 
  // TypeScript nos pide que comprobemos si existe antes de usarlo.
  if (!allData) {
    return null; // No podemos comparar si no tenemos los demás datos
  }

  if (value !== allData.password) {
    return "Las contraseñas no coinciden";
  }
  
  return null;
};

  // --- Configuración del Formulario ---

  const formConfig: FormConfig = {
    title: "Registro de Admin",
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
        type: "email", // 'email' es más semántico que 'text'
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
        name: "role",
        label: "Rol",
        type: "select",
        icon: User,
        required: true,
        options: [
          // El placeholder se maneja con 'placeholder'
          { value: "admin", label: "Admin" },
          { value: "supervisor", label: "Supervisor" },
        ],
        placeholder: "Seleccione un rol",
        validation: (value: string) =>
          !value ? "Debe seleccionar un rol" : null,
      },
      {
        name: "password",
        label: "Contraseña",
        type: "password", // El tipo 'password' debería activar el toggle de visibilidad
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
        validation: validatePassword2, // Usamos la validación especial
      },
    ],

    // --- Lógica de Envío ---
    onSubmit: async (data) => {
      // El componente reutilizable ya hizo la validación de campos
      try {
        // El 'data' que llega aquí es el 'formData' validado
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
          // El formulario reutilizable debería limpiarse solo si la promesa se resuelve
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

    // Usamos Swal para los mensajes, por lo que no necesitamos
    // los mensajes genéricos del formulario.
    // successMessage: "¡Usuario registrado exitosamente!",
    // errorMessage: "Error al registrar el usuario. Intente nuevamente.",
  };

  // El renderizado es mucho más simple.
  // No necesitamos el 'loading' state aquí, el formulario reutilizable lo maneja.
  // No necesitamos el 'useEffect' para cargar datos, como en Pagos.
  return <FormularioReutilizable config={formConfig} />;
}