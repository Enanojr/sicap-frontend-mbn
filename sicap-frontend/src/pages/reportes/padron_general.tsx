import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import Logo from "../../assets/Logo.png";
import WatermarkLogo from "../../assets/Logo.png";

import type {
  PadronGeneralRow,
  DetalleAbonoCargo,
} from "../../services/reporte_padron";
import { money, DIRECCION_FOOTER } from "../../components/pdf/formato";
import { BloqueFirmas } from "../../components/pdf/comunes";

interface Props {
  rows: PadronGeneralRow[];
  anio: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const prepararFilas = (rows: PadronGeneralRow[]) =>
  [...rows].sort((a, b) =>
    a.nombre_usuario.localeCompare(b.nombre_usuario, "es-MX"),
  );

// ── Paleta ────────────────────────────────────────────────────────────────────
// Azul marino institucional  #0c2d55
// Azul medio                 #1a4f8a
// Azul cielo                 #dbeafe / #eff6ff
// Verde recaudado            #166534 / #f0fdf4 / #86efac
// Naranja pendiente          #92400e / #fff7ed / #fcd34d
// Rojo saldo                 #991b1b / #fef2f2
// Gris texto                 #1e293b / #475569 / #94a3b8

const C = {
  marinoDark: "#0c2d55",
  marino: "#1a4f8a",
  marinoBorder: "#2563aa",
  marinoBg: "#eff6ff",
  marinoBgDark: "#dbeafe",

  greenDark: "#166534",
  greenBorder: "#86efac",
  greenBg: "#f0fdf4",
  greenText: "#15803d",

  orangeDark: "#92400e",
  orangeBorder: "#fcd34d",
  orangeBg: "#fffbeb",
  orangeText: "#b45309",

  redText: "#991b1b",
  redBg: "#fef2f2",
  redBorder: "#fca5a5",

  purpleBg: "#f5f3ff",
  purpleBorder: "#c4b5fd",
  purpleText: "#6d28d9",

  slate900: "#0f172a",
  slate700: "#1e293b",
  slate500: "#475569",
  slate400: "#64748b",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  white: "#ffffff",
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 130,
    paddingHorizontal: 24,
    paddingBottom: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.slate700,
    backgroundColor: C.white,
  },

