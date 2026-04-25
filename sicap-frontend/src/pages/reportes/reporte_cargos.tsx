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

import type { ReporteCargosRow } from "../../services/reporte.cargos";
import { formatFecha } from "../../services/reporte.cargos";

interface Props {
  rows: ReporteCargosRow[];
  anio: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Tipos internos ────────────────────────────────────────────────────────────

type FilaCargo = {
  id: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  calle: string;
  tipo_cargo: string;
  fecha_cargo: string | null;
  saldo_restante_cargo: number;
  estatus_cargo: string;
  fecha_pago: string | null;
  monto_recibido: number;
};

type GrupoCobrador = {
  id_cobrador: number;
  nombre_cobrador: string;
  filas: FilaCargo[];
  subtotal_monto: number;
  subtotal_saldo: number;
};

// ── Agrupación por cobrador ───────────────────────────────────────────────────

const agruparPorCobrador = (rows: ReporteCargosRow[]): GrupoCobrador[] => {
  const map = new Map<number, GrupoCobrador>();

  [...rows]
    .sort((a, b) =>
      a.nombre_cuentahabiente.localeCompare(b.nombre_cuentahabiente, "es-MX"),
    )
    .forEach((row) => {
      if (!map.has(row.id_cobrador)) {
        map.set(row.id_cobrador, {
          id_cobrador: row.id_cobrador,
          nombre_cobrador: row.nombre_cobrador,
          filas: [],
          subtotal_monto: 0,
          subtotal_saldo: 0,
        });
      }

      const grupo = map.get(row.id_cobrador)!;

      grupo.filas.push({
        id: row.id,
        numero_contrato: row.numero_contrato,
        nombre_cuentahabiente: row.nombre_cuentahabiente,
        calle: row.calle,
        tipo_cargo: row.tipo_cargo,
        fecha_cargo: row.fecha_cargo,
        saldo_restante_cargo: row.saldo_restante_cargo,
        estatus_cargo: row.estatus_cargo,
        fecha_pago: row.fecha_pago,
        monto_recibido: row.monto_recibido,
      });

      grupo.subtotal_monto += row.monto_recibido;
      grupo.subtotal_saldo += row.saldo_restante_cargo;
    });

  return Array.from(map.values()).sort((a, b) =>
    a.nombre_cobrador.localeCompare(b.nombre_cobrador, "es-MX"),
  );
};

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

