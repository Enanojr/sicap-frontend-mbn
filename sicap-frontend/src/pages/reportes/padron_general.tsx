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

import type { PadronGeneralRow } from "../../services/reporte_padron";

interface Props {
  rows: PadronGeneralRow[];
  anio: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const prepararFilas = (rows: PadronGeneralRow[]) =>
  [...rows].sort((a, b) =>
    a.nombre_usuario.localeCompare(b.nombre_usuario, "es-MX"),
  );

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 120,
    paddingHorizontal: 22,
    paddingBottom: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },

  watermark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 230,
    alignItems: "center",
    opacity: 0.05,
  },
  watermarkImg: { width: 320, height: 320, objectFit: "contain" },

  // Header fijo
  headerRow: {
    position: "absolute",
    top: 18,
    left: 22,
    right: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftBrand: { width: "27%", paddingRight: 10 },
  logo: { width: 66, height: 66, objectFit: "contain", marginBottom: 4 },
  brandText: { fontSize: 6.4, color: "#334155", lineHeight: 1.25 },

  infoCard: {
    width: "71%",
    borderWidth: 1,
    borderColor: "#cfd8e3",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8fbff",
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#123e6b",
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { fontSize: 8, color: "#64748b" },
  value: { fontSize: 8, color: "#0f172a", fontWeight: "bold" },

  // Tarjetas de totales
  globalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  globalCardGreen: {
    width: "31.8%",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  globalCardOrange: {
    width: "31.8%",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  globalCardPrimary: {
    width: "31.8%",
    backgroundColor: "#dbeafe",
    borderWidth: 1.2,
    borderColor: "#123e6b",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  globalLabel: {
    fontSize: 6.8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  globalValueGreen: { fontSize: 13, fontWeight: "bold", color: "#15803d" },
  globalValueOrange: { fontSize: 13, fontWeight: "bold", color: "#c2410c" },
  globalValuePrimary: { fontSize: 13, fontWeight: "bold", color: "#123e6b" },

  // Título tabla
  detailTitleBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#103f6f",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailTitleText: { fontSize: 10, fontWeight: "bold", color: "#ffffff" },
  detailTitleMeta: { fontSize: 7.2, color: "#dbeafe" },

  // Cabecera tabla
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderBottomWidth: 1,
    borderBottomColor: "#dbe3ec",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#d7e0ea",
    borderRightColor: "#d7e0ea",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // Anchos: No.Contrato | Nombre | TipoServicio | TotalPagado | SaldoPendiente
  colContrato: { width: "10%" },
  colNombre: { width: "40%" },
  colServicio: { width: "16%" },
  colPagado: { width: "17%" },
  colSaldo: { width: "17%" },

  th: {
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
  },
  thCenter: {
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "center",
  },
  thRight: {
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "right",
  },

  // Filas
  detailRowsBox: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: "#d7e0ea",
    borderRightColor: "#d7e0ea",
    borderBottomColor: "#d7e0ea",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    backgroundColor: "#ffffff",
  },
  detailRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    backgroundColor: "#fafcff",
  },

  tdCenter: { fontSize: 7, color: "#64748b", textAlign: "center" },
  td: { fontSize: 7, color: "#0f172a", lineHeight: 1.2 },
  tdMuted: { fontSize: 7, color: "#475569" },
  tdBlue: {
    fontSize: 7,
    color: "#123e6b",
    textAlign: "right",
    fontWeight: "bold",
  },
  tdRed: { fontSize: 7, color: "#b91c1c", textAlign: "right" },

  // Gran total
  grandTotalBox: {
    marginTop: 10,
    borderWidth: 1.3,
    borderColor: "#123e6b",
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLeft: { width: "68%" },
  grandTotalTitle: { fontSize: 9.5, fontWeight: "bold", color: "#123e6b" },
  grandTotalSub: {
    marginTop: 3,
    fontSize: 7.2,
    color: "#475569",
    lineHeight: 1.2,
  },
  grandTotalValue: {
    width: "30%",
    textAlign: "right",
    fontSize: 15,
    fontWeight: "bold",
    color: "#123e6b",
  },

  // Estado vacío
  emptyBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 10, color: "#64748b", textAlign: "center" },

  // Firmantes
  signaturesBox: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 120,
  },
  signatureItem: {
    width: "30%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    width: "80%",
    marginBottom: 12,
    marginTop: 60,
  },
  signatureRole: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },

  footer: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.4,
    color: "#94a3b8",
  },
});

// ── Componente PDF ────────────────────────────────────────────────────────────

