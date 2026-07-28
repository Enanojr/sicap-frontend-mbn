// generate_docx.js — Genera Documentacion_Frontend.docx para el frontend SICAP
// Uso: desde la carpeta docs/ -> `npm install` (una vez) y `npm run generate`
//      (o `node generate_docx.js`). Escribe el .docx en la raíz del repo.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  ImageRun, PageBreak, TableOfContents, Header, Footer, PageNumber,
} = require("docx");

// ── Rutas (relativas a la ubicación de este script: docs/) ────────────────
const REPO_ROOT = path.resolve(__dirname, "..");     // raíz del repositorio
const SHOTS = path.join(__dirname, "screenshots");   // docs/screenshots
const OUT = path.join(REPO_ROOT, "Documentacion_Frontend.docx");

// ── Paleta del documento (monocromática / profesional, sin color) ─────────
const TINTA = "1F2937";     // texto principal (casi negro)
const TITULO = "111827";    // títulos
const GRIS = "6B7280";      // pies de figura / notas neutrales
const TH_FILL = "E5E7EB";   // encabezado de tabla (gris claro)
const TH_TEXT = "111827";
const ZEBRA = "F5F6F8";     // filas alternas (gris muy claro)

// ── PNG helpers ────────────────────────────────────────────────────────────
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
function imagen(nombreArchivo, maxWidth = 600) {
  const file = path.join(SHOTS, nombreArchivo);
  const { width, height } = pngSize(file);
  const w = Math.min(maxWidth, width);
  const h = Math.round((height / width) * w);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(file), transformation: { width: w, height: h } })],
  });
}
// Diagrama rasterizado desde SVG (buffer PNG + dimensiones lógicas)
function diagrama(d, maxWidth = 620) {
  const w = Math.min(maxWidth, d.W);
  const h = Math.round(d.H * (w / d.W));
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 140, after: 60 },
    children: [new ImageRun({ type: "png", data: d.png, transformation: { width: w, height: h } })],
  });
}

// ── Helpers de texto ────────────────────────────────────────────────────────
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, children: [new TextRun({ text: t, color: TITULO, bold: true })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 }, children: [new TextRun({ text: t, color: TITULO, bold: true })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: t, color: TINTA, bold: true })] });
function P(runs, opts = {}) {
  const children = Array.isArray(runs) ? runs : [new TextRun(runs)];
  return new Paragraph({ spacing: { after: 120, line: 276 }, alignment: AlignmentType.JUSTIFIED, children, ...opts });
}
const R = (text, o = {}) => new TextRun({ text, color: TINTA, ...o });
const B = (text) => new TextRun({ text, bold: true, color: TINTA });
const CODE = (text) => new TextRun({ text, font: "Consolas", color: TINTA, size: 19 });
function bullet(runs) { return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: Array.isArray(runs) ? runs : [new TextRun(runs)] }); }
function caption(t) { return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: t, italics: true, size: 18, color: GRIS })] }); }
const paso = (n, runs) => new Paragraph({ spacing: { after: 90, line: 276 }, children: [new TextRun({ text: `Paso ${n}. `, bold: true, color: TITULO }), ...(Array.isArray(runs) ? runs : [new TextRun(runs)])] });

// ── Tablas ─────────────────────────────────────────────────────────────────
function cell(content, { header = false, fill, width, bold = false, align } = {}) {
  const runs = Array.isArray(content) ? content : [new TextRun({ text: String(content), bold: header || bold, color: header ? TH_TEXT : TINTA, size: 19 })];
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: (header || fill) ? { type: ShadingType.CLEAR, color: "auto", fill: header ? TH_FILL : fill } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ alignment: align || AlignmentType.LEFT, children: runs })],
  });
}
function tabla(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 2, color: "C7CBD1" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, width: widths && widths[i] })) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { fill: ri % 2 ? ZEBRA : undefined, width: widths && widths[i] })) })),
    ],
  });
}
function mono(lines) {
  const runs = [];
  lines.forEach((ln, i) => { if (i > 0) runs.push(new TextRun({ text: "", break: 1 })); runs.push(new TextRun({ text: ln, font: "Consolas", size: 18, color: TINTA })); });
  return new Paragraph({ spacing: { before: 80, after: 140 }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "F5F6F8" }, children: runs });
}

// ════════════════════════════════════════════════════════════════════════
//  DIAGRAMAS (SVG -> PNG con sharp, en escala de grises)
// ════════════════════════════════════════════════════════════════════════
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SVG_DEFS = `<defs><marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,3 L0,6 Z" fill="#333"/></marker></defs>`;
const FONT = "Segoe UI, Arial, sans-serif";

function box(x, y, w, h, lines, opts = {}) {
  lines = Array.isArray(lines) ? lines : [lines];
  const fsz = opts.fontSize || 13, lh = fsz + 4;
  const cx = x + w / 2, cy = y + h / 2;
  const startY = cy - (lines.length - 1) * lh / 2;
  const tsp = lines.map((ln, i) => `<tspan x="${cx}" y="${startY + i * lh}">${esc(ln)}</tspan>`).join("");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opts.rx != null ? opts.rx : 6}" fill="${opts.fill || "#ffffff"}" stroke="${opts.stroke || "#333"}" stroke-width="1.4"/>`
    + `<text text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="${fsz}" font-weight="${opts.bold ? "700" : "400"}" fill="#111">${tsp}</text>`;
}
const vline = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="1.4" marker-end="url(#arr)"/>`;
const plainline = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="1.4"/>`;
function label(x, y, t, opts = {}) { return `<text x="${x}" y="${y}" text-anchor="${opts.anchor || "middle"}" font-family="${FONT}" font-size="${opts.fontSize || 11}" font-style="${opts.italic ? "italic" : "normal"}" font-weight="${opts.bold ? "700" : "400"}" fill="#111">${esc(t)}</text>`; }

