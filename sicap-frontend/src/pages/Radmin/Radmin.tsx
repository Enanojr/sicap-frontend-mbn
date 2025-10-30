import React, { useState } from "react";
import { registerUser } from "../../services/Radmin.service";
import { Botones } from "../../components/botones/Botones";
import Swal from "sweetalert2";
import "../../styles/styles.css";
import { Eye, EyeOff } from "lucide-react";

interface FormData {
  nombre: string;
  apellidos: string;
  email: string;
  usuario: string;
  password: string;
  password2: string;
  role: string;
}

interface FormErrors {
  nombre?: string;
  apellidos?: string;
  email?: string;
  usuario?: string;
  password?: string;
  password2?: string;
  role?: string;
  general?: string;
}

export default function RegisterAdmin() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    email: "",
    usuario: "",
    password: "",
    password2: "",
    role: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPassword2, setShowPassword2] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "Los apellidos son requeridos";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.usuario.trim()) {
      newErrors.usuario = "El usuario es requerido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.password2) {
      newErrors.password2 = "Debe confirmar la contraseña";
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = "Las contraseñas no coinciden";
    }

    if (!formData.role) {
      newErrors.role = "Debe seleccionar un rol";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Mostrar primer error encontrado
      const firstError = Object.values(newErrors)[0];
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: firstError,
        confirmButtonColor: "#667eea",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(formData);

      if (result.success) {
        // Limpiar formulario
        setFormData({
          nombre: "",
          apellidos: "",
          email: "",
          usuario: "",
          password: "",
          password2: "",
          role: "",
        });
        setErrors({});

        // Mostrar éxito con SweetAlert
        Swal.fire({
          icon: "success",
          title: "¡Registro exitoso!",
          text: "El usuario ha sido registrado correctamente",
          confirmButtonColor: "#667eea",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        // Manejar errores del servidor
        let errorMessage = "Error al registrar usuario";

        if (result.errors) {
          // Si hay errores específicos de campos
          if (typeof result.errors === "object") {
            // Mostrar el primer error
            const firstErrorKey = Object.keys(result.errors)[0];
            const firstErrorValue = result.errors[firstErrorKey];

            errorMessage = Array.isArray(firstErrorValue)
              ? firstErrorValue[0]
              : firstErrorValue;

            // Actualizar errores en el formulario
            setErrors(result.errors);
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
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "Ocurrió un error al registrar el usuario. Por favor, intente nuevamente.",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      nombre: "",
      apellidos: "",
      email: "",
      usuario: "",
      password: "",
      password2: "",
      role: "",
    });
    setErrors({});
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        <h2 className="register-title">
          <span className="register-title-gradient">REGISTRO DE ADMIN</span>
        </h2>
        <div className="register-divider"></div>

        <div className="register-form-container">
          <div className="register-form-grid">
            {/* Nombre */}
            <div className="form-field">
              <label className="form-label">Nombre *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese el nombre"
                />
              </div>
              {errors.nombre && (
                <span className="form-error">{errors.nombre}</span>
              )}
            </div>

            {/* Apellidos */}
            <div className="form-field">
              <label className="form-label">Apellidos *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese los apellidos"
                />
              </div>
              {errors.apellidos && (
                <span className="form-error">{errors.apellidos}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-field">
              <label className="form-label">Email *</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            {/* Usuario */}
            <div className="form-field">
              <label className="form-label">Usuario *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nombre de usuario"
                />
              </div>
              {errors.usuario && (
                <span className="form-error">{errors.usuario}</span>
              )}
            </div>

            {/* Rol */}
            <div className="form-field">
              <label className="form-label">Rol *</label>
              <div className="input-wrapper">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input form-select"
                >
                  <option value="">Seleccione un rol</option>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              {errors.role && (
                <span className="form-error">{errors.role}</span>
              )}
            </div>

            {/* Contraseña */}
            <div className="form-field">
              <label className="form-label">Contraseña *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="form-field">
              <label className="form-label">Confirmar Contraseña *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword2 ? "text" : "password"}
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirme contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="password-toggle"
                >
                  {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password2 && (
                <span className="form-error">{errors.password2}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <Botones
              onClick={handleClear}
              style={{ backgroundColor: "white", color: "black", opacity: 0.7 }}
              disabled={loading}
            >
              Limpiar
            </Botones>
            <Botones onClick={handleSubmit} disabled={loading}>
              {loading ? "Registrando..." : "Registrar Usuario"}
            </Botones>
          </div>
        </div>
      </div>
    </div>
  );
}