export default function PadronGeneralPDF({ rows, anio }: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const filas = prepararFilas(rows);

  const primerRow = rows[0];
  const granTotalAgua = primerRow?.total_pagos_cobrados ?? 0;
  const granTotalCargos = primerRow?.total_cobros_cargos ?? 0;
  const granTotal = granTotalAgua + granTotalCargos;
  const totalUsuarios = primerRow?.total_usuarios ?? rows.length;

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Marca de agua */}
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        {/* Header fijo */}
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
            <View style={styles.infoRow}>
              <Text style={styles.label}>Año del reporte</Text>
              <Text style={styles.value}>{anio}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total de usuarios atendidos</Text>
              <Text style={styles.value}>{totalUsuarios}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Fecha de emisión</Text>
              <Text style={styles.value}>{footerDate}</Text>
            </View>
          </View>
        </View>

        {/* Tarjetas de totales */}
        {rows.length > 0 && (
          <View style={styles.globalRow} wrap={false}>
            <View style={styles.globalCardGreen}>
              <Text style={styles.globalLabel}>Total de pagos de agua</Text>
              <Text style={styles.globalValueGreen}>
                {money(granTotalAgua)}
              </Text>
            </View>
            <View style={styles.globalCardOrange}>
              <Text style={styles.globalLabel}>Total cargos</Text>
              <Text style={styles.globalValueOrange}>
                {money(granTotalCargos)}
              </Text>
            </View>
            <View style={styles.globalCardPrimary}>
              <Text style={styles.globalLabel}>Gran total</Text>
              <Text style={styles.globalValuePrimary}>{money(granTotal)}</Text>
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
            {/* Título tabla */}
            <View style={styles.detailTitleBox}>
              <Text style={styles.detailTitleText}>
                Detalle por cuentahabiente
              </Text>
              <Text style={styles.detailTitleMeta}>
                {filas.length} registros
              </Text>
            </View>

            {/* Cabecera */}
            <View style={styles.tableHead}>
              <Text style={[styles.thCenter, styles.colContrato]}>
                No.{"\n"}Contrato
              </Text>
              <Text style={[styles.th, styles.colNombre]}>Nombre Usuario</Text>
              <Text style={[styles.th, styles.colServicio]}>Tipo Servicio</Text>
              <Text style={[styles.thRight, styles.colPagado]}>
                Total Pagado
              </Text>
              <Text style={[styles.thRight, styles.colSaldo]}>
                Saldo Pendiente
              </Text>
            </View>

            {/* Filas */}
            <View style={styles.detailRowsBox}>
              {filas.map((row, i) => (
                <View
                  key={`${row.id}-${i}`}
                  style={i % 2 === 0 ? styles.detailRow : styles.detailRowAlt}
                  wrap={false}
                >
                  <Text style={[styles.tdCenter, styles.colContrato]}>
                    {row.numero_contrato || "—"}
                  </Text>
                  <Text style={[styles.td, styles.colNombre]}>
                    {row.nombre_usuario}
                  </Text>
                  <Text style={[styles.tdMuted, styles.colServicio]}>
                    {row.tipo_servicio}
                  </Text>
                  <Text style={[styles.tdBlue, styles.colPagado]}>
                    {money(row.total_pagado_acumulado)}
                  </Text>
                  <Text style={[styles.tdRed, styles.colSaldo]}>
                    {money(row.saldo_pendiente)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Gran total */}
            <View style={styles.grandTotalBox} wrap={false}>
              <View style={styles.grandTotalLeft}>
                <Text style={styles.grandTotalTitle}>Gran total</Text>
                <Text style={styles.grandTotalSub}>
                  Total de pagos de agua: {money(granTotalAgua)}
                  {"  •  "}Total cargos: {money(granTotalCargos)}
                </Text>
              </View>
              <Text style={styles.grandTotalValue}>{money(granTotal)}</Text>
            </View>

            {/* Firmantes */}
            <View style={styles.signaturesBox} wrap={false}>
              <View style={styles.signatureItem}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureRole}>Presidente</Text>
                <Text style={styles.signatureName}>
                  Odilón Paredes Carbajal
                </Text>
              </View>
              <View style={styles.signatureItem}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureRole}>Tesorero</Text>
                <Text style={styles.signatureName}>Jaime Paredes González</Text>
              </View>
              <View style={styles.signatureItem}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureRole}>Secretario</Text>
                <Text style={styles.signatureName}>
                  Antonio Corte Hernández
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Guadalupe Hidalgo Acuamanala, C.P. 90860</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${footerDate}   |   ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
