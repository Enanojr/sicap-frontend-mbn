import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { createTransaccion } from "../../services/egresos.service";
import "../../styles/styles.css";

type FormEgresoData = {
  concepto: string;
  fecha: string;
  requisitor: string;
  monto: number;
  presupuesto_base: number;
  observaciones: string;
  comprobante: File | null;
  cuenta: number;
};

interface FormularioEgresosProps {
  onSuccess?: () => void;
}

const FormularioEgresos: React.FC<FormularioEgresosProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialState: FormEgresoData = {
    concepto: "",
    fecha: new Date().toISOString().split("T")[0],
    requisitor: "",
    monto: 0,
    presupuesto_base: 5800,
    observaciones: "",
    comprobante: null,
    cuenta: 1,
  };

  const [formEgreso, setFormEgreso] = useState<FormEgresoData>(initialState);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormEgreso((prev) => ({
      ...prev,
      [name]:
        name === "monto" || name === "presupuesto_base" || name === "cuenta"
          ? parseFloat(value) || 0
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const procesarArchivo = (file: File) => {
    const esImagen = file.type.startsWith("image/");
    const esPdf = file.type === "application/pdf";

    if (!esImagen && !esPdf) {
      Swal.fire({
        icon: "warning",
        title: "Archivo no válido",
        text: "Solo se permiten imágenes y archivos PDF.",
        confirmButtonColor: "#4fa3e3",
      });
      return;
    }

    if (comprobantePreview) {
      URL.revokeObjectURL(comprobantePreview);
    }

    const preview = esImagen ? URL.createObjectURL(file) : null;
    setComprobantePreview(preview);
    setFormEgreso((prev) => ({ ...prev, comprobante: file }));

    if (errors.comprobante) {
      setErrors((prev) => ({ ...prev, comprobante: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDragging(false);
    }
  };

  const removeComprobante = () => {
    if (comprobantePreview) {
      URL.revokeObjectURL(comprobantePreview);
    }

    setComprobantePreview(null);
    setFormEgreso((prev) => ({ ...prev, comprobante: null }));
  };

  const limpiarFormulario = () => {
    if (comprobantePreview) {
      URL.revokeObjectURL(comprobantePreview);
    }

    setComprobantePreview(null);
    setFormEgreso({
      ...initialState,
      fecha: new Date().toISOString().split("T")[0],
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formEgreso.fecha) {
      newErrors.fecha = "La fecha es obligatoria.";
    }

    if (!formEgreso.monto || formEgreso.monto <= 0) {
      newErrors.monto = "El total a pagar debe ser mayor a 0.";
    }

    if (formEgreso.monto > formEgreso.presupuesto_base) {
      newErrors.monto =
        "El total a pagar no puede ser mayor al presupuesto disponible.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getBackendErrorMessage = (error: any) => {
    const data = error?.response?.data;

    if (!data) {
      return "No se pudo registrar el egreso.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail && typeof data.detail === "string") {
      return data.detail;
    }

    if (data.message && typeof data.message === "string") {
      return data.message;
    }

    if (typeof data === "object") {
      const mensajes = Object.entries(data)
        .flatMap(([campo, valor]) => {
          if (Array.isArray(valor)) {
            return valor.map((msg) => `${campo}: ${msg}`);
          }

          if (typeof valor === "string") {
            return [`${campo}: ${valor}`];
          }

          return [];
        })
        .filter(Boolean);

      if (mensajes.length > 0) {
        return mensajes.join("\n");
      }
    }

    return "No se pudo registrar el egreso.";
  };

  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      await createTransaccion({
        tipo: "egreso",
        monto: formEgreso.monto,
        fecha: formEgreso.fecha,
        observaciones:
          formEgreso.observaciones.trim() ||
          formEgreso.concepto.trim() ||
          undefined,
        comprobante: formEgreso.comprobante ?? undefined,
        requisitor: formEgreso.requisitor.trim() || undefined,
        cuenta: formEgreso.cuenta,
      });

      Swal.fire({
        icon: "success",
        title: "Egreso registrado",
        text: "El egreso se ha guardado correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      limpiarFormulario();
      onSuccess?.();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: getBackendErrorMessage(error),
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (comprobantePreview) {
        URL.revokeObjectURL(comprobantePreview);
      }
    };
  }, [comprobantePreview]);

  return (
    <div className="cm-container">
      <div className="cm-top-section cm-top-section-egreso">
        <div className="cm-card cm-form-card cm-egreso-mode cm-egreso-wide">
          <h3>Registrar Egreso</h3>

          <form onSubmit={handleSubmitEgreso}>
            <div className="cm-form-row">
              <div className="cm-form-group">
                <label>Concepto</label>
                <input
                  type="text"
                  name="concepto"
                  value={formEgreso.concepto}
                  onChange={handleChange}
                  placeholder="Reparaciones"
                />
              </div>

              <div className="cm-form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formEgreso.fecha}
                  onChange={handleChange}
                  className={errors.fecha ? "cm-input-error" : ""}
                />
                {errors.fecha && (
                  <span className="cm-error-msg">{errors.fecha}</span>
                )}
              </div>
            </div>

            <div className="cm-form-row">
              <div className="cm-form-group">
                <label>Requisitor del gasto</label>
                <input
                  type="text"
                  name="requisitor"
                  value={formEgreso.requisitor}
                  onChange={handleChange}
                  placeholder="Nombre del requisitor"
                />
              </div>

              <div className="cm-form-group">
                <label>Monto a retirar</label>
                <input
                  type="number"
                  step="0.01"
                  name="monto"
                  value={formEgreso.monto || ""}
                  onChange={handleChange}
                  placeholder="1200.00"
                  className={`cm-input-money ${
                    errors.monto ? "cm-input-error" : ""
                  }`}
                />
                {errors.monto && (
                  <span className="cm-error-msg">{errors.monto}</span>
                )}
              </div>
            </div>

            <div className="cm-form-group">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={formEgreso.observaciones}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="cm-form-group">
              <label>Comprobante</label>

              {!formEgreso.comprobante ? (
                <div
                  className={`cm-upload-dropzone ${
                    dragging ? "cm-upload-dropzone-active" : ""
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="cm-upload-dropzone-content">
                    <div className="cm-upload-dropzone-icon">⇧</div>
                    <div className="cm-upload-dropzone-title">
                      Arrastra el comprobante aquí
                    </div>
                    <div className="cm-upload-dropzone-subtitle">
                      o{" "}
                      <span className="cm-upload-dropzone-link">
                        cárgalo desde tu computadora
                      </span>
                    </div>
                    <div className="cm-upload-dropzone-hint">
                      Imagen o PDF · máx. 1 archivo
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="cm-file-card">
                  <div className="cm-file-preview">
                    {comprobantePreview ? (
                      <img
                        src={comprobantePreview}
                        alt={formEgreso.comprobante.name}
                        className="cm-file-image"
                      />
                    ) : (
                      <div className="cm-file-pdf">PDF</div>
                    )}
                  </div>

                  <div className="cm-file-info">
                    <span
                      className="cm-file-name"
                      title={formEgreso.comprobante.name}
                    >
                      {formEgreso.comprobante.name}
                    </span>
                    <span className="cm-file-size">
                      {(formEgreso.comprobante.size / 1024 / 1024).toFixed(2)}{" "}
                      MB
                    </span>
                  </div>

                  <div className="cm-file-actions">
                    {comprobantePreview ? (
                      <a
                        href={comprobantePreview}
                        target="_blank"
                        rel="noreferrer"
                        className="cm-file-action-btn"
                      >
                        Ver
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="cm-file-action-btn"
                        onClick={() =>
                          window.open(
                            URL.createObjectURL(formEgreso.comprobante!),
                            "_blank",
                          )
                        }
                      >
                        Abrir
                      </button>
                    )}

                    <button
                      type="button"
                      className="cm-file-remove-btn"
                      onClick={removeComprobante}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="cm-egreso-actions">
              <button
                type="button"
                className="cm-btn cm-btn-secondary"
                onClick={limpiarFormulario}
                disabled={loading}
              >
                Limpiar formulario
              </button>

              <button
                type="submit"
                className="cm-btn cm-btn-warning"
                disabled={loading}
              >
                {loading ? "Registrando..." : "Registrar egreso"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioEgresos;
