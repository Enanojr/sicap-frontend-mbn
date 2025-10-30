import React, { useState, useEffect } from "react";
import { User, MapPin, Calendar } from "lucide-react";
import { registerAsignacion } from "../../services/Asignaciones.service";
import { getCobradores } from "../../services/Rcobradores.service";
import { getSectores } from "../../services/Rsector.service";
import { Botones } from "../../components/botones/Botones";
import Swal from "sweetalert2";
import "../../styles/styles.css";

interface FormData {
  cobrador: string;
  sector: string;
  fecha_asignacion: string;
}

interface FormErrors {
  cobrador?: string;
  sector?: string;
  fecha_asignacion?: string;
  general?: string;
}

interface Cobrador {
  id?: number;
  id_usuario?: number;
  nombre: string;
  apellidos: string;
  usuario?: string;
}

interface Sector {
  id?: number;
  id_sector?: number;
  nombre_sector: string;
  descripcion?: string;
}

export default function RegisterAsignacion() {
  const [formData, setFormData] = useState<FormData>({
    cobrador: "",
    sector: "",
    fecha_asignacion: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loadingCobradores, setLoadingCobradores] = useState<boolean>(true);
  const [loadingSectores, setLoadingSectores] = useState<boolean>(true);

  // Cargar cobradores y sectores al montar el componente
  useEffect(() => {
    loadCobradores();
    loadSectores();
  }, []);

  const loadCobradores = async () => {
    setLoadingCobradores(true);
    try {
      const result = await getCobradores();
      if (result.success) {
        // Manejar respuesta paginada
        const cobradoresData = result.data.results || result.data;
        if (Array.isArray(cobradoresData)) {
          setCobradores(cobradoresData);
        } else {
          console.error("Formato de datos inesperado:", result.data);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Formato de datos de cobradores incorrecto",
            confirmButtonColor: "#667eea",
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.errors?.general || "No se pudieron cargar los cobradores",
          confirmButtonColor: "#667eea",
        });
      }
    } catch (error) {
      console.error("Error al cargar cobradores:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los cobradores",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoadingCobradores(false);
    }
  };

  const loadSectores = async () => {
    setLoadingSectores(true);
    try {
      const result = await getSectores();
      if (result.success) {
        // Manejar respuesta paginada
        const sectoresData = result.data.results || result.data;
        if (Array.isArray(sectoresData)) {
          setSectores(sectoresData);
        } else {
          console.error("Formato de datos inesperado:", result.data);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Formato de datos de sectores incorrecto",
            confirmButtonColor: "#667eea",
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.errors?.general || "No se pudieron cargar los sectores",
          confirmButtonColor: "#667eea",
        });
      }
    } catch (error) {
      console.error("Error al cargar sectores:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los sectores",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoadingSectores(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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

    if (!formData.cobrador) {
      newErrors.cobrador = "El cobrador es requerido";
    }

    if (!formData.sector) {
      newErrors.sector = "El sector es requerido";
    }

    if (!formData.fecha_asignacion) {
      newErrors.fecha_asignacion = "La fecha de asignación es requerida";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

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
      const result = await registerAsignacion({
        cobrador: Number(formData.cobrador),
        sector: Number(formData.sector),
        fecha_asignacion: formData.fecha_asignacion,
      });

      if (result.success) {
        setFormData({
          cobrador: "",
          sector: "",
          fecha_asignacion: "",
        });
        setErrors({});

        Swal.fire({
          icon: "success",
          title: "¡Registro exitoso!",
          text: "La asignación ha sido registrada correctamente",
          confirmButtonColor: "#667eea",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        let errorMessage = "Error al registrar asignación";

        if (result.errors) {
          if (typeof result.errors === "object") {
            const firstErrorKey = Object.keys(result.errors)[0];
            const firstErrorValue = result.errors[firstErrorKey];

            errorMessage = Array.isArray(firstErrorValue)
              ? firstErrorValue[0]
              : firstErrorValue;

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
        text: "Ocurrió un error al registrar la asignación. Por favor, intente nuevamente.",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      cobrador: "",
      sector: "",
      fecha_asignacion: "",
    });
    setErrors({});
  };

  // Obtener fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="register-page-container-sector">
      <div className="register-card-sector">
        <h2 className="register-title-sector">
          <span className="register-title-gradient">
            REGISTRO DE ASIGNACIONES
          </span>
        </h2>
        <div className="register-divider-sector"></div>

        <div className="register-form-container-sector">
          <div className="register-form-grid">
            {/* Cobrador - Select */}
            <div className="form-field">
              <label className="form-label">Cobrador *</label>
              <div className="input-wrapper">
                <select
                  name="cobrador"
                  value={formData.cobrador}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loadingCobradores}
                >
                  <option value="">
                    {loadingCobradores
                      ? "Cargando cobradores..."
                      : "Seleccione un cobrador"}
                  </option>
                  {cobradores.map((cobrador) => (
                    <option 
                      key={cobrador.id || cobrador.id_usuario} 
                      value={cobrador.id || cobrador.id_usuario}
                    >
                      {cobrador.nombre} {cobrador.apellidos}
                      {cobrador.usuario && ` (@${cobrador.usuario})`}
                    </option>
                  ))}
                </select>
              </div>
              {errors.cobrador && (
                <span className="form-error">{errors.cobrador}</span>
              )}
            </div>

            {/* Sector - Select */}
            <div className="form-field">
              <label className="form-label">Sector *</label>
              <div className="input-wrapper">
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loadingSectores}
                >
                  <option value="">
                    {loadingSectores
                      ? "Cargando sectores..."
                      : "Seleccione un sector"}
                  </option>
                  {sectores.map((sector) => (
                    <option 
                      key={sector.id || sector.id_sector} 
                      value={sector.id || sector.id_sector}
                    >
                      {sector.nombre_sector}
                      {sector.descripcion && ` - ${sector.descripcion}`}
                    </option>
                  ))}
                </select>
              </div>
              {errors.sector && (
                <span className="form-error">{errors.sector}</span>
              )}
            </div>

            {/* Fecha de Asignación */}
            <div className="form-field">
              <label className="form-label">Fecha de Asignación *</label>
              <div className="input-wrapper">
                <input
                  type="date"
                  name="fecha_asignacion"
                  value={formData.fecha_asignacion}
                  onChange={handleChange}
                  className="form-input"
                  min={getTodayDate()}
                />
              </div>
              {errors.fecha_asignacion && (
                <span className="form-error">{errors.fecha_asignacion}</span>
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
            <Botones onClick={handleSubmit} disabled={loading || loadingCobradores || loadingSectores}>
              {loading ? "Registrando..." : "Registrar Asignación"}
            </Botones>
          </div>
        </div>
      </div>
    </div>
  );
}