  // ── Marca de agua ──
  watermark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 200,
    alignItems: "center",
    opacity: 0.04,
  },
  watermarkImg: { width: 340, height: 340, objectFit: "contain" },

  // ── Header fijo ──
  headerRow: {
    position: "absolute",
    top: 16,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftBrand: { width: "26%", paddingRight: 10 },
  logo: { width: 68, height: 68, objectFit: "contain", marginBottom: 4 },
  brandText: { fontSize: 6.2, color: C.slate500, lineHeight: 1.3 },

  infoCard: {
    width: "72%",
    borderWidth: 1.2,
    borderColor: C.marinoBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.marinoBg,
  },
  infoTitle: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: C.marinoDark,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
  },
  infoGrid: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { width: "32%" },
  infoLabel: {
    fontSize: 6.8,
    color: C.slate400,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.slate900 },

  // ── Separador de sección ──
  sectionSep: { marginBottom: 14 },

  // ── Cards globales (fila 1: agua) ──
  globalSectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.slate400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  globalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  // Card verde (pagado agua)
  cardGreen: {
    flex: 1,
    marginRight: 5,
    backgroundColor: C.greenBg,
    borderWidth: 1,
    borderColor: C.greenBorder,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  // Card naranja (pendiente agua)
  cardOrange: {
    flex: 1,
    marginRight: 5,
    backgroundColor: C.orangeBg,
    borderWidth: 1,
    borderColor: C.orangeBorder,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  // Card purple (cobros cargos)
  cardPurple: {
    flex: 1,
    marginRight: 5,
    backgroundColor: C.purpleBg,
    borderWidth: 1,
    borderColor: C.purpleBorder,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  // Card red (pendiente cargos)
  cardRed: {
    flex: 1,
    marginRight: 5,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: C.redBorder,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  // Card marino (gran total)
  cardMarino: {
    flex: 1.3,
    backgroundColor: C.marinoBgDark,
    borderWidth: 1.5,
    borderColor: C.marinoDark,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },

  cardLabel: {
    fontSize: 6.5,
    color: C.slate400,
    textTransform: "uppercase",
    marginBottom: 4,
    lineHeight: 1.3,
  },
  cardValueGreen: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.greenText,
  },
  cardValueOrange: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.orangeText,
  },
  cardValuePurple: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.purpleText,
  },
  cardValueRed: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.redText,
  },
  cardValueMarino: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.marinoDark,
  },

  // ── Título bloque tabla ──
  tableTitleBox: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: C.marinoDark,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableTitleText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tableTitleMeta: { fontSize: 7, color: C.marinoBgDark },

  // ── Tabla outer wrapper ──
  tableWrapper: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: C.slate200,
    borderRightColor: C.slate200,
    borderBottomColor: C.slate200,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    overflow: "hidden",
    marginBottom: 12,
  },

  // ── Fila cuentahabiente (tarjeta expandida) ──
  cuentaCard: {
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    backgroundColor: C.white,
  },
  cuentaCardAlt: {
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    backgroundColor: C.slate50,
  },

  // Sub-header de cuenta (franja azul tenue)
  cuentaHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.marinoBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.marinoBgDark,
  },
  cuentaNumContrato: {
    width: "12%",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.marinoDark,
    textAlign: "center",
  },
  cuentaNombre: {
    width: "50%",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    paddingLeft: 6,
  },
  cuentaTipo: {
    width: "20%",
    fontSize: 6.8,
    color: C.slate500,
    paddingLeft: 4,
  },
  cuentaTotalGeneral: {
    width: "18%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.marinoDark,
    textAlign: "right",
  },

  // Body de cuenta (2 columnas: agua | cargos)
  cuentaBody: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  // Panel agua (izq)
  panelAgua: {
    width: "45%",
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: C.slate200,
  },
  panelCargos: {
    width: "55%",
    paddingLeft: 10,
  },

  panelTitle: {
    fontSize: 6.3,
    fontFamily: "Helvetica-Bold",
    color: C.slate400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.slate200,
    paddingBottom: 3,
  },

  // Fila de dato dentro de panel
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  dataLabel: { fontSize: 6.8, color: C.slate400 },
  dataValue: { fontSize: 6.8, color: C.slate700 },
  dataValueBold: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.greenText,
  },
  dataValueBoldRed: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.redText,
  },

  // Sub-total panel
  panelSubtotal: {
    marginTop: 5,
    paddingTop: 4,
    borderTopWidth: 0.8,
    borderTopColor: C.greenBorder,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelSubtotalLabel: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.greenText,
  },
  panelSubtotalValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.greenText,
  },

  panelSubtotalCargos: {
    marginTop: 5,
    paddingTop: 4,
    borderTopWidth: 0.8,
    borderTopColor: C.purpleBorder,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelSubtotalLabelCargos: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: C.purpleText,
  },
  panelSubtotalValueCargos: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.purpleText,
  },

  // Lista de cargos activos
  cargoActivoTag: {
    backgroundColor: C.redBg,
    borderWidth: 0.5,
    borderColor: C.redBorder,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 2,
    marginRight: 3,
  },
  cargoActivoText: { fontSize: 6.2, color: C.redText },

  cargosActivosWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },

  // Mini tabla abonos
  abonoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
    borderBottomWidth: 0.4,
    borderBottomColor: C.slate200,
  },
  abonoConcepto: { fontSize: 6.2, color: C.slate500, width: "70%" },
  abonoMonto: {
    fontSize: 6.2,
    fontFamily: "Helvetica-Bold",
    color: C.purpleText,
    width: "30%",
    textAlign: "right",
  },

  noCargos: { fontSize: 6.5, color: C.slate400, fontStyle: "italic" },

  // ── Gran total inferior ──
  grandTotalBox: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: C.marinoDark,
    borderRadius: 10,
    backgroundColor: C.marinoBgDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  grandTotalLeft: { width: "65%" },
  grandTotalTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.marinoDark,
  },
  grandTotalSub: {
    marginTop: 3,
    fontSize: 6.8,
    color: C.slate500,
    lineHeight: 1.4,
  },
  grandTotalValue: {
    width: "33%",
    textAlign: "right",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.marinoDark,
  },

  // ── Estado vacío ──
  emptyBox: {
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    backgroundColor: C.slate50,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 10, color: C.slate400, textAlign: "center" },

  // ── Firmantes ──
  signaturesBox: {
    marginTop: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureItem: {
    width: "30%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: C.slate900,
    width: "80%",
    marginBottom: 10,
    marginTop: 55,
  },
  signatureRole: {
    fontSize: 6.5,
    color: C.slate400,
    textTransform: "uppercase",
    marginBottom: 2,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    textAlign: "center",
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.2,
    color: C.slate400,
    borderTopWidth: 0.5,
    borderTopColor: C.slate200,
    paddingTop: 5,
  },
});

// ── Subcomponente: fila de cuentahabiente ────────────────────────────────────

