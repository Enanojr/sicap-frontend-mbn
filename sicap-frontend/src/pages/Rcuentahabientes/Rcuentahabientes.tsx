import React, { useState, useEffect } from "react";
import { User, Phone, Home, MapPin, FileText, Briefcase } from "lucide-react";
import { registerCuentahabiente } from "../../services/Rcuentahabientes.service";
import { getColonias } from "../../services/Rcolonias.service";
import Swal from "sweetalert2";
import "../../styles/styles.css";

// Importamos la función y la interfaz de tu nuevo servicio
import { getAllServicios } from "../../services/servicios.service";
import { type ServicioResponse } from "../../services/servicios.service";
import { Botones } from "../../components/botones/Botones";


interface FormData {
  numero_contrato: string;
  nombres: string;
  ap: string;
  am: string;
  calle: string;
  numero: string;
  telefono: string;
  colonia: string;
  servicio: string;
}

interface FormErrors {
  numero_contrato?: string;
  nombres?: string;
  ap?: string;
  am?: string;
  calle?: string;
  numero?: string;
  telefono?: string;
  colonia?: string;
  servicio?: string;
}

interface Colonia {
  id_colonia: number;
  nombre_colonia: string;
  codigo_postal: number;
}

// Usamos la interfaz importada de tu servicio
interface Servicio extends ServicioResponse {}


