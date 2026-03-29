import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Users,
  ShieldCheck,
  CircleOff,
  CalendarRange,
  X,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import Swal from "sweetalert2";
import "../../styles/styles.css";

import {
  getGrupos,
  createGrupo,
  updateGrupo,
  type GrupoResponse,
  type GrupoPayload,
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
  apellidos?: string;
  nombre_completo?: string;
  telefono?: string;
  activo?: boolean | string | number;
}

interface FormState {
  nombre_equipo: string;
  calle: string;
  fecha_asignacion: string;
  fecha_termino: string;
  activo: boolean;
  cobradores_ids: string[];
  fecha_ingreso_cobradores: string;
}

const initialForm: FormState = {
  nombre_equipo: "",
  calle: "",
  fecha_asignacion: "",
  fecha_termino: "",
  activo: true,
  cobradores_ids: [],
  fecha_ingreso_cobradores: "",
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
  "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)";

const surfaceStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #0e141c 0%, #0a1017 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.32)",
  borderRadius: "0px",
};

const softPanelStyle: React.CSSProperties = {
  background: "rgba(15, 21, 30, 0.96)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "0px",
  backdropFilter: "blur(8px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
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
  boxShadow: "0 16px 28px rgba(37, 99, 235, 0.28)",
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
  borderRadius: "10px",
  padding: "0.55rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const policyNoticeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.8rem",
  padding: "0.95rem 1rem",
  borderRadius: "16px",
  background: "rgba(250, 204, 21, 0.08)",
  border: "1px solid rgba(250, 204, 21, 0.18)",
  color: "#fde68a",
};