const CuentaRow = ({
  row,
  index,
}: {
  row: PadronGeneralRow;
  index: number;
}) => {
  const esAlt = index % 2 !== 0;
  const tieneCargosActivos = row.detalle_cargos_activos.length > 0;
  const tieneAbonos = row.detalle_abonos_cargos.length > 0;

  return (
    <View style={esAlt ? styles.cuentaCardAlt : styles.cuentaCard} wrap={false}>
      {/* ── Sub-header: datos generales ── */}
      <View style={styles.cuentaHeader}>
        <Text style={styles.cuentaNumContrato}>
          {row.numero_contrato || "—"}
        </Text>
        <Text style={styles.cuentaNombre}>{row.nombre_usuario}</Text>
        <Text style={styles.cuentaTipo}>{row.tipo_servicio}</Text>
        <Text style={styles.cuentaTotalGeneral}>
          {money(row.total_pagado_general)}
        </Text>
      </View>

      {/* ── Body: dos paneles ── */}
      <View style={styles.cuentaBody}>
        {/* Panel Servicio de Agua */}
        <View style={styles.panelAgua}>
          <Text style={styles.panelTitle}>Servicio de Agua</Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Costo anual del servicio</Text>
            <Text style={styles.dataValue}>
              {money(row.costo_servicio_anual)}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>No. de pagos realizados</Text>
            <Text style={styles.dataValue}>{row.cantidad_abonos_servicio}</Text>
          </View>

          <View style={styles.panelSubtotal}>
            <Text style={styles.panelSubtotalLabel}>Total pagado (agua)</Text>
            <Text style={styles.panelSubtotalValue}>
              {money(row.total_pagado_servicio)}
            </Text>
          </View>
        </View>

        {/* Panel Cargos */}
        <View style={styles.panelCargos}>
          <Text style={styles.panelTitle}>Otros Cargos</Text>

          {/* Cargos activos */}
          {tieneCargosActivos ? (
            <>
              <Text style={[styles.dataLabel, { marginBottom: 3 }]}>
                Cargos activos:
              </Text>
              <View style={styles.cargosActivosWrap}>
                {row.detalle_cargos_activos.map((c, ci) => (
                  <View key={ci} style={styles.cargoActivoTag}>
                    <Text style={styles.cargoActivoText}>{c.nombre_cargo}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={[styles.noCargos, { marginBottom: 4 }]}>
              Sin cargos activos pendientes
            </Text>
          )}

          {/* Desglose de abonos a cargos */}
          {tieneAbonos ? (
            <>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>No. de pagos a cargos</Text>
                <Text style={styles.dataValue}>
                  {row.cantidad_pagos_cargos}
                </Text>
              </View>
              {row.detalle_abonos_cargos.map(
                (a: DetalleAbonoCargo, ai: number) => (
                  <View key={ai} style={styles.abonoRow}>
                    <Text style={styles.abonoConcepto}>{a.cargo_afectado}</Text>
                    <Text style={styles.abonoMonto}>
                      {money(a.monto_abonado)}
                    </Text>
                  </View>
                ),
              )}
            </>
          ) : (
            <Text style={[styles.noCargos, { marginBottom: 4 }]}>
              Sin pagos a cargos registrados
            </Text>
          )}

          <View style={styles.panelSubtotalCargos}>
            <Text style={styles.panelSubtotalLabelCargos}>
              Total pagado (cargos)
            </Text>
            <Text style={styles.panelSubtotalValueCargos}>
              {money(row.total_pagado_cargos)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── Componente principal PDF ──────────────────────────────────────────────────

export default function PadronGeneralPDF({ rows, anio }: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const filas = prepararFilas(rows);

  const primerRow = rows[0];
  const totalPagosCobrados = primerRow?.total_pagos_cobrados ?? 0;
  const totalPagosPendientes = primerRow?.total_pagos_pendientes ?? 0;
  const totalCobrosCargos = primerRow?.total_cobros_cargos ?? 0;
  const totalCargosPendientes = primerRow?.total_cargos_pendientes ?? 0;
  const totalRecaudadoGlobal = primerRow?.total_recaudado_global ?? 0;
  const totalUsuarios = primerRow?.total_usuarios ?? rows.length;

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Marca de agua */}
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        {/* ── Header fijo ── */}
        <View style={styles.headerRow} fixed>
          <View style={styles.leftBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.brandText}>
              COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO{"\n"}ACUAMANALA, TLAX.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Padrón general de cuentahabientes — {anio}
            </Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Año del reporte</Text>
                <Text style={styles.infoValue}>{anio}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cuentahabientes</Text>
                <Text style={styles.infoValue}>{totalUsuarios}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha de emisión</Text>
                <Text style={styles.infoValue}>{footerDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Totales globales ── */}
        {rows.length > 0 && (
          <View style={styles.sectionSep} wrap={false}>
            <Text style={styles.globalSectionLabel}>
              Resumen global del ejercicio {anio}
            </Text>

            <View style={styles.globalRow}>
              {/* Pagado agua */}
              <View style={styles.cardGreen}>
                <Text style={styles.cardLabel}>
                  Cobros por servicio{"\n"}de agua
                </Text>
                <Text style={styles.cardValueGreen}>
                  {money(totalPagosCobrados)}
                </Text>
              </View>

              {/* Pendiente agua */}
              <View style={styles.cardOrange}>
                <Text style={styles.cardLabel}>
                  Pagos pendientes{"\n"}por servicio de agua
                </Text>
                <Text style={styles.cardValueOrange}>
                  {money(totalPagosPendientes)}
                </Text>
              </View>

              {/* Cobros cargos */}
              <View style={styles.cardPurple}>
                <Text style={styles.cardLabel}>
                  Cobros por{"\n"}otros servicios
                </Text>
                <Text style={styles.cardValuePurple}>
                  {money(totalCobrosCargos)}
                </Text>
              </View>

              {/* Pendiente cargos */}
              <View style={styles.cardRed}>
                <Text style={styles.cardLabel}>
                  Pendientes por{"\n"}otros servicios
                </Text>
                <Text style={styles.cardValueRed}>
                  {money(totalCargosPendientes)}
                </Text>
              </View>

              {/* Gran total */}
              <View style={styles.cardMarino}>
                <Text style={styles.cardLabel}>Total recaudado</Text>
                <Text style={styles.cardValueMarino}>
                  {money(totalRecaudadoGlobal)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {rows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No existe información disponible para el año {anio}.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Encabezado tabla ── */}
            <View style={styles.tableTitleBox}>
              <Text style={styles.tableTitleText}>
                Detalle por cuentahabiente
              </Text>
              <Text style={styles.tableTitleMeta}>
                {filas.length} registros
              </Text>
            </View>

            {/* ── Cabecera de columnas ── */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: C.marinoBgDark,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderLeftColor: C.slate200,
                borderRightColor: C.slate200,
                borderBottomWidth: 1,
                borderBottomColor: C.slate200,
                paddingVertical: 5,
                paddingHorizontal: 10,
              }}
            >
              <Text
                style={{
                  width: "12%",
                  fontSize: 6.5,
                  fontFamily: "Helvetica-Bold",
                  color: C.marinoDark,
                  textAlign: "center",
                }}
              >
                No. Contrato
              </Text>
              <Text
                style={{
                  width: "50%",
                  fontSize: 6.5,
                  fontFamily: "Helvetica-Bold",
                  color: C.marinoDark,
                  paddingLeft: 6,
                }}
              >
                Nombre del cuentahabiente
              </Text>
              <Text
                style={{
                  width: "20%",
                  fontSize: 6.5,
                  fontFamily: "Helvetica-Bold",
                  color: C.marinoDark,
                  paddingLeft: 4,
                }}
              >
                Tipo de servicio
              </Text>
              <Text
                style={{
                  width: "18%",
                  fontSize: 6.5,
                  fontFamily: "Helvetica-Bold",
                  color: C.marinoDark,
                  textAlign: "right",
                }}
              >
                Total aportado
              </Text>
            </View>

            {/* ── Filas de cuentahabientes ── */}
            <View style={styles.tableWrapper}>
              {filas.map((row, i) => (
                <CuentaRow key={`${row.id}-${i}`} row={row} index={i} />
              ))}
            </View>

            {/* ── Gran total inferior ── */}
            <View style={styles.grandTotalBox} wrap={false}>
              <View style={styles.grandTotalLeft}>
                <Text style={styles.grandTotalTitle}>
                  Total recaudado global
                </Text>
                <Text style={styles.grandTotalSub}>
                  Cobros agua: {money(totalPagosCobrados)}
                  {"   •   "}
                  Cobros otros servicios: {money(totalCobrosCargos)}
                  {"\n"}
                  Pendiente agua: {money(totalPagosPendientes)}
                  {"   •   "}
                  Pendiente otros servicios: {money(totalCargosPendientes)}
                </Text>
              </View>
              <Text style={styles.grandTotalValue}>
                {money(totalRecaudadoGlobal)}
              </Text>
            </View>

            {/* ── Firmantes ── */}
            <BloqueFirmas styles={styles} />
          </>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text>{DIRECCION_FOOTER}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${footerDate}   |   Pág. ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
