import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "../../styles/styles.css";

type ArchivoAdjunto = {
  file: File;
  preview: string | null;
  tipo: "imagen" | "pdf";
};

type FormEgresoData = {
  concepto: string;
  fecha: string;
  requisitor_gasto: string;
  total_pagar: number;
  presupuesto_base: number;
  observaciones: ArchivoAdjunto[];
};

const MAX_ARCHIVOS = 4;
const TIPOS_PERMITIDOS = ["image/", "application/pdf"];

const EgresosManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formEgreso, setFormEgreso] = useState<FormEgresoData>({
    concepto: "",
    fecha: new Date().toISOString().split("T")[0],
    requisitor_gasto: "",
    total_pagar: 0,
    presupuesto_base: 5800,
    observaciones: [],
  });

  const presupuestoRestante = useMemo(() => {
    return formEgreso.presupuesto_base - formEgreso.total_pagar;
  }, [formEgreso.presupuesto_base, formEgreso.total_pagar]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormEgreso((prev) => ({
      ...prev,
      [name]:
        name === "total_pagar" || name === "presupuesto_base"
          ? parseFloat(value) || 0
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const crearAdjuntos = (files: File[]): ArchivoAdjunto[] => {
    return files
      .filter((file) =>
        TIPOS_PERMITIDOS.some((tipo) =>
          tipo.endsWith("/") ? file.type.startsWith(tipo) : file.type === tipo,
        ),
      )
      .map((file) => {
        const esImagen = file.type.startsWith("image/");
        const esPdf = file.type === "application/pdf";

        return {
          file,
          preview: esImagen ? URL.createObjectURL(file) : null,
          tipo: esImagen ? "imagen" : esPdf ? "pdf" : "pdf",
        };
      });
  };

  const agregarArchivos = (files: File[]) => {
    if (!files.length) return;

    const nuevosAdjuntos = crearAdjuntos(files);

    if (!nuevosAdjuntos.length) {
      Swal.fire({
        icon: "warning",
        title: "Archivo no válido",
        text: "Solo se permiten imágenes y archivos PDF.",
        confirmButtonColor: "#d48a1f",
      });
      return;
    }

    setFormEgreso((prev) => {
      const disponibles = MAX_ARCHIVOS - prev.observaciones.length;

      if (disponibles <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Límite alcanzado",
          text: `Solo puedes adjuntar hasta ${MAX_ARCHIVOS} archivos.`,
          confirmButtonColor: "#d48a1f",
        });
        return prev;
      }

      const archivosFinales = [
        ...prev.observaciones,
        ...nuevosAdjuntos.slice(0, disponibles),
      ];

      if (nuevosAdjuntos.length > disponibles) {
        Swal.fire({
          icon: "info",
          title: "Solo se agregaron algunos archivos",
          text: `El límite máximo es de ${MAX_ARCHIVOS} archivos.`,
          confirmButtonColor: "#d48a1f",
        });
      }

      return {
        ...prev,
        observaciones: archivosFinales,
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    agregarArchivos(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    agregarArchivos(files);
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

  const removeArchivo = (index: number) => {
    setFormEgreso((prev) => {
      const archivo = prev.observaciones[index];
      if (archivo?.preview) {
        URL.revokeObjectURL(archivo.preview);
      }

      return {
        ...prev,
        observaciones: prev.observaciones.filter((_, i) => i !== index),
      };
    });
  };

  const limpiarFormulario = () => {
    formEgreso.observaciones.forEach((archivo) => {
      if (archivo.preview) URL.revokeObjectURL(archivo.preview);
    });

    setFormEgreso({
      concepto: "",
      fecha: new Date().toISOString().split("T")[0],
      requisitor_gasto: "",
      total_pagar: 0,
      presupuesto_base: 5800,
      observaciones: [],
    });

    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formEgreso.concepto.trim()) {
      newErrors.concepto = "El concepto es obligatorio.";
    }

    if (!formEgreso.fecha) {
      newErrors.fecha = "La fecha es obligatoria.";
    }

    if (!formEgreso.requisitor_gasto.trim()) {
      newErrors.requisitor_gasto = "El requisitor del gasto es obligatorio.";
    }

    if (!formEgreso.total_pagar || formEgreso.total_pagar <= 0) {
      newErrors.total_pagar = "El total a pagar debe ser mayor a 0.";
    }

    if (formEgreso.total_pagar > formEgreso.presupuesto_base) {
      newErrors.total_pagar =
        "El total a pagar no puede ser mayor al presupuesto disponible.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("concepto", formEgreso.concepto);
      formData.append("fecha", formEgreso.fecha);
      formData.append("requisitor_gasto", formEgreso.requisitor_gasto);
      formData.append("total_pagar", String(formEgreso.total_pagar));
      formData.append("presupuesto_base", String(formEgreso.presupuesto_base));

      formEgreso.observaciones.forEach((archivo) => {
        formData.append("observaciones", archivo.file);
      });

      // Aquí conectas tu servicio real
      // const res = await registrarEgreso(formData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      Swal.fire({
        icon: "success",
        title: "Egreso registrado",
        text: "El egreso se ha guardado correctamente.",
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: "#d48a1f",
      });

      limpiarFormulario();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo conectar con el servidor.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      formEgreso.observaciones.forEach((archivo) => {
        if (archivo.preview) {
          URL.revokeObjectURL(archivo.preview);
        }
      });
    };
  }, [formEgreso.observaciones]);

  return (
    <div className="cm-container">
      <div className="cm-top-section cm-top-section-egreso">
        <div className="cm-card cm-form-card cm-egreso-mode cm-egreso-wide">
          <h3>Registrar Egresos</h3>

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
                  className={errors.concepto ? "cm-input-error" : ""}
                />
                {errors.concepto && (
                  <span className="cm-error-msg">{errors.concepto}</span>
                )}
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
                  name="requisitor_gasto"
                  value={formEgreso.requisitor_gasto}
                  onChange={handleChange}
                  placeholder="Nombre del Requisitor"
                  className={errors.requisitor_gasto ? "cm-input-error" : ""}
                />
                {errors.requisitor_gasto && (
                  <span className="cm-error-msg">
                    {errors.requisitor_gasto}
                  </span>
                )}
              </div>

              <div className="cm-form-group">
                <label>Total a pagar</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_pagar"
                  value={formEgreso.total_pagar || ""}
                  onChange={handleChange}
                  placeholder="1200.00"
                  className={`cm-input-money ${errors.total_pagar ? "cm-input-error" : ""}`}
                />
                {errors.total_pagar && (
                  <span className="cm-error-msg">{errors.total_pagar}</span>
                )}
              </div>
            </div>

            <div className="cm-form-group">
              <label>Presupuesto</label>
              <div className="cm-presupuesto-inline">
                <span className="cm-presupuesto-base">
                  $
                  {formEgreso.presupuesto_base.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

                <span className="cm-presupuesto-descuento">
                  - $
                  {formEgreso.total_pagar.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

                <span
                  className={`cm-presupuesto-restante ${
                    presupuestoRestante < 0 ? "cm-presupuesto-negative" : ""
                  }`}
                >
                  = $
                  {presupuestoRestante.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="cm-form-group">
              <label>Observaciones</label>

              <div
                className={`cm-upload-dropzone ${dragging ? "cm-upload-dropzone-active" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onClick={() =>
                  document.getElementById("archivos-egreso")?.click()
                }
              >
                <div className="cm-upload-dropzone-content">
                  <div className="cm-upload-dropzone-icon">⇧</div>

                  <div className="cm-upload-dropzone-title">
                    Arrastra archivos aquí
                  </div>

                  <div className="cm-upload-dropzone-subtitle">
                    o{" "}
                    <span className="cm-upload-dropzone-link">
                      cárgalos desde tu computadora
                    </span>
                  </div>
                </div>

                <input
                  id="archivos-egreso"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {formEgreso.observaciones.length > 0 && (
              <div className="cm-form-group">
                <div className="cm-files-list">
                  {formEgreso.observaciones.map((archivo, index) => (
                    <div
                      key={`${archivo.file.name}-${index}`}
                      className="cm-file-card"
                    >
                      <div className="cm-file-preview">
                        {archivo.tipo === "imagen" && archivo.preview ? (
                          <img
                            src={archivo.preview}
                            alt={archivo.file.name}
                            className="cm-file-image"
                          />
                        ) : (
                          <div className="cm-file-pdf">PDF</div>
                        )}
                      </div>

                      <div className="cm-file-info">
                        <span
                          className="cm-file-name"
                          title={archivo.file.name}
                        >
                          {archivo.file.name}
                        </span>
                        <span className="cm-file-size">
                          {(archivo.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      <div className="cm-file-actions">
                        {archivo.tipo === "imagen" && archivo.preview ? (
                          <a
                            href={archivo.preview}
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
                                URL.createObjectURL(archivo.file),
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
                          onClick={() => removeArchivo(index)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cm-egreso-actions">
              <button
                type="button"
                className="cm-btn cm-btn-secondary"
                onClick={limpiarFormulario}
              >
                Limpiar formulario
              </button>

              <button
                type="submit"
                className="cm-btn cm-btn-warning"
                disabled={loading}
              >
                {loading ? "..." : "Registrar egreso"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EgresosManager;