const GruposTable: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoResponse[]>([]);
  const [calles, setCalles] = useState<CalleResponse[]>([]);
  const [cobradores, setCobradores] = useState<CobradorResponse[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savingMembers, setSavingMembers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formCobradorSearch, setFormCobradorSearch] = useState<string>("");
  const [membersCobradorSearch, setMembersCobradorSearch] =
    useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoResponse | null>(null);
  const [formData, setFormData] = useState<FormState>(initialForm);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState<boolean>(false);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoResponse | null>(
    null,
  );
  const [membersSelection, setMembersSelection] = useState<string[]>([]);
  const [existingMembersIds, setExistingMembersIds] = useState<string[]>([]);
  const [membersFechaIngreso, setMembersFechaIngreso] = useState<string>("");

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
      Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      setLoading(false);
    }
  };

  const resolveCalleId = (grupo: GrupoResponse): number | null => {
    if (grupo.calle !== undefined && grupo.calle !== null) {
      return Number(grupo.calle);
    }
    if (grupo.calle_detalle?.id_calle) {
      return Number(grupo.calle_detalle.id_calle);
    }
    return null;
  };

  const resolveCalleNombre = (grupo: GrupoResponse): string => {
    if (grupo.calle_detalle?.nombre_calle) {
      return grupo.calle_detalle.nombre_calle;
    }
    const idCalle = resolveCalleId(grupo);
    const calle = calles.find((c) => Number(c.id_calle) === Number(idCalle));
    return calle?.nombre_calle || "Sin calle";
  };

  const getCobradorNombre = (cobrador: {
    id_cobrador: number;
    nombre?: string;
    apellidos?: string;
    nombre_completo?: string;
  }): string =>
    cobrador.nombre_completo ||
    [cobrador.nombre, cobrador.apellidos].filter(Boolean).join(" ").trim() ||
    `Cobrador ${cobrador.id_cobrador}`;

  const getActiveMembers = (grupo: GrupoResponse) =>
    (grupo.cobradores || []).filter((c) => {
      const a = (c as any).activo;
      if (a === undefined || a === null) return true;
      return isActiveValue(a);
    });

  const getUniqueFechasIngreso = (grupo: GrupoResponse): string[] => [
    ...new Set(
      getActiveMembers(grupo)
        .map((c) =>
          c.fecha_ingreso ? normalizeDateInput(c.fecha_ingreso) : "",
        )
        .filter(Boolean),
    ),
  ];

  const resolveFechaIngresoCobradores = (grupo: GrupoResponse): string => {
    const fechas = getUniqueFechasIngreso(grupo);
    if (fechas.length === 0) return "—";
    if (fechas.length === 1) return formatFechaLocal(fechas[0]);
    return fechas.map((f) => formatFechaLocal(f)).join(", ");
  };

  const getDefaultFechaIngresoForForm = (grupo: GrupoResponse): string =>
    getUniqueFechasIngreso(grupo)[0] || "";

  const getMembersCount = (grupo: GrupoResponse): number =>
    getActiveMembers(grupo).length;

  const filteredGrupos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return grupos.filter(
      (grupo) =>
        grupo.id_equipo.toString().includes(term) ||
        grupo.nombre_equipo.toLowerCase().includes(term) ||
        resolveCalleNombre(grupo).toLowerCase().includes(term) ||
        getEstadoLabel(grupo).toLowerCase().includes(term),
    );
  }, [grupos, searchTerm, calles]);

  const stats = useMemo(() => {
    const activos = grupos.filter((g) => isActiveValue(g.activo)).length;
    return {
      activos,
      inactivos: grupos.length - activos,
      miembros: grupos.reduce((acc, g) => acc + getMembersCount(g), 0),
    };
  }, [grupos]);

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
    setFormCobradorSearch("");
    setIsModalOpen(true);
  };

  const openEditModal = (grupo: GrupoResponse) => {
    setEditingGrupo(grupo);
    setFormData({
      nombre_equipo: grupo.nombre_equipo || "",
      calle: resolveCalleId(grupo)?.toString() || "",
      fecha_asignacion: normalizeDateInput(grupo.fecha_asignacion),
      fecha_termino: normalizeDateInput(grupo.fecha_termino),
      activo: isActiveValue(grupo.activo),
      cobradores_ids: getActiveMembers(grupo).map((c) => String(c.id_cobrador)),
      fecha_ingreso_cobradores: getDefaultFechaIngresoForForm(grupo),
    });
    setFormCobradorSearch("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGrupo(null);
    setFormData(initialForm);
    setFormCobradorSearch("");
  };

  const openMembersModal = (grupo: GrupoResponse) => {
    const assignedIds = getActiveMembers(grupo).map((c) =>
      String(c.id_cobrador),
    );
    setSelectedGrupo(grupo);
    setExistingMembersIds(assignedIds);
    setMembersSelection(assignedIds);
    setMembersFechaIngreso(getDefaultFechaIngresoForForm(grupo));
    setMembersCobradorSearch("");
    setIsMembersModalOpen(true);
  };

  const closeMembersModal = () => {
    setIsMembersModalOpen(false);
    setSelectedGrupo(null);
    setMembersSelection([]);
    setExistingMembersIds([]);
    setMembersFechaIngreso("");
    setMembersCobradorSearch("");
  };

  const toggleCobradorSelection = (id: number, source: "form" | "members") => {
    const idString = String(id);

    if (source === "form") {
      setFormData((prev) => ({
        ...prev,
        cobradores_ids: prev.cobradores_ids.includes(idString)
          ? prev.cobradores_ids.filter((item) => item !== idString)
          : [...prev.cobradores_ids, idString],
      }));
      return;
    }

    if (existingMembersIds.includes(idString)) {
      Swal.fire({
        icon: "info",
        title: "Miembro bloqueado",
        text: "Los cobradores ya asignados no pueden retirarse desde este módulo. Solo pueden desactivarse.",
      });
      return;
    }

    setMembersSelection((prev) =>
      prev.includes(idString)
        ? prev.filter((item) => item !== idString)
        : [...prev, idString],
    );
  };

  const filteredFormCobradores = useMemo(() => {
    const term = formCobradorSearch.toLowerCase().trim();
    if (!term) return cobradores;
    return cobradores.filter((c) =>
      getCobradorNombre(c).toLowerCase().includes(term),
    );
  }, [cobradores, formCobradorSearch]);

  const filteredMembersCobradores = useMemo(() => {
    const term = membersCobradorSearch.toLowerCase().trim();
    if (!term) return cobradores;
    return cobradores.filter((c) =>
      getCobradorNombre(c).toLowerCase().includes(term),
    );
  }, [cobradores, membersCobradorSearch]);

  const validateForm = (): boolean => {
    if (!formData.nombre_equipo.trim()) {
      Swal.fire(
        "Campo requerido",
        "Debe ingresar el nombre del equipo.",
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

    if (!formData.calle) {
      Swal.fire("Campo requerido", "Debe seleccionar una calle.", "warning");
      return false;
    }

    if (!editingGrupo && formData.cobradores_ids.length === 0) {
      Swal.fire(
        "Campo requerido",
        "Debe seleccionar al menos un cobrador.",
        "warning",
      );
      return false;
    }

    if (!editingGrupo && !formData.fecha_ingreso_cobradores) {
      Swal.fire(
        "Campo requerido",
        "Debe ingresar la fecha de ingreso de los cobradores.",
        "warning",
      );
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
    calle: Number(formData.calle),
    fecha_asignacion: formData.fecha_asignacion,
    fecha_termino: formData.fecha_termino || null,
    activo: formData.activo,
    cobradores_ids: formData.cobradores_ids.map(Number),
    fecha_ingreso_cobradores: formData.fecha_ingreso_cobradores,
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
          "El equipo fue actualizado correctamente.",
          "success",
        );
      } else {
        const result = await createGrupo(payload);
        if (!result.success) {
          throw new Error(
            result.errors?.general ||
              JSON.stringify(result.errors) ||
              "No fue posible crear el equipo.",
          );
        }
        Swal.fire("Creado", "El equipo fue creado correctamente.", "success");
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.message || "No fue posible guardar la información del equipo.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMembers = async () => {
    if (!selectedGrupo) return;

    if (membersSelection.length === 0) {
      Swal.fire(
        "Campo requerido",
        "Debes seleccionar al menos un cobrador.",
        "warning",
      );
      return;
    }

    if (!membersFechaIngreso) {
      Swal.fire(
        "Campo requerido",
        "Debes ingresar la fecha de ingreso de los cobradores.",
        "warning",
      );
      return;
    }

    const calleId = resolveCalleId(selectedGrupo);
    if (!calleId) {
      Swal.fire(
        "Información incompleta",
        "No se pudo identificar la calle del equipo.",
        "warning",
      );
      return;
    }

    const payload: GrupoPayload = {
      nombre_equipo: selectedGrupo.nombre_equipo.trim(),
      calle: calleId,
      fecha_asignacion: normalizeDateInput(selectedGrupo.fecha_asignacion),
      fecha_termino: normalizeDateInput(selectedGrupo.fecha_termino) || null,
      activo: isActiveValue(selectedGrupo.activo),
      cobradores_ids: membersSelection.map(Number),
      fecha_ingreso_cobradores: membersFechaIngreso,
    };

    try {
      setSavingMembers(true);
      const result = await updateGrupo(selectedGrupo.id_equipo, payload);

      if (!result.success) {
        throw new Error(
          result.errors?.general || "No fue posible actualizar los cobradores.",
        );
      }

      Swal.fire(
        "Actualizado",
        "Los cobradores del equipo fueron actualizados correctamente.",
        "success",
      );
      closeMembersModal();
      await loadData();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.message || "No fue posible actualizar los cobradores del equipo.",
        "error",
      );
    } finally {
      setSavingMembers(false);
    }
  };

  const handleToggleActivo = async (grupo: GrupoResponse) => {
    const isActive = isActiveValue(grupo.activo);
    const accion = isActive ? "desactivar" : "activar";

    const resultConfirm = await Swal.fire({
      title: `¿${isActive ? "Desactivar" : "Activar"} equipo?`,
      text: `Se va a ${accion} el equipo "${grupo.nombre_equipo}". Los equipos no se eliminan del sistema.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
      confirmButtonColor: isActive ? "#d33" : "#16a34a",
    });

    if (!resultConfirm.isConfirmed) return;

    try {
      const calleId = resolveCalleId(grupo);

      const payload: GrupoPayload = {
        nombre_equipo: grupo.nombre_equipo.trim(),
        calle: calleId!,
        fecha_asignacion: normalizeDateInput(grupo.fecha_asignacion),
        fecha_termino: normalizeDateInput(grupo.fecha_termino) || null,
        activo: !isActive,
        cobradores_ids: getActiveMembers(grupo).map((c) => c.id_cobrador),
        fecha_ingreso_cobradores: getDefaultFechaIngresoForForm(grupo),
      };

      const result = await updateGrupo(grupo.id_equipo, payload);
      if (!result.success) {
        throw new Error(
          result.errors?.general || `No fue posible ${accion} el equipo.`,
        );
      }

      setGrupos((prev) =>
        prev.map((g) =>
          g.id_equipo === grupo.id_equipo ? { ...g, activo: !isActive } : g,
        ),
      );

      Swal.fire(
        isActive ? "Desactivado" : "Activado",
        `El equipo fue ${isActive ? "desactivado" : "activado"} correctamente.`,
        "success",
      );
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.message || `No fue posible ${accion} el equipo.`,
        "error",
      );
    }
  };

  return (
    <div
      className="contracts-page-container"
      style={{ padding: "1.25rem", background: "transparent" }}
    >
      <div
        className="contracts-card"
        style={{ ...surfaceStyle, padding: "1.35rem", overflow: "hidden" }}
      >
        <div
          style={{
            ...softPanelStyle,
            padding: "1.35rem",
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
                  color: "#93c5fd",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginBottom: "0.8rem",
                }}
              >
                <Users size={15} />
                Administración de equipos
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
                Gestión de Equipos
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
                Consulta, crea y administra los equipos registrados.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              style={primaryButton}
            >
              <Plus size={18} /> Nuevo Equipo
            </button>
          </div>

          <div style={{ ...policyNoticeStyle, marginTop: "1rem" }}>
            <AlertTriangle
              size={18}
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ lineHeight: 1.5, fontSize: "0.92rem" }}>
              <strong>Política del módulo:</strong> los equipos y los cobradores
              no se eliminan del sistema. Los equipos solo pueden activarse o
              desactivarse. Los miembros ya asignados a un equipo no pueden
              retirarse desde este módulo; si dejan de operar, deberán
              desactivarse.
            </div>
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
                tone: "rgba(59,130,246,0.18)",
                color: "#bfdbfe",
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
                label: "Miembros",
                value: stats.miembros,
                icon: UserPlus,
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
            <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#3b82f6",
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, equipo, calle o estado..."
                style={{ ...inputStyle, paddingLeft: "2.7rem" }}
              />
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.78rem 1rem",
                borderRadius: "14px",
                background: "rgba(10, 15, 22, 0.95)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#d4d4d8",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <CalendarRange size={17} color="#60a5fa" />
              Mostrando{" "}
              <span style={{ color: "#fff", fontWeight: 800 }}>
                {currentRows.length}
              </span>{" "}
              de{" "}
              <span style={{ color: "#60a5fa", fontWeight: 800 }}>
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
            Cargando equipos...
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
                padding: "0",
                background: "#0b1118",
              }}
            >
              <div style={{ overflowX: "auto", background: "#0b1118" }}>
                <table
                  className="contracts-table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "900px",
                    background: "#0b1118",
                  }}
                >
                  <thead className="contracts-thead">
                    <tr style={{ background: "rgba(12, 20, 30, 0.98)" }}>
                      {[
                        "ID",
                        "Nombre del Equipo",
                        "Fecha Asignación",
                        "Fecha Término",
                        "Fecha Ingreso",
                        "Calle",
                        "Estatus",
                        "Miembros",
                        "Acciones",
                      ].map((header) => (
                        <th
                          key={header}
                          className="th"
                          style={{
                            padding: "1rem",
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
                              ? "rgba(18, 25, 35, 0.98)"
                              : "rgba(14, 20, 29, 0.98)",
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
                            whiteSpace: "nowrap",
                          }}
                        >
                          {resolveFechaIngresoCobradores(grupo)}
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
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <span style={badgeStyle(grupo)}>
                            {getEstadoLabel(grupo)}
                          </span>
                        </td>

                        <td
                          className="td"
                          style={{
                            padding: "1rem",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openMembersModal(grupo)}
                            title="Gestionar miembros"
                            style={{
                              ...smallIconButtonBase,
                              background: "rgba(250,204,21,0.10)",
                              color: "#fde68a",
                              border: "1px solid rgba(250,204,21,0.20)",
                            }}
                          >
                            <UserPlus size={16} />
                          </button>
                        </td>

                        <td
                          className="td-actions"
                          style={{
                            padding: "1rem",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.45rem" }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(grupo)}
                              title="Editar"
                              style={{
                                ...smallIconButtonBase,
                                background: "rgba(56,189,248,0.10)",
                                color: "#7dd3fc",
                                border: "1px solid rgba(56,189,248,0.22)",
                              }}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActivo(grupo)}
                              title={
                                isActiveValue(grupo.activo)
                                  ? "Desactivar"
                                  : "Activar"
                              }
                              style={{
                                ...smallIconButtonBase,
                                ...(isActiveValue(grupo.activo)
                                  ? {
                                      background: "rgba(239,68,68,0.10)",
                                      color: "#fca5a5",
                                      border: "1px solid rgba(239,68,68,0.22)",
                                    }
                                  : {
                                      background: "rgba(34,197,94,0.10)",
                                      color: "#bbf7d0",
                                      border: "1px solid rgba(34,197,94,0.22)",
                                    }),
                              }}
                            >
                              {isActiveValue(grupo.activo) ? (
                                <CircleOff size={15} />
                              ) : (
                                <ShieldCheck size={15} />
                              )}
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
                    background: "#0b1118",
                  }}
                >
                  No se encontraron equipos
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
                      key={`page-${page}`}
                      onClick={() => goToPage(page)}
                      style={{
                        minWidth: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        border:
                          currentPage === page
                            ? "1px solid rgba(59,130,246,0.35)"
                            : "1px solid rgba(255,255,255,0.08)",
                        background:
                          currentPage === page ? primaryGradient : "#0f151d",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={`ellipsis-${index}`}
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
                  {editingGrupo ? "Editar Equipo" : "Nuevo Equipo"}
                </h3>
                <p className="grupos-modal-subtitle">
                  {editingGrupo
                    ? "Aquí solo puedes actualizar la información general del equipo."
                    : "Completa la información general del equipo y asigna sus miembros iniciales."}
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
                    <div
                      className="grupos-section-icon"
                      style={{
                        background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                        color: "#fff",
                        border: "1px solid rgba(96,165,250,0.35)",
                        boxShadow: "0 10px 24px rgba(37,99,235,0.22)",
                      }}
                    >
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="grupos-section-title">
                        Información General
                      </h4>
                      <p className="grupos-section-text">
                        {editingGrupo
                          ? "Actualiza los datos base del equipo."
                          : "Crea tu equipo."}
                      </p>
                    </div>
                  </div>

                  {editingGrupo && (
                    <div style={{ ...policyNoticeStyle, marginBottom: "1rem" }}>
                      <Lock
                        size={18}
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                      <div style={{ lineHeight: 1.5, fontSize: "0.92rem" }}>
                        En la edición del equipo no se pueden retirar
                        cobradores. La gestión de miembros se realiza desde el
                        botón de
                        <strong> gestionar miembros</strong>. Los miembros ya
                        asignados solo pueden desactivarse.
                      </div>
                    </div>
                  )}

                  <div className="grupos-form-grid">
                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">
                        Nombre del equipo
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
                        placeholder="Ingrese el nombre del equipo"
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
                        style={{ boxSizing: "border-box", width: "100%" }}
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
                        style={{ boxSizing: "border-box", width: "100%" }}
                      />
                    </div>

                    <div className="grupos-form-field">
                      <label className="grupos-detail-label">Calle</label>
                      <select
                        value={formData.calle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            calle: e.target.value,
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

                    {!editingGrupo && (
                      <div className="grupos-form-field">
                        <label className="grupos-detail-label">
                          Fecha de ingreso de cobradores
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_ingreso_cobradores}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              fecha_ingreso_cobradores: e.target.value,
                            }))
                          }
                          className="grupos-form-input grupos-date-input"
                          style={{ boxSizing: "border-box", width: "100%" }}
                        />
                      </div>
                    )}
                  </div>

                  {!editingGrupo ? (
                    <div style={{ marginTop: "1rem" }}>
                      <div
                        style={{ ...policyNoticeStyle, marginBottom: "1rem" }}
                      >
                        <AlertTriangle
                          size={18}
                          style={{ flexShrink: 0, marginTop: "2px" }}
                        />
                        <div style={{ lineHeight: 1.5, fontSize: "0.92rem" }}>
                          Al registrar miembros en el equipo, estos no podrán
                          eliminarse desde este módulo. Posteriormente solo
                          podrán desactivarse.
                        </div>
                      </div>

                      <label
                        className="grupos-detail-label"
                        style={{ display: "block", marginBottom: "0.7rem" }}
                      >
                        Cobradores asignados
                      </label>

                      <div
                        style={{
                          position: "relative",
                          marginBottom: "0.85rem",
                        }}
                      >
                        <Search
                          size={16}
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#3b82f6",
                          }}
                        />
                        <input
                          type="text"
                          value={formCobradorSearch}
                          onChange={(e) =>
                            setFormCobradorSearch(e.target.value)
                          }
                          placeholder="Buscar cobrador por nombre..."
                          style={{
                            ...inputStyle,
                            padding: "0.72rem 1rem 0.72rem 2.4rem",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "0.75rem",
                          maxHeight: "260px",
                          overflowY: "auto",
                          paddingRight: "0.2rem",
                        }}
                      >
                        {filteredFormCobradores.length === 0 && (
                          <div
                            style={{
                              color: "#a1a1aa",
                              fontSize: "0.9rem",
                              padding: "0.75rem",
                            }}
                          >
                            Sin resultados
                          </div>
                        )}

                        {filteredFormCobradores.map((cobrador) => {
                          const checked = formData.cobradores_ids.includes(
                            String(cobrador.id_cobrador),
                          );

                          return (
                            <label
                              key={cobrador.id_cobrador}
                              style={{
                                background: checked
                                  ? "rgba(37,99,235,0.14)"
                                  : "rgba(255,255,255,0.025)",
                                border: checked
                                  ? "1px solid rgba(59,130,246,0.32)"
                                  : "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "14px",
                                padding: "0.85rem 0.95rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleCobradorSelection(
                                    cobrador.id_cobrador,
                                    "form",
                                  )
                                }
                                style={{ accentColor: "#2563eb" }}
                              />
                              <div>
                                <div
                                  style={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.92rem",
                                  }}
                                >
                                  {getCobradorNombre(cobrador)}
                                </div>
                                <div
                                  style={{
                                    color: "#a1a1aa",
                                    fontSize: "0.82rem",
                                    marginTop: "0.18rem",
                                  }}
                                >
                                  ID: {cobrador.id_cobrador}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "1rem" }}>
                      <label
                        className="grupos-detail-label"
                        style={{ display: "block", marginBottom: "0.7rem" }}
                      >
                        Cobradores asignados
                      </label>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "0.75rem",
                        }}
                      >
                        {getActiveMembers(editingGrupo).length === 0 && (
                          <div
                            style={{
                              ...softPanelStyle,
                              padding: "1rem",
                              color: "#a1a1aa",
                              textAlign: "center",
                            }}
                          >
                            Este equipo no tiene cobradores activos.
                          </div>
                        )}

                        {getActiveMembers(editingGrupo).map((cobrador) => (
                          <div
                            key={cobrador.id_cobrador}
                            style={{
                              background: "rgba(255,255,255,0.025)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "14px",
                              padding: "0.9rem 1rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.6rem",
                                marginBottom: "0.35rem",
                              }}
                            >
                              <div
                                style={{
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.92rem",
                                }}
                              >
                                {getCobradorNombre(cobrador)}
                              </div>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "999px",
                                  background: "rgba(250,204,21,0.10)",
                                  border: "1px solid rgba(250,204,21,0.20)",
                                  color: "#fde68a",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Lock size={12} />
                                Bloqueado
                              </span>
                            </div>
                            <div
                              style={{ color: "#a1a1aa", fontSize: "0.82rem" }}
                            >
                              ID: {cobrador.id_cobrador}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                        ? "Actualizar Equipo"
                        : "Crear Equipo"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMembersModalOpen && selectedGrupo && (
        <div className="grupos-modal-overlay" onClick={closeMembersModal}>
          <div
            className="grupos-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "1080px", width: "95%" }}
          >
            <div className="grupos-modal-header">
              <div>
                <h3 className="grupos-modal-title">
                  Cobradores del equipo: {selectedGrupo.nombre_equipo}
                </h3>
                <p className="grupos-modal-subtitle">
                  Aquí solo puedes agregar nuevos cobradores. Los ya asignados
                  no pueden retirarse desde este módulo; si dejan de operar,
                  deben desactivarse.
                </p>
              </div>
              <button
                className="grupos-close-button"
                onClick={closeMembersModal}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grupos-modal-body">
              <div style={{ ...policyNoticeStyle, marginBottom: "1rem" }}>
                <AlertTriangle
                  size={18}
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div style={{ lineHeight: 1.5, fontSize: "0.92rem" }}>
                  Los cobradores marcados como <strong>ya asignados</strong>{" "}
                  quedan bloqueados en esta pantalla. Puedes agregar nuevos
                  miembros, pero no quitar los existentes.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    ...softPanelStyle,
                    padding: "1rem",
                    minHeight: "420px",
                  }}
                >
                  <div style={{ marginBottom: "1rem" }}>
                    <h4
                      style={{
                        margin: 0,
                        color: "#fff",
                        fontSize: "1.02rem",
                        fontWeight: 800,
                      }}
                    >
                      Miembros del equipo
                    </h4>
                    <p
                      style={{
                        margin: "0.35rem 0 0",
                        color: "#a1a1aa",
                        fontSize: "0.9rem",
                      }}
                    >
                      Total seleccionados: {membersSelection.length}
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: "0.85rem" }}>
                    {membersSelection.length === 0 && (
                      <div
                        style={{
                          ...softPanelStyle,
                          padding: "1.2rem",
                          textAlign: "center",
                          color: "#a1a1aa",
                        }}
                      >
                        Este equipo todavía no tiene cobradores seleccionados.
                      </div>
                    )}

                    {cobradores
                      .filter((cobrador) =>
                        membersSelection.includes(String(cobrador.id_cobrador)),
                      )
                      .map((cobrador) => {
                        const isExisting = existingMembersIds.includes(
                          String(cobrador.id_cobrador),
                        );

                        return (
                          <div
                            key={cobrador.id_cobrador}
                            style={{
                              background: "rgba(255,255,255,0.025)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              borderRadius: "16px",
                              padding: "1rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "0.8rem",
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: "1rem",
                                    marginBottom: "0.35rem",
                                  }}
                                >
                                  {getCobradorNombre(cobrador)}
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gap: "0.35rem",
                                    color: "#d4d4d8",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <span>ID: {cobrador.id_cobrador}</span>
                                  <span>
                                    Teléfono:{" "}
                                    {cobrador.telefono || "Sin teléfono"}
                                  </span>
                                </div>
                              </div>

                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  background: isExisting
                                    ? "rgba(250,204,21,0.10)"
                                    : "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(74,222,128,0.12))",
                                  color: isExisting ? "#fde68a" : "#bbf7d0",
                                  border: isExisting
                                    ? "1px solid rgba(250,204,21,0.20)"
                                    : "1px solid rgba(74, 222, 128, 0.24)",
                                  padding: "0.34rem 0.72rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                              >
                                {isExisting ? (
                                  <Lock size={14} />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                {isExisting ? "Ya asignado" : "Nuevo"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div style={{ ...softPanelStyle, padding: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.7rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "14px",
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(59,130,246,0.16)",
                        color: "#bfdbfe",
                        border: "1px solid rgba(59,130,246,0.22)",
                      }}
                    >
                      <UserPlus size={19} />
                    </div>

                    <div>
                      <h4
                        style={{
                          margin: 0,
                          color: "#fff",
                          fontSize: "1.02rem",
                          fontWeight: 800,
                        }}
                      >
                        Agregar cobradores
                      </h4>
                      <p
                        style={{
                          margin: "0.35rem 0 0",
                          color: "#a1a1aa",
                          fontSize: "0.9rem",
                        }}
                      >
                        Puedes seleccionar nuevos miembros para este equipo.
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.45rem",
                        color: "#d4d4d8",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                      }}
                    >
                      Fecha de ingreso de cobradores
                    </label>
                    <input
                      type="date"
                      value={membersFechaIngreso}
                      onChange={(e) => setMembersFechaIngreso(e.target.value)}
                      style={{ ...inputStyle, boxSizing: "border-box" }}
                    />
                  </div>

                  <div
                    style={{ position: "relative", marginBottom: "0.85rem" }}
                  >
                    <Search
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#3b82f6",
                      }}
                    />
                    <input
                      type="text"
                      value={membersCobradorSearch}
                      onChange={(e) => setMembersCobradorSearch(e.target.value)}
                      placeholder="Buscar cobrador por nombre..."
                      style={{
                        ...inputStyle,
                        padding: "0.72rem 1rem 0.72rem 2.4rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "0.75rem",
                      maxHeight: "320px",
                      overflowY: "auto",
                      paddingRight: "0.2rem",
                    }}
                  >
                    {filteredMembersCobradores.length === 0 && (
                      <div
                        style={{
                          color: "#a1a1aa",
                          fontSize: "0.9rem",
                          padding: "0.75rem",
                        }}
                      >
                        Sin resultados
                      </div>
                    )}

                    {filteredMembersCobradores.map((cobrador) => {
                      const checked = membersSelection.includes(
                        String(cobrador.id_cobrador),
                      );
                      const isExisting = existingMembersIds.includes(
                        String(cobrador.id_cobrador),
                      );

                      return (
                        <label
                          key={cobrador.id_cobrador}
                          style={{
                            background: checked
                              ? "rgba(37,99,235,0.14)"
                              : "rgba(255,255,255,0.025)",
                            border: checked
                              ? "1px solid rgba(59,130,246,0.32)"
                              : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            padding: "0.85rem 0.95rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            cursor: isExisting ? "not-allowed" : "pointer",
                            opacity: isExisting ? 0.82 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isExisting}
                            onChange={() =>
                              toggleCobradorSelection(
                                cobrador.id_cobrador,
                                "members",
                              )
                            }
                            style={{ accentColor: "#2563eb" }}
                          />

                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.6rem",
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.92rem",
                                }}
                              >
                                {getCobradorNombre(cobrador)}
                              </div>

                              {isExisting && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    padding: "0.24rem 0.58rem",
                                    borderRadius: "999px",
                                    background: "rgba(250,204,21,0.10)",
                                    border: "1px solid rgba(250,204,21,0.20)",
                                    color: "#fde68a",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  <Lock size={12} />
                                  Ya asignado
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                color: "#a1a1aa",
                                fontSize: "0.82rem",
                                marginTop: "0.18rem",
                              }}
                            >
                              ID: {cobrador.id_cobrador}
                              {cobrador.telefono
                                ? ` • ${cobrador.telefono}`
                                : ""}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.7rem",
                      flexWrap: "wrap",
                      marginTop: "1.2rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleSaveMembers}
                      disabled={savingMembers}
                      style={{
                        ...primaryButton,
                        opacity: savingMembers ? 0.7 : 1,
                        cursor: savingMembers ? "not-allowed" : "pointer",
                      }}
                    >
                      <UserPlus size={17} />{" "}
                      {savingMembers ? "Guardando..." : "Guardar cobradores"}
                    </button>

                    <button
                      type="button"
                      onClick={closeMembersModal}
                      style={secondaryButton}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GruposTable;
