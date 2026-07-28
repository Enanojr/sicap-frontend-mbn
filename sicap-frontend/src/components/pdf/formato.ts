// ── Helpers de formato compartidos por todos los PDFs ────────────────────────
// Antes cada reporte definía su propia copia de estas funciones.

export const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const percent = (value: number) => `${Number(value || 0).toFixed(1)}%`;

export const formatFechaLocal = (fecha?: string | null) => {
  if (!fecha) return "—";
  const clean = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return "—";
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ── Datos institucionales ────────────────────────────────────────────────────

export const DIRECCION_FOOTER = "Guadalupe Hidalgo Acuamanala, C.P. 90860";

export const FIRMANTES = [
  { rol: "Presidente", nombre: "Odilón Paredes Carbajal" },
  { rol: "Tesorero", nombre: "Jaime Paredes González" },
  { rol: "Secretario", nombre: "Antonio Corte Hernández" },
] as const;