export default function RegisterCuentahabiente() {
  const [formData, setFormData] = useState<FormData>({
    numero_contrato: "",
    nombres: "",
    ap: "",
    am: "",
    calle: "",
    numero: "",
    telefono: "",
    colonia: "",
    servicio: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  const [colonias, setColonias] = useState<Colonia[]>([]);
  const [loadingColonias, setLoadingColonias] = useState<boolean>(true);

  // Usamos la nueva interfaz de Servicio
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState<boolean>(true);


  // Cargar colonias y servicios al montar el componente
  useEffect(() => {
    loadColonias();
    loadServicios(); 
  }, []);

  const loadColonias = async () => {
    setLoadingColonias(true);
    try {
      const result = await getColonias();
      if (result.success) {
        // Manejar respuesta paginada
        const coloniasData = result.data.results || result.data;
        if (Array.isArray(coloniasData)) {
          setColonias(coloniasData);
        } else {
          console.error("Formato de datos inesperado:", result.data);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Formato de datos de colonias incorrecto",
            confirmButtonColor: "#667eea",
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.errors?.general || "No se pudieron cargar las colonias",
          confirmButtonColor: "#667eea",
        });
      }
    } catch (error) {
      console.error("Error al cargar colonias:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar las colonias",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoadingColonias(false);
    }
  };

  // Adaptamos esta función a como funciona tu nuevo servicio
  const loadServicios = async () => {
    setLoadingServicios(true);
    try {
      // Tu nueva función 'getAllServicios' devuelve los datos directamente
      // o lanza un error si algo sale mal.
      const serviciosData = await getAllServicios();

      // Verificamos si la respuesta es paginada (como en colonias) o un array directo
      const data = (serviciosData as any).results || serviciosData;

      if (Array.isArray(data)) {
        setServicios(data);
      } else {
        console.error("Formato de datos inesperado:", serviciosData);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Formato de datos de servicios incorrecto",
          confirmButtonColor: "#667eea",
        });
      }
    } catch (error: any) {
      // Atrapamos el error que 'getAllServicios' lanzó
      console.error("Error al cargar servicios:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Error al cargar los servicios", // Mostramos el mensaje del error
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoadingServicios(false);
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

    if (!formData.numero_contrato.trim()) {
      newErrors.numero_contrato = "El número de contrato es requerido";
    } else if (isNaN(Number(formData.numero_contrato))) {
      newErrors.numero_contrato = "El número de contrato debe ser numérico";
    }

    if (!formData.nombres.trim()) {
      newErrors.nombres = "El nombre es requerido";
    }

    if (!formData.ap.trim()) {
      newErrors.ap = "El apellido paterno es requerido";
    }

    if (!formData.am.trim()) {
      newErrors.am = "El apellido materno es requerido";
    }

    if (!formData.calle.trim()) {
      newErrors.calle = "La calle es requerida";
    }

    if (!formData.numero.trim()) {
      newErrors.numero = "El número es requerido";
    } else if (isNaN(Number(formData.numero))) {
      newErrors.numero = "El número debe ser numérico";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (!/^\d{10}$/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono debe tener 10 dígitos";
    }

    if (!formData.colonia) {
      newErrors.colonia = "La colonia es requerida";
    }

    if (!formData.servicio) {
      newErrors.servicio = "El servicio es requerido";
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
      const result = await registerCuentahabiente({
        numero_contrato: Number(formData.numero_contrato),
        nombres: formData.nombres,
        ap: formData.ap,
        am: formData.am,
        calle: formData.calle,
        numero: Number(formData.numero),
        telefono: formData.telefono,
        colonia: Number(formData.colonia),
        servicio: Number(formData.servicio),
      });

      if (result.success) {
        setFormData({
          numero_contrato: "",
          nombres: "",
          ap: "",
          am: "",
          calle: "",
          numero: "",
          telefono: "",
          colonia: "",
          servicio: "",
        });
        setErrors({});

        Swal.fire({
          icon: "success",
          title: "¡Registro exitoso!",
          text: "El cuentahabiente ha sido registrado correctamente",
          confirmButtonColor: "#667eea",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
         let errorMessage = "Error al registrar cuentahabiente";

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
        text: "Ocurrió un error al registrar el cuentahabiente. Por favor, intente nuevamente.",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      numero_contrato: "",
      nombres: "",
      ap: "",
      am: "",
      calle: "",
      numero: "",
      telefono: "",
      colonia: "",
      servicio: "",
    });
    setErrors({});
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        <h2 className="register-title">
          <span className="register-title-gradient">
            REGISTRO DE CUENTAHABIENTES
          </span>
        </h2>
        <div className="register-divider"></div>

        <div className="register-form-container">
          <div className="register-form-grid">
            {/* Número de Contrato */}
            <div className="form-field">
              <label className="form-label">Número de Contrato *</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  name="numero_contrato"
                  value={formData.numero_contrato}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese el número de contrato"
                />
              </div>
              {errors.numero_contrato && (
                <span className="form-error">{errors.numero_contrato}</span>
              )}
            </div>

            {/* Nombres */}
            <div className="form-field">
              <label className="form-label">Nombre(s) *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese el nombre"
                />
              </div>
              {errors.nombres && (
                <span className="form-error">{errors.nombres}</span>
              )}
            </div>

            {/* Apellido Paterno */}
            <div className="form-field">
              <label className="form-label">Apellido Paterno *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="ap"
                  value={formData.ap}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese el apellido paterno"
                />
              </div>
              {errors.ap && <span className="form-error">{errors.ap}</span>}
            </div>

            {/* Apellido Materno */}
            <div className="form-field">
              <label className="form-label">Apellido Materno *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="am"
                  value={formData.am}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese el apellido materno"
                />
              </div>
              {errors.am && <span className="form-error">{errors.am}</span>}
            </div>

            {/* Calle */}
            <div className="form-field">
              <label className="form-label">Calle *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="calle"
                  value={formData.calle}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingrese la calle"
                />
              </div>
              {errors.calle && (
                <span className="form-error">{errors.calle}</span>
              )}
            </div>

            {/* Número */}
            <div className="form-field">
              <label className="form-label">Número *</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Número de domicilio"
                />
              </div>
              {errors.numero && (
                <span className="form-error">{errors.numero}</span>
              )}
            </div>

            {/* Teléfono */}
            <div className="form-field">
              <label className="form-label">Teléfono *</label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="10 dígitos"
                  maxLength={10}
                />
              </div>
              {errors.telefono && (
                <span className="form-error">{errors.telefono}</span>
              )}
            </div>

            {/* Colonia - Select */}
            <div className="form-field">
              <label className="form-label">Colonia *</label>
              <div className="input-wrapper">
                <select
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loadingColonias}
                >
                  <option value="">
                    {loadingColonias
                      ? "Cargando colonias..."
                      : "Seleccione una colonia"}
                  </option>
                  {colonias.map((colonia) => (
                    <option key={colonia.id_colonia} value={colonia.id_colonia}>
                      {colonia.nombre_colonia} CP: {colonia.codigo_postal}
                    </option>
                  ))}
                </select>
              </div>
              {errors.colonia && (
                <span className="form-error">{errors.colonia}</span>
              )}
            </div>

            {/* Campo para Servicio */}
            <div className="form-field">
              <label className="form-label">Servicio *</label>
              <div className="input-wrapper">
                <select
                  name="servicio"
                  value={formData.servicio}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loadingServicios}
                >
                  <option value="">
                    {loadingServicios
                      ? "Cargando servicios..."
                      : "Seleccione un servicio"}
                  </option>
                  {/* Actualizamos para usar 'id_servicio' y 'nombre' de tu interfaz ServicioResponse */}
                  {servicios.map((servicio) => (
                    <option key={servicio.id_tipo_servicio} value={servicio.id_tipo_servicio}>
                      {servicio.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {errors.servicio && (
                <span className="form-error">{errors.servicio}</span>
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
            <Botones
              onClick={handleSubmit}
              disabled={loading || loadingColonias || loadingServicios}
            >
              {loading ? "Registrando..." : "Registrar Cuentahabiente"}
            </Botones>
          </div>
        </div>
      </div>
    </div>
  );
}