async function svgPng(inner, W, H) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${SVG_DEFS}<rect width="${W}" height="${H}" fill="#ffffff"/>${inner}</svg>`;
  const png = await sharp(Buffer.from(svg)).resize({ width: W * 2 }).png().toBuffer();
  return { png, W, H };
}

// Columna de opciones apiladas (para el diagrama general)
function columna(x, y, w, items, { h = 30, gap = 8, fontSize = 12 } = {}) {
  return items.map((t, i) => box(x, y + i * (h + gap), w, h, t, { fontSize, fill: "#ffffff" })).join("");
}

// 9.1 Diagrama general de uso del sistema
async function buildGeneral() {
  const W = 780, H = 560;
  let s = "";
  // Cabecera del flujo
  s += box(310, 16, 160, 40, "Inicio de sesión", { bold: true, fill: "#eef0f3" });
  s += vline(390, 56, 390, 78);
  s += box(280, 78, 220, 42, ["Menú principal / Perfil", "(opciones según el rol)"], { bold: true, fill: "#eef0f3", fontSize: 12 });
  // Tres grupos
  s += box(20, 150, 230, 34, "Operación — todos los roles", { bold: true, fill: "#e2e5ea" });
  s += box(275, 150, 230, 34, "Panel de administración", { bold: true, fill: "#e2e5ea" });
  s += box(530, 150, 230, 34, "Panel de tesorería", { bold: true, fill: "#e2e5ea" });
  // Conectores del menú a los grupos
  s += plainline(390, 120, 390, 136); s += plainline(135, 136, 645, 136);
  s += vline(135, 136, 135, 150); s += vline(390, 136, 390, 150); s += vline(645, 136, 645, 150);
  // Columnas
  s += columna(20, 194, 230, [
    "Consulta de pagos", "Pagos", "Registro / consulta de cuentahabientes",
    "Estado de cuenta", "Cargos y abonos", "Corte de caja", "Reportes",
  ], { fontSize: 11.5 });
  s += columna(275, 194, 230, [
    "Registro de administradores", "Registro de cobradores", "Registro de descuentos",
    "Registro de servicios", "Registro de tipos de cargo", "Gestión de grupos",
    "Gestión de calles", "Cierre anual",
  ], { fontSize: 11.5 });
  s += columna(530, 194, 230, ["Gestión de egresos", "Corte de caja"], { fontSize: 11.5 });
  return svgPng(s, W, H);
}

// 9.2 Flujo de registro de pagos
async function buildPagos() {
  const W = 760, H = 270;
  const w = 150, h = 46, y = 24;
  const xs = [16, 196, 376, 556];
  let s = "";
  s += box(xs[0], y, w, h, ["Seleccionar", "cuentahabiente"]);
  s += box(xs[1], y, w, h, ["Fecha, monto,", "mes y año"]);
  s += box(xs[2], y, w, h, ["Descuento", "(importe fijo, opc.)"], { fontSize: 11.5 });
  s += box(xs[3], y, w, h, ["Registrar", "pago"], { fill: "#eef0f3", bold: true });
  for (let i = 0; i < 3; i++) s += vline(xs[i] + w, y + h / 2, xs[i + 1], y + h / 2);
  // Decisión, situada bajo "Registrar pago"
  const dx = xs[3], dw = w, dcx = dx + dw / 2;
  s += vline(dcx, y + h, dcx, 116);
  s += box(dx, 116, dw, 44, "¿Cargos pendientes?", { fill: "#e2e5ea", bold: true, fontSize: 11.5 });
  // Rama Sí -> pago rechazado (debajo de la decisión)
  s += vline(dcx, 160, dcx, 206); s += label(dcx + 22, 190, "Sí (400)", { fontSize: 10.5, anchor: "start" });
  s += box(dx, 206, dw, 44, ["Pago rechazado:", "liquidar cargos"], { fontSize: 11.5 });
  // Rama No -> ticket (a la izquierda)
  s += vline(dx, 138, xs[0] + w, 138); s += label((dx + xs[0] + w) / 2, 128, "No", { fontSize: 10.5 });
  s += box(xs[0], 116, w, 44, ["Ticket de pago", "(descarga PDF)"], { fill: "#eef0f3" });
  // Ticket -> consulta de pagos
  s += vline(xs[0] + w / 2, 160, xs[0] + w / 2, 206);
  s += box(xs[0], 206, w, 40, "Consulta de pagos");
  return svgPng(s, W, H);
}

// 9.3 Flujo de cargos y abonos
async function buildCargos() {
  const W = 760, H = 300;
  let s = "";
  s += label(200, 24, "Registrar cargo (deuda)", { bold: true, fontSize: 13 });
  s += label(575, 24, "Registrar abono (pago de cargo)", { bold: true, fontSize: 13 });
  s += plainline(390, 12, 390, 288);
  const h = 44, w = 150, x = 40;
  const yA = [44, 118, 192];
  s += box(x, yA[0], w, h, ["Seleccionar", "cuentahabiente"]);
  s += box(x, yA[1], w, h, ["Tipo de cargo", "(monto fijo)"]);
  s += box(x, yA[2], w, h, "Registrar cargo", { fill: "#eef0f3", bold: true });
  s += vline(x + w / 2, yA[0] + h, x + w / 2, yA[1]);
  s += vline(x + w / 2, yA[1] + h, x + w / 2, yA[2]);
  const x2 = 430;
  const yB = [44, 108, 172, 236];
  s += box(x2, yB[0], w, 40, ["Seleccionar deudor", "(con cargos activos)"], { fontSize: 11 });
  s += box(x2, yB[1], w, 40, "Ver cargos pendientes", { fontSize: 11 });
  s += box(x2, yB[2], w, 40, ["Monto del abono", "(≤ total)"], { fontSize: 11 });
  s += box(x2, yB[3], w, 40, "Procesar pago → ticket", { fill: "#eef0f3", fontSize: 11 });
  for (let i = 0; i < 3; i++) s += vline(x2 + w / 2, yB[i] + 40, x2 + w / 2, yB[i + 1]);
  return svgPng(s, W, H);
}

// 9.4 Flujo de corte de caja
async function buildCorte() {
  const W = 760, H = 190;
  const y = 30, h = 50, w = 128;
  const xs = [16, 168, 320, 472, 624];
  let s = "";
  s += box(xs[0], y, w, h, ["Cobrador o", "corte general"]);
  s += box(xs[1], y, w, h, ["Rango de", "fechas"]);
  s += box(xs[2], y, w, h, "Generar corte", { fill: "#eef0f3", bold: true });
  s += box(xs[3], y, w, h, ["Resumen:", "pagos / cargos"]);
  s += box(xs[4], y, w, h, ["Descargar", "PDF"], { fill: "#eef0f3" });
  for (let i = 0; i < 4; i++) s += vline(xs[i] + w, y + h / 2, xs[i + 1], y + h / 2);
  s += box(240, 120, 300, 48, ["gran_total = total_pagos_normales", "+ total_pagos_cargos"], { fontSize: 11.5, rx: 4 });
  s += vline(xs[3] + w / 2, y + h, xs[3] + w / 2, 120);
  return svgPng(s, W, H);
}

// 9.5 Flujo de estado de cuenta
async function buildEstado() {
  const W = 720, H = 130;
  const y = 34, h = 52, w = 180;
  const xs = [30, 270, 510];
  let s = "";
  s += box(xs[0], y, w, h, ["Buscar cuentahabiente", "(nombre / contrato)"]);
  s += box(xs[1], y, w, h, "Seleccionar año");
  s += box(xs[2], y, w, h, ["Descargar PDF:", "histórico + saldo + cargos"], { fill: "#eef0f3", fontSize: 11.5 });
  for (let i = 0; i < 2; i++) s += vline(xs[i] + w, y + h / 2, xs[i + 1], y + h / 2);
  return svgPng(s, W, H);
}

// ════════════════════════════════════════════════════════════════════════
//  CONSTRUCCIÓN DEL DOCUMENTO
// ════════════════════════════════════════════════════════════════════════
(async () => {
  const dGeneral = await buildGeneral();
  const dPagos = await buildPagos();
  const dCargos = await buildCargos();
  const dCorte = await buildCorte();
  const dEstado = await buildEstado();

  const children = [];

  // ── PORTADA ──
  children.push(
    new Paragraph({ spacing: { before: 2600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Documentación Técnica", bold: true, size: 64, color: TITULO })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Frontend del Sistema SICAP", bold: true, size: 40, color: TINTA })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sistema Integral de Control de Agua Potable", italics: true, size: 24, color: GRIS })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "9CA3AF" } }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "Arquitectura · Módulos · Sistema de Diseño · Reglas de Negocio", size: 22, color: TINTA })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800 }, children: [new TextRun({ text: "Stack: React 19 · TypeScript 5.9 · Vite 7", size: 20, color: GRIS })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── CONTENIDO ──
  children.push(
    H1("Contenido"),
    new TableOfContents("Tabla de contenido", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "En Word, actualice la tabla (clic derecho → Actualizar campos) para regenerar la numeración de páginas.", italics: true, size: 18, color: GRIS })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── 1. RESUMEN EJECUTIVO ──
  children.push(
    H1("1. Resumen ejecutivo"),
    P([R("El frontend de SICAP es una aplicación de página única (SPA) construida con "), B("React 19.2, TypeScript 5.9 y Vite 7"), R(", que gestiona el ciclo completo de cobro de agua potable: padrón de cuentahabientes, pagos, cargos y deudas, descuentos, estados de cuenta, tesorería, cortes de caja, cierre anual y reportería.")]),
    P([R("La aplicación se estructura en tres capas: una "), B("capa de servicios"), R(" ("), CODE("src/services/*.service.ts"), R(") que encapsula el acceso HTTP mediante una instancia central de Axios; una capa de "), B("componentes reutilizables"), R(" (tablas, formularios, tickets y tarjetas); y una capa de "), B("páginas"), R(" organizadas por dominio. La navegación se resuelve con el enrutador de datos de React Router 7 y el acceso se protege mediante autenticación basada en JWT.")]),
  );

  // ── 2. ARQUITECTURA Y STACK ──
  children.push(
    H1("2. Arquitectura y stack tecnológico"),
    H2("2.1 Stack principal"),
    tabla(["Capa", "Tecnología", "Notas"], [
      ["Build / Dev server", "Vite 7", "Scripts: dev, build (tsc -b && vite build), preview"],
      ["Librería UI", "React 19.2", "Con babel-plugin-react-compiler (React Compiler)"],
      ["Lenguaje", "TypeScript 5.9", "strict, moduleResolution bundler, verbatimModuleSyntax"],
      ["Enrutamiento", "react-router-dom 7", "createBrowserRouter (enrutador de datos)"],
      ["Cliente HTTP", "Axios 1.12", "Instancia central con interceptores"],
      ["Generación PDF", "@react-pdf/renderer 4, jspdf 4, jspdf-autotable 5", "Estados de cuenta, tickets, cortes y reportes"],
      ["UI / UX", "lucide-react, react-icons, sweetalert2, recharts 3, react-date-range", "Iconografía, alertas, gráficas y rangos de fecha"],
      ["Estilos", "CSS global", "Sin Tailwind ni CSS-in-JS"],
    ], [22, 40, 38]),
    H2("2.2 Configuración de TypeScript"),
    P([R("El proyecto emplea referencias de proyecto ("), CODE("tsconfig.app.json"), R(" y "), CODE("tsconfig.node.json"), R("), con una configuración estricta orientada a bundler:")]),
    bullet([B("target/lib: "), R("ES2022, DOM, DOM.Iterable.")]),
    bullet([B("moduleResolution: bundler"), R(" con "), CODE("allowImportingTsExtensions"), R(" y "), CODE("verbatimModuleSyntax"), R(" (imports de tipo explícitos con "), CODE("import type"), R(").")]),
    bullet([B("Reglas de compilador: "), CODE("strict"), R(", "), CODE("noUnusedLocals"), R(", "), CODE("noUnusedParameters"), R(", "), CODE("noFallthroughCasesInSwitch"), R(", "), CODE("erasableSyntaxOnly"), R(".")]),
    H2("2.3 Cliente HTTP central (api_axios.ts)"),
    P([R("Todo el tráfico de red se canaliza a través de una única instancia de Axios ("), CODE("src/api_axios.ts"), R(") con "), CODE("baseURL = import.meta.env.VITE_API_URL"), R(" y un timeout de 30 s. Define dos interceptores:")]),
    bullet([B("Request: "), R("añade el encabezado "), CODE("Authorization: Bearer <token>"), R(" a partir del token almacenado en "), CODE("localStorage('access')"), R(".")]),
    bullet([B("Response — reintentos: "), R("ante "), CODE("429"), R(" o "), CODE("503"), R(" reintenta hasta 4 veces con retroceso exponencial (1 s, 2 s, 4 s, 8 s) más jitter, respetando la cabecera "), CODE("Retry-After"), R(".")]),
    bullet([B("Response — sesión: "), R("ante "), CODE("401"), R(" limpia "), CODE("access"), R(" y "), CODE("usuario"), R(" de localStorage y redirige a "), CODE("/login"), R(".")]),
    H2("2.4 Composición de providers y arranque"),
    P([R("El punto de entrada ("), CODE("main.tsx"), R(") compone la aplicación en el orden "), CODE("StrictMode → ThemeProvider → AuthProvider → RouterProvider"), R(", de modo que tema y sesión están disponibles en todo el árbol antes de renderizar cualquier ruta.")]),
    H2("2.5 Enrutamiento y rutas disponibles"),
    P([R("Las rutas se declaran en "), CODE("src/routes/rutas.tsx"), R(". Las rutas "), CODE("/"), R(" y "), CODE("/Login"), R(" son públicas; el resto se envuelve en "), CODE("<ProtectedRoute>"), R(" (verifica "), CODE("isAuthenticated"), R(") y en "), CODE("<RootLayout>"), R(", que monta el "), CODE("Navbar"), R(" y un "), CODE("<Outlet/>"), R(". La ruta comodín "), CODE("*"), R(" redirige a "), CODE("/Login"), R(". La visibilidad de cada opción depende del rol ("), CODE("usuario.role"), R("): el Panel de Administración se ofrece a "), CODE("admin"), R(", "), CODE("supervisor"), R(", "), CODE("tesorero_sr"), R(" y "), CODE("tesorero_jr"), R(".")]),
    P([B("Rutas disponibles y su módulo:")]),
    tabla(["Ruta", "Vista", "Módulo"], [
      ["/ , /Login", "Login", "Autenticación y seguridad"],
      ["/Home", "Home", "Inicio"],
      ["/Main_Card", "Main_Card", "Navegación — Panel principal"],
      ["/Admin_Cards", "Admin_Cards", "Navegación — Panel de administración"],
      ["/Tabla", "ContractTable", "Consulta de pagos"],
      ["/Pago", "FormularioPago", "Pagos"],
      ["/Rcuentahabiente", "CuentahabientesPage", "Cuentahabientes (padrón)"],
      ["/estadocuenta", "EstadoCuentaPage", "Estado de cuenta"],
      ["/cargos", "CargosManager", "Cargos y deudas"],
      ["/tcargos", "CargosPage", "Cargos — tipos de cargo"],
      ["/Descuento", "DescuentosPage", "Descuentos"],
      ["/servicios", "ServiciosPage", "Catálogos administrativos"],
      ["/Radmin", "RegisterAdmin", "Catálogos administrativos"],
      ["/Rcobradores", "CobradoresPage", "Catálogos administrativos"],
      ["/grupos", "Grupos", "Catálogos administrativos"],
      ["/calles", "CallesPage", "Catálogos administrativos"],
      ["/cierreanual", "CierreAnual", "Cierre anual"],
      ["/tesoreria", "Tesoreria_Cards", "Tesorería — navegación"],
      ["/egresos , /tabla_egresos , /main_egresos", "Egresos / Histórico / Dashboard", "Tesorería"],
      ["/corte-caja", "CorteCaja", "Cortes de caja"],
      ["/corte-junior , /corte-senior , /Corte-cards", "CorteJunior / CorteSenior / Corte_Cards", "Cortes de caja"],
      ["/Menu_reporte", "Menu_reporte", "Reportería — navegación"],
      ["/reportes , /reporteCalle , /reporteCargos , /reportePadron", "Reporte / ReporteCalles / ReporteCargos / Padrón", "Reportería"],
    ], [30, 34, 36]),
    H2("2.6 Inventario de endpoints de API"),
    P([R("Cada dominio dispone de su servicio en "), CODE("src/services/"), R(". Las rutas se expresan relativas a "), CODE("VITE_API_URL"), R(". Un subconjunto de endpoints incorpora el prefijo "), CODE("/api/"), R(" (corte de caja y vistas de reportes) mientras el resto se consume sin dicho prefijo.")]),
    tabla(["Dominio", "Endpoint(s)", "Servicio"], [
      ["Autenticación / registro", "/auth/login/, /auth/…", "auth.service, Radmin.service, Rcobradores.service"],
      ["Cuentahabientes", "/cuentahabientes/, /r-cuentahabientes/", "Rcuentahabientes.service, cuentahabientestabla.service"],
      ["Pagos", "/pago/", "pago.service"],
      ["Cargos", "/cargos/, /pagar-cargo/, /tipos-cargo/", "cargos.service, tcargos.service"],
      ["Descuentos", "/descuentos/", "descuento.service"],
      ["Estado de cuenta", "/estado-cuenta/, /estado-cuenta-resumen/, /vista-cargos/", "Estado_cuenta.service, estado_cuenta_resumen, estado_cuenta_cargos"],
      ["Servicios / Grupos / Calles", "/servicios/, /equipos/, /calles/", "servicios.service, grupos.service, calle.service"],
      ["Tesorería", "/ingresos/, /egresos/", "ingresos.service, egresos.service"],
      ["Corte de caja", "/api/corte/generar/", "CorteCaja/Jr/Sr.service"],
      ["Reportes / vistas", "/api/vista-pagos/, /api/vista-historial/, /api/vista-deudores/, /reporte-padron-general/, /reporte-cargos/", "views.service, deudores.service, reporte_*"],
    ], [26, 46, 28]),
  );

  // ── 3. DISTRIBUCIÓN DE CARPETAS ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    H1("3. Distribución de carpetas"),
    P([R("La estructura bajo "), CODE("src/"), R(" separa responsabilidades por tipo y por dominio:")]),
    tabla(["Directorio", "Propósito"], [
      ["api_axios.ts", "Cliente Axios único: baseURL, interceptores de autenticación y reintentos, manejo de 401."],
      ["main.tsx", "Arranque de React y composición de providers (Theme, Auth, Router)."],
      ["routes/", "rutas.tsx (createBrowserRouter) y ProtectedRoute.tsx (guard de autenticación)."],
      ["services/", "Capa de acceso a API por dominio (*.service.ts), contextos (auth, theme), utilidades (paginacion.ts → fetchAllPages) y vistas de solo lectura (estado_cuenta_*, views.service, reporte_*)."],
      ["components/", "Reutilizables: tablas (registros_general y registro_* por entidad), forms (formulario reutilizable, pago, servicios, descuentos, tickets), cards, navbar, layout, botones, pdf / pdfCortes, searchselect."],
      ["pages/", "Vistas por módulo: Login, Home (paneles por rol), Principal_Form_Table, cargos, Estado_Cuenta, tesoreria, CorteCaja/Junior/Senior, reportes, cierre_anual y catálogos (Radmin, Rcobradores, calles, grupos)."],
      ["styles/", "styles.css: hoja global con el sistema visual."],
      ["assets/", "Recursos estáticos: logotipo e íconos."],
    ], [22, 78]),
  );

  // ── 4. MÓDULOS FUNCIONALES ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    H1("4. Módulos funcionales"),
    P([R("El sistema se organiza en los siguientes módulos funcionales, con sus vistas y servicios asociados:")]),
    tabla(["Módulo", "Componentes / Vistas", "Servicios"], [
      ["Autenticación y seguridad", "Login, RootLayout, ProtectedRoute", "authcontext, auth.context, auth.service, api_axios"],
      ["Navegación por rol", "Main_Cards, Admin_Cards, Tesorero_Cards, Corte_cards, Menu_reporte, Navbar, WaterServiceCard", "auth.context (role)"],
      ["Cuentahabientes (padrón)", "cuentahabientespage, registro_cuentahabientes, form", "Rcuentahabientes.service, cuentahabientestabla.service"],
      ["Pagos", "form_pago, ticket, ticket_pdf", "pago.service, descuento.service"],
      ["Cargos y deudas", "cargos.tsx, tcargos, TicketCargo", "cargos.service, tcargos.service"],
      ["Descuentos", "form_descuentos, descuentospage", "descuento.service"],
      ["Estado de cuenta", "estado_cuenta.tsx, EstadoCuentaPDF", "Estado_cuenta.service, estado_cuenta_resumen, estado_cuenta_cargos"],
      ["Catálogos administrativos", "Radmin, Rcobradores, servicios, grupos, calles", "Radmin.service, Rcobradores.service, servicios.service, grupos.service, calle.service"],
      ["Tesorería", "formulario_egresos, tabla_egresos, tabla_ingresos, main_egresos", "egresos.service, ingresos.service"],
      ["Cortes de caja", "CorteCaja, CorteJunior, CorteSenior, CortePDF", "CorteCaja.service, CorteJr.service, CorteSr.service"],
      ["Cierre anual", "cierreanual", "cierreanual.service"],
      ["Reportería", "menu_reporte, reportes, reportepage_calles, padron, cargos, PDFs", "reporte_cobradores, reporte_padron, reporte.cargos, deudores.service"],
      ["Consulta de pagos", "tabla (ContractTable), registros_general", "views.service, paginacion"],
    ], [24, 44, 32]),
  );

  // ── 5. SISTEMA DE DISEÑO ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    H1("5. Sistema de diseño"),
    P([R("El diseño reside en CSS global ("), CODE("src/styles/styles.css"), R(", "), CODE("src/index.css"), R("). La interfaz presenta un tema oscuro con acentos en azul.")]),
    H2("5.1 Tipografía"),
    bullet([B("Familia principal: "), CODE("\"Poppins\", Arial, sans-serif"), R(" — aplicada al cuerpo, formularios, tablas, tarjetas y a los cuadros de diálogo de SweetAlert.")]),
    bullet([B("Excepción monoespaciada: "), CODE("\"Courier New\""), R(" — reservada a los importes de los tickets ("), CODE(".ticket-amount-value"), R(").")]),
    H3("Escala tipográfica"),
    tabla(["Elemento", "Tamaño / Peso", "Notas"], [
      ["Títulos de sección / tarjeta", "1.75 – 2 rem / 700", "Color de acento"],
      ["Importe de ticket", "42 px / 700", "Courier New, monoespaciada"],
      ["Etiquetas de formulario", "0.875 rem / 500", "—"],
      ["Campos (inputs / selects)", "0.95 rem", "—"],
      ["Encabezados de tabla", "0.85 rem / 600", "mayúsculas, letter-spacing 0.5px"],
      ["Badges de estado", "0.8 rem / 600", "borde redondeado (pill)"],
    ], [40, 30, 30]),
    H2("5.2 Paleta de colores"),
    P([R("Colores definidos en las hojas de estilo de la aplicación:")]),
    tabla(["Hex", "Nombre", "Uso"], [
      ["#58B2EE", "Primario / acento", "Botones, títulos, bordes de foco, divisores"],
      ["#2F91D5", "Primario (hover)", "Estado hover de botones primarios"],
      ["#2F3B7E", "Azul marino", "Bordes de modales, acentos, líneas divisorias"],
      ["#1A1D23", "Fondo de tarjeta", "Tarjetas, tablas, contenedores principales"],
      ["#2B2E35", "Fondo de campo", "Inputs, encabezados de tabla, menús desplegables"],
      ["#242424", "Fondo general", "Fondo global de la interfaz"],
      ["#22C55E", "Éxito", "Estados completados, saldos en cero"],
      ["#FBBF24", "Advertencia", "Estados de atención"],
      ["#EF4444", "Error / peligro", "Botón eliminar, saldos pendientes, errores"],
      ["#3B82F6", "Información", "Botón editar, banners de edición"],
    ], [22, 30, 48]),
    H2("5.3 Tema de la interfaz"),
    P([R("La plataforma utiliza un "), B("tema oscuro (negro) único"), R(". El texto se presenta en "), CODE("rgba(255,255,255,.87)"), R(" sobre fondos oscuros ("), CODE("#242424"), R(", "), CODE("#1A1D23"), R("), con el color de acento "), CODE("#58B2EE"), R(" para elementos interactivos.")]),
    H2("5.4 Componentes visuales reutilizables"),
    bullet([B("Tarjetas de módulo ("), CODE(".waterCard"), R(", "), CODE(".cards-grid"), R("): gradiente por tarjeta y animaciones de entrada.")]),
    bullet([B("Tabla reutilizable ("), CODE(".data-table"), R(" / "), CODE("registros_general"), R("): barra de herramientas con filtros, búsqueda, paginación y badges de estado.")]),
    bullet([B("Formularios ("), CODE(".register-card"), R(", "), CODE(".form-*"), R("), tickets ("), CODE(".ticket-*"), R(") y modales ("), CODE(".modal-*"), R(").")]),
  );

  // ── 6. MODELO DE DATOS Y REGLAS DE NEGOCIO ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    H1("6. Modelo de datos y reglas de negocio"),
    P([R("Este capítulo describe las estructuras de datos que consume la interfaz y las convenciones lógicas y financieras que rigen el sistema.")]),
    H2("6.1 Estructuras de datos principales"),
    P([R("El detalle exhaustivo a nivel de campo corresponde al diccionario de datos. Aquí se resumen las estructuras principales que la interfaz recibe del backend:")]),
    tabla(["Estructura", "Campos relevantes"], [
      ["CuentahabienteResponse", "numero_contrato, nombres/ap/am, calle_fk, colonia, servicio, es_toma_nueva, deuda, saldo_pendiente"],
      ["CargoResponse", "id_cargo, cuentahabiente(+nombre), tipo_cargo_detalle{id,nombre,monto}, monto_cargo, saldo_restante_cargo, activo"],
      ["EstadoCuentaResumenRow", "id_cuentahabiente, numero_contrato, anio, nombre_servicio, estatus, saldo_pendiente"],
      ["VistaCargosRow", "saldo_restante_cargo, anio_cargo, desglose_pagos, cargo_activo"],
      ["DescuentoResponse", "id_descuento, nombre_descuento, porcentaje, activo"],
      ["Deudor", "id_cuentahabiente, nombre_cuentahabiente, monto_total, estatus, nombre_colonia"],
      ["CorteInfo", "total_pagos_normales, total_pagos_cargos, gran_total; Movimiento.tipo: 'Pago' | 'Cargo'"],
    ], [30, 70]),
    H2("6.2 Distinción entre cargos y pagos pendientes"),
    P([R("El sistema maneja dos conceptos financieros diferenciados:")]),
    bullet([B("Cargo pendiente"), R(" — una deuda puntual creada por un administrador (por ejemplo, una reconexión). Un cargo permanece pendiente mientras "), CODE("activo === true && saldo_restante_cargo > 0"), R(".")]),
    bullet([B("Pago pendiente"), R(" — el adeudo del servicio de agua por anualidad, representado como "), CODE("saldo_pendiente"), R(" en el resumen de estado de cuenta y como "), CODE("monto_total"), R(" en la vista de deudores.")]),
    P([R("En la pantalla de cargos, el «Total pendiente» corresponde a la suma de "), CODE("saldo_restante_cargo"), R(" de los cargos activos del cuentahabiente, magnitud independiente del "), CODE("saldo_pendiente"), R(" del servicio.")]),
    H3("Regla de prioridad de liquidación"),
    P([R("Un pago de servicio no puede registrarse mientras el cuentahabiente conserve cargos pendientes: el backend responde "), B("HTTP 400"), R(" y la interfaz indica que deben completarse los cargos antes de realizar el pago. Los cargos se liquidan con prioridad sobre el pago del servicio.")]),
    H2("6.3 Tratamiento del descuento como importe fijo"),
    P([R("El campo "), CODE("porcentaje"), R(" del descuento se aplica como "), B("importe fijo en pesos"), R(", restándose directamente del monto:")]),
    mono(["cantidadDescuento = parseFloat(descuento.porcentaje);", "montoFinal = montoOriginal - cantidadDescuento;"]),
    P([R("No se realiza ningún cálculo proporcional del tipo "), CODE("monto * porcentaje / 100"), R(". El ticket registra "), CODE("porcentaje_descuento = cantidadDescuento"), R(" (el importe descontado).")]),
    H2("6.4 Representación del saldo de cargos en las vistas"),
    bullet([B("Historial de cargos: "), R("el saldo se muestra en rojo cuando es mayor que cero y en verde cuando es cero; se formatea con "), CODE("toFixed(2)"), R(".")]),
    bullet([B("Panel de cargos activos: "), R("lista cada "), CODE("saldo_restante_cargo"), R(" y presenta un «Total pendiente».")]),
    bullet([B("Aplicación del pago: "), R("el abono ("), CODE("/pagar-cargo/"), R(") se aplica al saldo global, reduciendo los cargos activos.")]),
    bullet([B("Alta de cargo: "), R("el campo "), CODE("monto_cargo"), R(" es de solo lectura; lo determina el catálogo de tipos de cargo ("), CODE("tcargos"), R("), con un monto fijo por concepto.")]),
    H2("6.5 Composición del total en el corte de caja"),
    P([R("El corte de caja separa las fuentes de ingreso para su trazabilidad contable:")]),
    bullet([CODE("total_pagos_normales"), R(" — recaudación por el servicio de agua.")]),
    bullet([CODE("total_pagos_cargos"), R(" — abonos aplicados a cargos y deudas.")]),
    bullet([CODE("gran_total"), R(" — suma de ambos. Cada "), CODE("Movimiento"), R(" se etiqueta con "), CODE("tipo: 'Pago' | 'Cargo'"), R(".")]),
  );

  // ── 7. VISTAS PRINCIPALES ──
  const vistas = [
    ["login.png", "Inicio de sesión", "Pantalla pública de autenticación; al validar credenciales se obtiene el token que Axios inyecta en cada petición."],
    ["panel_principal.png", "Panel principal", "Accesos a las funciones operativas: consulta de pagos, pagos, cuentahabientes, estado de cuenta, cargos, corte de caja y reportes."],
    ["panel_admin.png", "Panel de administración", "Gestión del sistema para roles administrativos: administradores, cobradores, descuentos, servicios, cargos, grupos, calles y cierre anual."],
    ["cuentahabientes.png", "Cuentahabientes (padrón)", "Registro y consulta del padrón mediante la tabla reutilizable con búsqueda, filtros y paginación."],
    ["registro_pago.png", "Registro de pagos", "Cobro del servicio con búsqueda de cuentahabiente, descuento opcional (importe fijo) y emisión de ticket."],
    ["gestion_cargos.png", "Gestión de cargos y pagos", "Alta de cargos con monto fijo por tipo y abono a cargos activos, con el total pendiente por cuentahabiente."],
    ["estado_cuenta.png", "Estado de cuenta", "Selección de año y generación de PDF con histórico de movimientos, resumen y cargos del periodo."],
    ["descuentos.png", "Registro de descuentos", "Catálogo de descuentos, administrados como importe fijo restado al pago."],
    ["corte_caja.png", "Corte de caja", "Generación de corte por rango de fechas y cobrador, distinguiendo pagos normales, pagos de cargos y gran total."],
    ["tesoreria.png", "Módulo de tesorería", "Punto de acceso a la gestión de egresos y a los cortes de caja del área de tesorería."],
    ["egresos.png", "Gestión de egresos", "Registro y consulta histórica de egresos del sistema."],
    ["menu_reportes.png", "Menú de reportería", "Generación de reportes por cobrador, por calle, por cargos y padrón general de usuarios."],
    ["consulta_pagos.png", "Consulta de pagos", "Tabla de consulta de los pagos realizados por los cuentahabientes."],
  ];
  children.push(new Paragraph({ children: [new PageBreak()] }), H1("7. Vistas principales del sistema"));
  for (const [file, titulo, desc] of vistas) { children.push(H2(titulo), imagen(file, 600), caption(desc)); }

  // ── 8. PUESTA EN MARCHA Y GUÍA DE DESARROLLO ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    H1("8. Puesta en marcha y guía de desarrollo"),
    H2("8.1 Instalación y ejecución"),
    P([B("Requisitos: "), R("Node.js ≥ 20.19 (recomendado 22 LTS o superior) y npm. El frontend reside en el subdirectorio "), CODE("sicap-frontend/"), R(".")]),
    paso(1, [R("Instalar dependencias: "), CODE("cd sicap-frontend && npm install"), R(".")]),
    paso(2, [R("Crear el archivo "), CODE(".env"), R(" en "), CODE("sicap-frontend/"), R(" con la variable "), CODE("VITE_API_URL"), R(" apuntando a la URL base del backend (por ejemplo "), CODE("VITE_API_URL=http://localhost:8000"), R("). Esta variable es indispensable para la comunicación con el servidor.")]),
    paso(3, [R("Levantar el entorno de desarrollo: "), CODE("npm run dev"), R(" (Vite sirve en "), CODE("http://localhost:5173"), R(" con recarga en caliente).")]),
    paso(4, [R("Build de producción: "), CODE("npm run build"), R(". Análisis estático: "), CODE("npm run lint"), R(". Previsualización: "), CODE("npm run preview"), R(".")]),
    P([R("El backend debe tener CORS habilitado para el origen del frontend, dado que la aplicación consume la API directamente sin proxy de desarrollo.")]),
    H2("8.2 Dependencia del backend"),
    P([R("El frontend consume un backend Django REST Framework con autenticación JWT y paginación estándar ("), CODE("{ count, next, previous, results }"), R("). La utilidad "), CODE("services/paginacion.ts → fetchAllPages()"), R(" recorre automáticamente todas las páginas siguiendo "), CODE("next"), R(", con caché en memoria en los catálogos.")]),
    H2("8.3 Flujo de autenticación"),
    mono([
      "POST /auth/login/  { usuario, password }",
      "      -> { access: <JWT>, cobrador: {...} }",
      "            -> localStorage: 'access' (JWT), 'usuario'",
      "",
      "Cada petición: Authorization: Bearer <access>",
      "Respuesta 401 -> cierre de sesión y redirección a /login",
    ]),
    P([R("La sesión se sostiene con el token de acceso; ante un "), CODE("401"), R(" se cierra la sesión. "), CODE("isAuthenticated()"), R(" evalúa la presencia de las claves "), CODE("access"), R(" y "), CODE("usuario"), R(" en "), CODE("localStorage"), R(". El registro de administradores y cobradores se realiza sobre el namespace "), CODE("/auth"), R(".")]),
    H2("8.4 Convenciones de la capa de servicios"),
    P([R("La capa de servicios emplea dos estilos de retorno:")]),
    bullet([B("Estilo resultado: "), R("retornan "), CODE("{ success, data, errors }"), R(" (por ejemplo Rcuentahabientes.service, cargos.service, CorteCaja.service); el consumidor evalúa "), CODE("res.success"), R(".")]),
    bullet([B("Estilo excepción: "), R("retornan los datos y lanzan en caso de error (por ejemplo pago.service, descuento.service, ingresos.service); el consumidor usa "), CODE("try/catch"), R(".")]),
    H3("Patrones reutilizables"),
    bullet([B("Tabla reutilizable: "), CODE("ReusableTable"), R(" ("), CODE("components/tablas/registros_general"), R(") se configura con un arreglo "), CODE("columns"), R(" y una función "), CODE("fetchData"), R(".")]),
    bullet([B("Formulario reutilizable: "), CODE("FormularioReutilizable"), R(" con un objeto "), CODE("FormConfig"), R(" (campos, validaciones y "), CODE("onSubmit"), R(").")]),
    bullet([B("Feedback: "), R("SweetAlert2 para éxito, error y confirmación.")]),
    bullet([B("Búsqueda: "), R("debounce (~400–500 ms) antes de consultar el backend con "), CODE("?search="), R(".")]),
    H3("Nomenclatura"),
    bullet([R("Dominio en español y utilidades en inglés; prefijo "), CODE("R"), R(" para «Registro» ("), CODE("Rcobradores"), R(", "), CODE("Rsector"), R(", "), CODE("Rcuentahabientes"), R(").")]),
    H2("8.5 Gestión de estado y datos"),
    P([R("El estado se gestiona con React Context para lo global ("), CODE("AuthProvider"), R(", "), CODE("ThemeProvider"), R(") y con estado local por componente; la obtención de datos se realiza a través de la capa de servicios.")]),
    H3("Árbol de providers"),
    mono([
      "<React.StrictMode>",
      "  <ThemeProvider>          // tema de la interfaz",
      "    <AuthProvider>         // usuario + isAuthenticated + login/logout",
      "      <RouterProvider>     // createBrowserRouter(Rutas)",
      "        <ProtectedRoute>   // guard: isAuthenticated",
      "          <RootLayout>     // Navbar + <Outlet/>",
      "            <Página />",
    ]),
    H2("8.6 Matriz de roles y acceso"),
    tabla(["Rol", "Panel de administración", "Alcance"], [
      ["admin", "Sí", "Acceso total: catálogos, usuarios, cargos, cierre anual"],
      ["supervisor", "Sí", "Supervisión y administración del sistema"],
      ["tesorero_sr", "Sí", "Tesorería, egresos y cortes de caja (senior)"],
      ["tesorero_jr", "Sí", "Tesorería, egresos y cortes de caja (junior)"],
      ["cobrador", "No", "Operación en campo: pagos, consultas y cargos"],
    ], [24, 26, 50]),
    P([R("La autorización efectiva de cada endpoint la determina el backend.")]),
    H2("8.7 Glosario del dominio"),
    tabla(["Término", "Significado"], [
      ["Cuentahabiente", "Titular de un contrato del servicio de agua."],
      ["Cobrador", "Usuario que realiza cobros en campo; entidad de usuario del inicio de sesión."],
      ["Cargo", "Deuda puntual asignada por un administrador, con monto fijo por tipo."],
      ["Pago", "Cobro del servicio de agua por periodo (mes/año)."],
      ["Descuento", "Rebaja aplicada a un pago, gestionada como importe fijo."],
      ["Estado de cuenta", "Resumen anual de movimientos, saldo pendiente y cargos del cuentahabiente."],
      ["Corte de caja", "Cuadre de recaudación por rango de fechas y cobrador."],
      ["Padrón", "Registro general de cuentahabientes."],
      ["Toma nueva", "Alta de una nueva conexión de servicio (es_toma_nueva)."],
      ["Sector / Colonia / Calle", "Segmentación geográfica del padrón para asignación y reportes."],
      ["Tesorero SR / JR", "Roles de tesorería con acceso a egresos y cortes de caja."],
      ["Cierre anual", "Proceso de cierre contable de cuentas al final del ejercicio."],
    ], [26, 74]),
    H2("8.8 Procedimiento para agregar un nuevo módulo"),
    P([R("Un módulo CRUD nuevo se incorpora siguiendo el patrón establecido:")]),
    paso(1, [R("Crear el servicio en "), CODE("src/services/<dominio>.service.ts"), R(" (interfaces, constante de URL y funciones CRUD sobre "), CODE("api_axios"), R(").")]),
    paso(2, [R("Crear la vista en "), CODE("src/pages/<Dominio>/"), R(", apoyándose en "), CODE("ReusableTable"), R(" y "), CODE("FormularioReutilizable"), R(".")]),
    paso(3, [R("Registrar la ruta en "), CODE("src/routes/rutas.tsx"), R(" como hija de "), CODE("RootLayout"), R(" (dentro de "), CODE("ProtectedRoute"), R(").")]),
    paso(4, [R("Añadir el acceso con una "), CODE("WaterServiceCard"), R(" en el panel correspondiente ("), CODE("Main_Cards"), R(", "), CODE("Admin_Cards"), R(" o "), CODE("Tesorero_Cards"), R(").")]),
    paso(5, [R("Aplicar las clases de "), CODE("styles/styles.css"), R(" para mantener la consistencia visual.")]),
    H2("8.9 Pruebas y calidad"),
    P([R("La verificación de calidad se apoya en TypeScript en modo "), CODE("strict"), R(" y en ESLint ("), CODE("eslint.config.js"), R("). Se recomienda ejecutar "), CODE("npm run lint"), R(" y "), CODE("npm run build"), R(" antes de integrar cambios.")]),
    H2("8.10 Flujo de trabajo con Git"),
    P([R("La rama principal es "), CODE("main"), R(". Los cambios se desarrollan en ramas de trabajo y se integran mediante Pull Request, con "), CODE("lint"), R(" y "), CODE("build"), R(" en verde y una descripción de las verificaciones realizadas.")]),
  );

  // ── 9. DIAGRAMAS ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    H1("9. Diagramas del sistema"),
    H2("9.1 Diagrama general de uso"),
    P([R("Flujo de navegación del sistema: tras el inicio de sesión, el menú principal ofrece los módulos operativos y, según el rol, el acceso a los paneles de administración y de tesorería.")]),
    diagrama(dGeneral),
    caption("Figura 1. Uso general del sistema por rol."),
    H2("9.2 Registro de pagos"),
    diagrama(dPagos),
    caption("Figura 2. Registro de un pago de servicio y regla de bloqueo por cargos pendientes."),
    H2("9.3 Cargos y abonos"),
    diagrama(dCargos),
    caption("Figura 3. Alta de cargos y registro de abonos a cargos activos."),
    H2("9.4 Corte de caja"),
    diagrama(dCorte),
    caption("Figura 4. Generación del corte de caja y composición del total."),
    H2("9.5 Estado de cuenta"),
    diagrama(dEstado),
    caption("Figura 5. Generación del estado de cuenta en PDF."),
  );

  // ── DOCUMENTO ──
  const doc = new Document({
    creator: "SICAP — Frontend",
    title: "Documentación Técnica Frontend SICAP",
    description: "Arquitectura, módulos, diseño, reglas de negocio y diagramas",
    features: { updateFields: true },
    styles: { default: { document: { run: { font: "Calibri", size: 22, color: TINTA } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Documentación Técnica — Frontend SICAP", size: 16, color: GRIS })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Página ", size: 16, color: GRIS }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRIS }), new TextRun({ text: " de ", size: 16, color: GRIS }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRIS })] })] }) },
      children,
    }],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buf);
  console.log("OK - Documento generado en:", OUT);
  console.log("Tamaño:", (buf.length / 1024).toFixed(1), "KB");
})();
