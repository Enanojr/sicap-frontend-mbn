import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPinned,
  ShieldCheck,
  CircleOff,
  CalendarRange,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import "../../styles/styles.css";

import {
  getGrupos,
  createGrupo,
  updateGrupo,
  deleteGrupo,
} from "../../services/grupos.service";
import { getCalles } from "../../services/calle.service";
import { getCobradores } from "../../services/Rcobradores.service";

interface CalleResponse {
  id_calle: number;
  nombre_calle: string;
  activo?: boolean | string | number;
}

interface CobradorResponse {
  id_cobrador: number;
  nombre?: string;
  nombre_completo?: string;
  activo?: boolean | string | number;
}

interface GrupoResponse {
  id_equipo: number;
  nombre_equipo: string;
  fecha_asignacion: string;
  fecha_termino?: string | null;
  activo?: boolean | string | number;
  id_calle?: number | string;
  id_cobrador?: number | string;
  calle?: {
    id_calle: number;
    nombre_calle: string;
  };
  cobrador?: {
    id_cobrador: number;
    nombre?: string;
    nombre_completo?: string;
  };
}

interface GrupoPayload {
  nombre_equipo: string;
  fecha_asignacion: string;
  fecha_termino: string | null;
  activo: boolean;
  id_calle: number;
  id_cobrador: number;
  calle: any;
  cobradores_ids: number[];
  fecha_ingreso_cobradores: string;
}

interface FormState {
  nombre_equipo: string;
  fecha_asignacion: string;
  fecha_termino: string;
  activo: boolean;
  id_calle: string;
  id_cobrador: string;
}

const initialForm: FormState = {
  nombre_equipo: "",
  fecha_asignacion: "",
  fecha_termino: "",
  activo: true,
  id_calle: "",
  id_cobrador: "",
};

const formatFechaLocal = (fechaString?: string | null): string => {
  if (!fechaString) return "—";

  const fechaLimpia = fechaString.includes("T")
    ? fechaString.split("T")[0]
    : fechaString;

  const [year, month, day] = fechaLimpia.split("-").map(Number);
  if (!year || !month || !day) return "—";

  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeDateInput = (fecha?: string | null): string => {
  if (!fecha) return "";
  return fecha.includes("T") ? fecha.split("T")[0] : fecha;
};

const isActiveValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return ["1", "true", "activo", "activa", "sí", "si"].includes(v);
  }

  return false;
};

const getEstadoLabel = (grupo: GrupoResponse): string =>
  isActiveValue(grupo.activo) ? "Activo" : "Inactivo";

const getStatusClass = (grupo: GrupoResponse): string =>
  isActiveValue(grupo.activo) ? "status-current" : "status-danger";

const getStatusStyle = (grupo: GrupoResponse): React.CSSProperties =>
  isActiveValue(grupo.activo)
    ? {
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(74,222,128,0.12))",
        color: "#bbf7d0",
        border: "1px solid rgba(74, 222, 128, 0.24)",
      }
    : {
        background:
          "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(248,113,113,0.10))",
        color: "#fecaca",
        border: "1px solid rgba(248, 113, 113, 0.24)",
      };

const badgeStyle = (grupo: GrupoResponse): React.CSSProperties => ({
  ...getStatusStyle(grupo),
  padding: "0.38rem 0.8rem",
  borderRadius: "9999px",
  fontSize: "0.76rem",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  letterSpacing: "0.02em",
  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
});

const extractList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const primaryGradient =
  "linear-gradient(135deg, #7b2cbf 0%, #5a189a 55%, #3c096c 100%)";

const surfaceStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #171a20 0%, #101319 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
  borderRadius: "24px",
};

const softPanelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "18px",
  backdropFilter: "blur(8px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#11141a",
  color: "#f5f5f5",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "0.9rem 1rem",
  outline: "none",
  fontSize: "0.95rem",
};

const primaryButton: React.CSSProperties = {
  background: primaryGradient,
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  padding: "0.9rem 1.15rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.55rem",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 16px 28px rgba(123, 44, 191, 0.28)",
};

const secondaryButton: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "0.9rem 1.15rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.55rem",
  fontWeight: 600,
  cursor: "pointer",
};

const smallIconButtonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.45rem",
  borderRadius: "12px",
  padding: "0.62rem 0.85rem",
  fontSize: "0.86rem",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const GruposTable: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoResponse[]>([]);
  const [calles, setCalles] = useState<CalleResponse[]>([]);
  const [cobradores, setCobradores] = useState<CobradorResponse[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoResponse | null>(null);
  const [formData, setFormData] = useState<FormState>(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gruposResult, callesResult, cobradoresResult] = await Promise.all([
        getGrupos(),
        getCalles(),
        getCobradores(),
      ]);

      if (!gruposResult.success) {
        throw new Error(
          gruposResult.errors?.general || "Error al obtener grupos.",
        );
      }

      if (!callesResult.success) {
        throw new Error(
          callesResult.errors?.general || "Error al obtener calles.",
        );
      }

      if (!cobradoresResult.success) {
        throw new Error(
          cobradoresResult.errors?.general || "Error al obtener cobradores.",
        );
      }

      setGrupos(extractList<GrupoResponse>(gruposResult.data));
      setCalles(extractList<CalleResponse>(callesResult.data));
      setCobradores(extractList<CobradorResponse>(cobradoresResult.data));
    } catch (err: any) {
      const message =
        err?.message || "Ocurrió un error al cargar la información.";
      setError(message);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveCalleId = (grupo: GrupoResponse): number | null => {
    if (grupo.id_calle !== undefined && grupo.id_calle !== null) {
      return Number(grupo.id_calle);
    }
    if (grupo.calle?.id_calle) return Number(grupo.calle.id_calle);
    return null;
  };

  const resolveCobradorId = (grupo: GrupoResponse): number | null => {
    if (grupo.id_cobrador !== undefined && grupo.id_cobrador !== null) {
      return Number(grupo.id_cobrador);
    }
    if (grupo.cobrador?.id_cobrador) return Number(grupo.cobrador.id_cobrador);
    return null;
  };

  const resolveCalleNombre = (grupo: GrupoResponse): string => {
    if (grupo.calle?.nombre_calle) return grupo.calle.nombre_calle;

    const idCalle = resolveCalleId(grupo);
    const calle = calles.find((c) => Number(c.id_calle) === Number(idCalle));

    return calle?.nombre_calle || "Sin calle";
  };

  const resolveCobradorNombre = (grupo: GrupoResponse): string => {
    if (grupo.cobrador?.nombre_completo) return grupo.cobrador.nombre_completo;
    if (grupo.cobrador?.nombre) return grupo.cobrador.nombre;

    const idCobrador = resolveCobradorId(grupo);
    const cobrador = cobradores.find(
      (c) => Number(c.id_cobrador) === Number(idCobrador),
    );

    return (
      cobrador?.nombre_completo || cobrador?.nombre || "Sin cobrador asignado"
    );
  };

  const filteredGrupos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return grupos.filter((grupo) => {
      const calleNombre = resolveCalleNombre(grupo).toLowerCase();
      const cobradorNombre = resolveCobradorNombre(grupo).toLowerCase();
      const estado = getEstadoLabel(grupo).toLowerCase();

      return (
        grupo.id_equipo.toString().includes(term) ||
        grupo.nombre_equipo.toLowerCase().includes(term) ||
        calleNombre.includes(term) ||
        cobradorNombre.includes(term) ||
        estado.includes(term)
      );
    });
  }, [grupos, searchTerm, calles, cobradores]);

  const stats = useMemo(() => {
    const activos = grupos.filter((g) => isActiveValue(g.activo)).length;
    const inactivos = grupos.length - activos;
    const conCalle = grupos.filter(
      (g) => resolveCalleNombre(g) !== "Sin calle",
    ).length;

    return { activos, inactivos, conCalle };
  }, [grupos, calles, cobradores]);

  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage);

  const currentRows = filteredGrupos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const openCreateModal = () => {
    setEditingGrupo(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (grupo: GrupoResponse) => {
    setEditingGrupo(grupo);
    setFormData({
      nombre_equipo: grupo.nombre_equipo || "",
      fecha_asignacion: normalizeDateInput(grupo.fecha_asignacion),
      fecha_termino: normalizeDateInput(grupo.fecha_termino),
      activo: isActiveValue(grupo.activo),
      id_calle: resolveCalleId(grupo)?.toString() || "",
      id_cobrador: resolveCobradorId(grupo)?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGrupo(null);
    setFormData(initialForm);
  };

  const validateForm = (): boolean => {
    if (!formData.nombre_equipo.trim()) {
      Swal.fire(
        "Campo requerido",
        "Debe ingresar el nombre del grupo.",
        "warning",
      );
      return false;
    }

    if (!formData.fecha_asignacion) {
      Swal.fire(
        "Campo requerido",
        "Debe ingresar la fecha de asignación.",
        "warning",
      );
      return false;
    }

    if (!formData.id_calle) {
      Swal.fire("Campo requerido", "Debe seleccionar una calle.", "warning");
      return false;
    }

    if (!formData.id_cobrador) {
      Swal.fire("Campo requerido", "Debe seleccionar un cobrador.", "warning");
      return false;
    }

    if (
      formData.fecha_termino &&
      formData.fecha_asignacion &&
      formData.fecha_termino < formData.fecha_asignacion
    ) {
      Swal.fire(
        "Fechas inválidas",
        "La fecha de término no puede ser menor a la fecha de asignación.",
        "warning",
      );
      return false;
    }

    return true;
  };

  const buildPayload = (): GrupoPayload => ({
    nombre_equipo: formData.nombre_equipo.trim(),
    fecha_asignacion: formData.fecha_asignacion,
    fecha_termino: formData.fecha_termino || null,
    activo: formData.activo,
    id_calle: Number(formData.id_calle),
    id_cobrador: Number(formData.id_cobrador),
    calle: null,
    cobradores_ids: [],
    fecha_ingreso_cobradores: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingGrupo) {
        const result = await updateGrupo(editingGrupo.id_equipo, payload);

        if (!result.success) {
          throw new Error(
            result.errors?.general || "No fue posible actualizar el grupo.",
          );
        }

        Swal.fire(
          "Actualizado",
          "El grupo fue actualizado correctamente.",
          "success",
        );
      } else {
        const result = await createGrupo(payload);

        if (!result.success) {
          throw new Error(
            result.errors?.general || "No fue posible crear el grupo.",
          );
        }

        Swal.fire("Creado", "El grupo fue creado correctamente.", "success");
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.message || "No fue posible guardar la información del grupo.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grupo: GrupoResponse) => {
    const resultConfirm = await Swal.fire({
      title: "¿Eliminar grupo?",
      text: `Se eliminará el grupo "${grupo.nombre_equipo}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!resultConfirm.isConfirmed) return;

    try {
      const result = await deleteGrupo(grupo.id_equipo);

      if (!result.success) {
        throw new Error(
          result.errors?.general || "No fue posible eliminar el grupo.",
        );
      }

      Swal.fire(
        "Eliminado",
        "El grupo fue eliminado correctamente.",
        "success",
      );
      await loadData();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.message || "No fue posible eliminar el grupo.",
        "error",
      );
    }
  };

  return (
    <div
      className="contracts-page-container"
      style={{
        padding: "1.25rem",
        background:
          "radial-gradient(circle at top right, rgba(123,44,191,0.18), transparent 25%), radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 18%)",
      }}
    >
      <div
        className="contracts-card"
        style={{
          ...surfaceStyle,
          padding: "1.35rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...softPanelStyle,
            padding: "1.35rem",
            background:
              "linear-gradient(135deg, rgba(123,44,191,0.14), rgba(10,14,24,0.65) 62%)",
            marginBottom: "1.2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.42rem 0.78rem",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.06)",
                  color: "#d8b4fe",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginBottom: "0.8rem",
                }}
              >
                <Users size={15} />
                Administración de grupos
              </div>

              <h2
                className="contracts-title"
                style={{
                  margin: 0,
                  fontSize: "clamp(1.6rem, 2vw, 2.2rem)",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                }}
              >
                Gestión de Grupos
              </h2>

              <p
                style={{
                  margin: "0.55rem 0 0",
                  color: "#a1a1aa",
                  maxWidth: "760px",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                Consulta, crea y administra los grupos registrados.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              style={primaryButton}
            >
              <Plus size={18} />
              Nuevo Grupo
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.9rem",
              marginTop: "1.2rem",
            }}
          >
            {[
              {
                label: "Total",
                value: grupos.length,
                icon: Users,
                tone: "rgba(168,85,247,0.18)",
                color: "#e9d5ff",
              },
              {
                label: "Activos",
                value: stats.activos,
                icon: ShieldCheck,
                tone: "rgba(34,197,94,0.16)",
                color: "#bbf7d0",
              },
              {
                label: "Inactivos",
                value: stats.inactivos,
                icon: CircleOff,
                tone: "rgba(239,68,68,0.16)",
                color: "#fecaca",
              },
              {
                label: "Con calle asignada",
                value: stats.conCalle,
                icon: MapPinned,
                tone: "rgba(14,165,233,0.16)",
                color: "#bae6fd",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={index}
                  style={{
                    ...softPanelStyle,
                    padding: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "14px",
                      display: "grid",
                      placeItems: "center",
                      background: item.tone,
                      color: item.color,
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#a1a1aa",
                        fontSize: "0.8rem",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "1.15rem",
                        fontWeight: 800,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            ...softPanelStyle,
            padding: "0.95rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.85rem",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "260px",
                position: "relative",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8b5cf6",
                }}
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, grupo, calle, cobrador o estado..."
                style={{
                  ...inputStyle,
                  paddingLeft: "2.7rem",
                }}
              />
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.78rem 1rem",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#d4d4d8",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <CalendarRange size={17} color="#c084fc" />
              Mostrando{" "}
              <span style={{ color: "#fff", fontWeight: 800 }}>
                {currentRows.length}
              </span>{" "}
              de{" "}
              <span style={{ color: "#c084fc", fontWeight: 800 }}>
                {filteredGrupos.length}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div
            style={{
              ...softPanelStyle,
              padding: "2.2rem",
              textAlign: "center",
              color: "#d4d4d8",
            }}
          >
            Cargando grupos...
          </div>
        )}

        {error && (
          <div
            style={{
              ...softPanelStyle,
              padding: "2rem",
              textAlign: "center",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.18)",
              background: "rgba(239,68,68,0.08)",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div
              className="contracts-table-wrapper"
              style={{
                ...softPanelStyle,
                overflow: "hidden",
                padding: "0.35rem",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  className="contracts-table"
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    minWidth: "1050px",
                  }}
                >
                  <thead className="contracts-thead">
                    <tr
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(123,44,191,0.14), rgba(255,255,255,0.03))",
                      }}
                    >
                      {[
                        "ID",
                        "Nombre del Grupo",
                        "Fecha Asignación",
                        "Fecha Término",
                        "Calle",
                        "Cobrador",
                        "Estatus",
                        "Acciones",
                      ].map((header) => (
                        <th
                          key={header}
                          className="th"
                          style={{
                            padding: "1rem 1rem",
                            textAlign: "left",
                            color: "#e5e7eb",
                            fontSize: "0.82rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="contracts-tbody">
                    {currentRows.map((grupo, index) => (
                      <tr
                        key={grupo.id_equipo}
                        style={{
                          background:
                            index % 2 === 0
                              ? "rgba(255,255,255,0.015)"
                              : "rgba(255,255,255,0.03)",
                        }}
                      >
                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            color: "#d4d4d8",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            fontWeight: 700,
                          }}
                        >
                          #{grupo.id_equipo}
                        </td>

                        <td
                          className="td-name"
                          style={{
                            padding: "1rem",
                            color: "#fff",
                            fontWeight: 700,
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {grupo.nombre_equipo}
                        </td>

                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            color: "#d4d4d8",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatFechaLocal(grupo.fecha_asignacion)}
                        </td>

                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            color: "#d4d4d8",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatFechaLocal(grupo.fecha_termino)}
                        </td>

                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            color: "#d4d4d8",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {resolveCalleNombre(grupo)}
                        </td>

                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            color: "#d4d4d8",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {resolveCobradorNombre(grupo)}
                        </td>

                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <span
                            className={`status-badge ${getStatusClass(grupo)}`}
                            style={badgeStyle(grupo)}
                          >
                            {getEstadoLabel(grupo)}
                          </span>
                        </td>

                        <td
                          className="td-actions"
                          style={{
                            padding: "1rem",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "0.55rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => openEditModal(grupo)}
                              style={{
                                ...smallIconButtonBase,
                                background: "rgba(56,189,248,0.10)",
                                color: "#7dd3fc",
                                border: "1px solid rgba(56,189,248,0.22)",
                              }}
                            >
                              <Pencil size={15} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(grupo)}
                              style={{
                                ...smallIconButtonBase,
                                background: "rgba(239,68,68,0.10)",
                                color: "#fca5a5",
                                border: "1px solid rgba(239,68,68,0.22)",
                              }}
                            >
                              <Trash2 size={15} />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {currentRows.length === 0 && (
                <div
                  className="no-results"
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "#a1a1aa",
                  }}
                >
                  No se encontraron grupos
                </div>
              )}
            </div>

            {filteredGrupos.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1.2rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    ...secondaryButton,
                    padding: "0.75rem 0.9rem",
                    opacity: currentPage === 1 ? 0.45 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <button
                      key={index}
                      onClick={() => goToPage(page)}
                      style={{
                        minWidth: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        border:
                          currentPage === page
                            ? "1px solid rgba(192,132,252,0.35)"
                            : "1px solid rgba(255,255,255,0.08)",
                        background:
                          currentPage === page
                            ? primaryGradient
                            : "rgba(255,255,255,0.03)",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={index}
                      style={{
                        color: "#71717a",
                        padding: "0.8rem 0.4rem",
                        fontWeight: 700,
                      }}
                    >
                      ...
                    </span>
                  ),
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    ...secondaryButton,
                    padding: "0.75rem 0.9rem",
                    opacity: currentPage === totalPages ? 0.45 : 1,
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="grupos-modal-overlay" onClick={closeModal}>
          <div
            className="grupos-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grupos-modal-header">
              <div>
                <h3 className="grupos-modal-title">
                  {editingGrupo ? "Editar Grupo" : "Nuevo Grupo"}
                </h3>
                <p className="grupos-modal-subtitle">
                  Completa la información general del grupo.
                </p>
              </div>

              <button
                className="grupos-close-button"
                onClick={closeModal}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grupos-modal-body">
                <div className="grupos-detail-section">
                  <div className="grupos-section-head">
                    <div className="grupos-section-icon">
                      <Users size={18} />
                    </div>

                    <div>
                      <h4 className="grupos-section-title">
                        Información General
                      </h4>
                      <p className="grupos-section-text">
                        Datos principales para registrar o actualizar el grupo.
                      </p>
                    </div>
                  </div>

                  <div className="grupos-form-grid">
                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">
                        Nombre del grupo
                      </label>
                      <input
                        type="text"
                        value={formData.nombre_equipo}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nombre_equipo: e.target.value,
                          }))
                        }
                        className="grupos-form-input"
                        placeholder="Ingrese el nombre del grupo"
                      />
                    </div>

                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">Estado</label>
                      <select
                        value={formData.activo ? "activo" : "inactivo"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            activo: e.target.value === "activo",
                          }))
                        }
                        className="grupos-form-input"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>

                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">
                        Fecha de asignación
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_asignacion}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fecha_asignacion: e.target.value,
                          }))
                        }
                        className="grupos-form-input grupos-date-input"
                      />
                    </div>

                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">
                        Fecha de término
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_termino}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fecha_termino: e.target.value,
                          }))
                        }
                        className="grupos-form-input grupos-date-input"
                      />
                    </div>

                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">Calle</label>
                      <select
                        value={formData.id_calle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            id_calle: e.target.value,
                          }))
                        }
                        className="grupos-form-input"
                      >
                        <option value="">Seleccione una calle</option>
                        {calles.map((calle) => (
                          <option key={calle.id_calle} value={calle.id_calle}>
                            {calle.nombre_calle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">Cobrador</label>
                      <select
                        value={formData.id_cobrador}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            id_cobrador: e.target.value,
                          }))
                        }
                        className="grupos-form-input"
                      >
                        <option value="">Seleccione un cobrador</option>
                        {cobradores.map((cobrador) => (
                          <option
                            key={cobrador.id_cobrador}
                            value={cobrador.id_cobrador}
                          >
                            {cobrador.nombre_completo ||
                              cobrador.nombre ||
                              `Cobrador ${cobrador.id_cobrador}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grupos-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    style={secondaryButton}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      ...primaryButton,
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving
                      ? "Guardando..."
                      : editingGrupo
                        ? "Actualizar Grupo"
                        : "Crear Grupo"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GruposTable;