  // Tarjetas globales
  globalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
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
  globalCardGreen: {
    width: "31.8%",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  globalCardRed: {
    width: "31.8%",
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
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
  globalValuePrimary: { fontSize: 13, fontWeight: "bold", color: "#123e6b" },
  globalValueGreen: { fontSize: 13, fontWeight: "bold", color: "#15803d" },
  globalValueRed: { fontSize: 13, fontWeight: "bold", color: "#b91c1c" },

  // Sección por cobrador
  cobradorSection: { marginBottom: 16 },

  sectionHeader: {
    backgroundColor: "#103f6f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderName: { fontSize: 10, fontWeight: "bold", color: "#ffffff" },
  sectionHeaderMeta: { fontSize: 7.2, color: "#dbeafe" },

  // Subtotales del cobrador
  summaryRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: "#d7e0ea",
    borderRightColor: "#d7e0ea",
    borderBottomColor: "#d7e0ea",
    backgroundColor: "#f8fafc",
  },
  summaryCell: {
    width: "50%",
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  summaryCellLast: {
    width: "50%",
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 6.4,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
    textAlign: "center",
  },
  summaryValueGreen: { fontSize: 10, fontWeight: "bold", color: "#15803d" },
  summaryValueRed: { fontSize: 10, fontWeight: "bold", color: "#b91c1c" },

  // Subtítulo tabla
  detailTitleBox: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#d7e0ea",
    borderRightColor: "#d7e0ea",
  },
  detailTitle: {
    fontSize: 7.2,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

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

  // Anchos de columna
  // No.Contrato | Nombre | Calle | TipoCargo | FechaCargo | Estatus | FechaPago | Monto | SaldoRest.
  colContrato: { width: "7%" },
  colNombre: { width: "18%" },
  colCalle: { width: "14%" },
  colTipo: { width: "10%" },
  colFechaCargo: { width: "9%" },
  colEstatus: { width: "9%" },
  colFechaPago: { width: "9%" },
  colMonto: { width: "12%" },
  colSaldo: { width: "12%" },

  th: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
  },
  thCenter: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "center",
  },
  thRight: {
    fontSize: 6,
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

  tdCenter: { fontSize: 6.5, color: "#64748b", textAlign: "center" },
  td: { fontSize: 6.5, color: "#0f172a", lineHeight: 1.2 },
  tdMuted: { fontSize: 6.5, color: "#475569" },
  tdGreen: {
    fontSize: 6.5,
    color: "#15803d",
    textAlign: "right",
    fontWeight: "bold",
  },
  tdRed: { fontSize: 6.5, color: "#b91c1c", textAlign: "right" },

  // Badge cobrador sin nombre (header azul oscuro)
  badgeSinCobrador: {
    backgroundColor: "#fef9c3",
    borderWidth: 1,
    borderColor: "#ca8a04",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "center",
  },
  badgeTextSinCobrador: {
    fontSize: 8,
    color: "#92400e",
    fontWeight: "bold",
  },

  // Badge cobro no abonado
  badgeSinAbono: {
    backgroundColor: "#fef9c3",
    borderWidth: 1,
    borderColor: "#ca8a04",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeTextSinAbono: {
    fontSize: 6,
    color: "#92400e",
    fontWeight: "bold",
  },

  // Badge estatus
  badgePagado: {
    backgroundColor: "#dcfce7",
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  badgePendiente: {
    backgroundColor: "#fee2e2",
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  badgeTextPagado: { fontSize: 6, color: "#15803d", fontWeight: "bold" },
  badgeTextPendiente: { fontSize: 6, color: "#b91c1c", fontWeight: "bold" },

  // Gran total global
  grandTotalBox: {
    marginTop: 6,
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

export default function ReporteCargosPDF({ rows, anio }: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const grupos = agruparPorCobrador(rows);

  const granTotalMonto = grupos.reduce((s, g) => s + g.subtotal_monto, 0);
  const granTotalSaldo = grupos.reduce((s, g) => s + g.subtotal_saldo, 0);
  const totalCargos = rows.length;

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
            <Text style={styles.infoTitle}>Reporte de cargos — {anio}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Año del reporte</Text>
              <Text style={styles.value}>{anio}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total de cargos registrados</Text>
              <Text style={styles.value}>{totalCargos}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cobradores con cargos</Text>
              <Text style={styles.value}>{grupos.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Fecha de emisión</Text>
              <Text style={styles.value}>{footerDate}</Text>
            </View>
          </View>
        </View>

        {/* Tarjetas globales */}
        {rows.length > 0 && (
          <View style={styles.globalRow} wrap={false}>
            <View style={styles.globalCardPrimary}>
              <Text style={styles.globalLabel}>Total de cargos</Text>
              <Text style={styles.globalValuePrimary}>{totalCargos}</Text>
            </View>
            <View style={styles.globalCardGreen}>
              <Text style={styles.globalLabel}>Total recaudado (cargos)</Text>
              <Text style={styles.globalValueGreen}>
                {money(granTotalMonto)}
              </Text>
            </View>
            <View style={styles.globalCardRed}>
              <Text style={styles.globalLabel}>Total saldo restante</Text>
              <Text style={styles.globalValueRed}>{money(granTotalSaldo)}</Text>
            </View>
          </View>
        )}

        {rows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No existe información de cargos para el año {anio}.
            </Text>
          </View>
        ) : (
          <>
            {grupos.map((grupo) => (
              <View
                key={`cobrador-${grupo.id_cobrador}`}
                style={styles.cobradorSection}
                minPresenceAhead={155}
              >
                {/* Cabecera de sección */}
                <View style={styles.sectionHeader} wrap={false}>
                  {grupo.nombre_cobrador &&
                  grupo.nombre_cobrador !== "Sin nombre" ? (
                    <Text style={styles.sectionHeaderName}>
                      {grupo.nombre_cobrador}
                    </Text>
                  ) : (
                    <View style={styles.badgeSinCobrador}>
                      <Text style={styles.badgeTextSinCobrador}>
                        ⚠ Cobros no abonados
                      </Text>
                    </View>
                  )}
                  <Text style={styles.sectionHeaderMeta}>
                    {grupo.filas.length} cargo
                    {grupo.filas.length !== 1 ? "s" : ""}
                  </Text>
                </View>

                {/* Subtotales del cobrador */}
                <View style={styles.summaryRow} wrap={false}>
                  <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Total recaudado</Text>
                    <Text style={styles.summaryValueGreen}>
                      {money(grupo.subtotal_monto)}
                    </Text>
                  </View>
                  <View style={styles.summaryCellLast}>
                    <Text style={styles.summaryLabel}>Saldo restante</Text>
                    <Text style={styles.summaryValueRed}>
                      {money(grupo.subtotal_saldo)}
                    </Text>
                  </View>
                </View>

                {/* Subtítulo */}
                <View style={styles.detailTitleBox}>
                  <Text style={styles.detailTitle}>Detalle de cargos</Text>
                </View>

                {/* Cabecera tabla */}
                <View style={styles.tableHead}>
                  <Text style={[styles.thCenter, styles.colContrato]}>
                    No.{"\n"}Contrato
                  </Text>
                  <Text style={[styles.th, styles.colNombre]}>
                    Cuentahabiente
                  </Text>
                  <Text style={[styles.th, styles.colCalle]}>Calle</Text>
                  <Text style={[styles.th, styles.colTipo]}>Tipo Cargo</Text>
                  <Text style={[styles.thCenter, styles.colFechaCargo]}>
                    Fecha{"\n"}Cargo
                  </Text>
                  <Text style={[styles.thCenter, styles.colEstatus]}>
                    Estatus
                  </Text>
                  <Text style={[styles.thCenter, styles.colFechaPago]}>
                    Fecha{"\n"}Pago
                  </Text>
                  <Text style={[styles.thRight, styles.colMonto]}>
                    Monto{"\n"}Recibido
                  </Text>
                  <Text style={[styles.thRight, styles.colSaldo]}>
                    Saldo{"\n"}Restante
                  </Text>
                </View>

                {/* Filas */}
                <View style={styles.detailRowsBox}>
                  {grupo.filas.map((fila, i) => {
                    const pagado =
                      fila.estatus_cargo?.toLowerCase() === "pagado";
                    return (
                      <View
                        key={`${fila.id}-${i}`}
                        style={
                          i % 2 === 0 ? styles.detailRow : styles.detailRowAlt
                        }
                        wrap={false}
                      >
                        <Text style={[styles.tdCenter, styles.colContrato]}>
                          {fila.numero_contrato || "—"}
                        </Text>
                        {fila.nombre_cuentahabiente &&
                        fila.nombre_cuentahabiente !== "Sin nombre" ? (
                          <Text style={[styles.td, styles.colNombre]}>
                            {fila.nombre_cuentahabiente}
                          </Text>
                        ) : (
                          <View
                            style={[
                              styles.colNombre,
                              { justifyContent: "center" },
                            ]}
                          >
                            <View style={styles.badgeSinAbono}>
                              <Text style={styles.badgeTextSinAbono}>
                                ⚠ Cobro no abonado
                              </Text>
                            </View>
                          </View>
                        )}
                        <Text style={[styles.tdMuted, styles.colCalle]}>
                          {fila.calle}
                        </Text>
                        <Text style={[styles.tdMuted, styles.colTipo]}>
                          {fila.tipo_cargo}
                        </Text>
                        <Text style={[styles.tdCenter, styles.colFechaCargo]}>
                          {formatFecha(fila.fecha_cargo)}
                        </Text>
                        {/* Badge estatus */}
                        <View
                          style={[
                            styles.colEstatus,
                            { alignItems: "center", justifyContent: "center" },
                          ]}
                        >
                          <View
                            style={
                              pagado
                                ? styles.badgePagado
                                : styles.badgePendiente
                            }
                          >
                            <Text
                              style={
                                pagado
                                  ? styles.badgeTextPagado
                                  : styles.badgeTextPendiente
                              }
                            >
                              {fila.estatus_cargo}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.tdCenter, styles.colFechaPago]}>
                          {formatFecha(fila.fecha_pago)}
                        </Text>
                        <Text style={[styles.tdGreen, styles.colMonto]}>
                          {money(fila.monto_recibido)}
                        </Text>
                        <Text style={[styles.tdRed, styles.colSaldo]}>
                          {money(fila.saldo_restante_cargo)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Gran total */}
            <View style={styles.grandTotalBox} wrap={false}>
              <View style={styles.grandTotalLeft}>
                <Text style={styles.grandTotalTitle}>
                  Sumatoria global de cargos
                </Text>
                <Text style={styles.grandTotalSub}>
                  Total recaudado: {money(granTotalMonto)}
                  {"  •  "}Saldo restante total: {money(granTotalSaldo)}
                </Text>
              </View>
              <Text style={styles.grandTotalValue}>
                {money(granTotalMonto)}
              </Text>
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
