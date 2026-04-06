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

export type EstadoCuentaPDFData = {
  numero_contrato: number | string;
  nombre: string;
  direccion: string;
  telefono: string;
  anio: number;
  nombre_servicio: string;
  estatus: string;
  saldo_pendiente: number;
  historico: Array<{
    fecha_pago: string;
    tipo_movimiento: string;
    monto_recibido: number;
  }>;
};

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatFechaLocal = (fecha: string) => {
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

const getLastPayment = (historico: EstadoCuentaPDFData["historico"]) => {
  if (!historico?.length) return null;

  return [...historico].sort((a, b) => {
    const fa = new Date(a.fecha_pago).getTime();
    const fb = new Date(b.fecha_pago).getTime();
    return fa - fb;
  })[historico.length - 1];
};

const getPdfTitle = (
  estatus: string,
  historico: EstadoCuentaPDFData["historico"],
) => {
  const v = (estatus || "").trim().toLowerCase();
  const last = getLastPayment(historico);

  if (v === "pagado" && last) {
    return "Recibo y Estado de Cuenta";
  }

  return "Recibo y Estado de Cuenta";
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 18,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },

  watermark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 260,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.18,
  },

  watermarkImg: {
    width: 400,
    height: 400,
    objectFit: "contain",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  leftBrand: {
    width: "34%",
  },

  logoWrap: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  logo: {
    width: 78,
    height: 78,
    objectFit: "contain",
  },

  brandText: {
    marginTop: 6,
    fontSize: 7,
    color: "#0f172a",
    lineHeight: 1.2,
  },

  infoCard: {
    width: "66%",
    borderWidth: 1,
    borderColor: "#d6dbe3",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0b3a66",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  label: {
    color: "#475569",
    fontSize: 9,
  },

  value: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: 700,
    maxWidth: "62%",
    textAlign: "right",
  },

  yearHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },

  yearTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0b3a66",
  },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },

  summaryCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#d7dee7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
  },

  summaryCardLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 6,
  },

  saldoCardValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },

  badgeBase: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 700,
    color: "#ffffff",
  },

  badgePagado: {
    backgroundColor: "#16a34a",
  },

  badgeAdeudo: {
    backgroundColor: "#ef4444",
  },

  badgeRezagado: {
    backgroundColor: "#f97316",
  },

  badgeDefault: {
    backgroundColor: "#2563eb",
  },

  table: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  thead: {
    flexDirection: "row",
    backgroundColor: "#0b3a66",
    paddingVertical: 9,
    paddingHorizontal: 10,
  },

  th: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 9,
  },

  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },

  td: {
    fontSize: 9,
    color: "#0f172a",
  },

  colFecha: {
    width: "34%",
  },

  colTipo: {
    width: "38%",
  },

  colMonto: {
    width: "28%",
    textAlign: "right",
  },

  summaryBox: {
    marginTop: 12,
    alignItems: "flex-end",
  },

  summaryLine: {
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0b3a66",
  },

  alertText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#b91c1c",
    marginTop: 2,
  },

  footer: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#64748b",
  },

  footerCenter: {
    textAlign: "center",
    flexGrow: 1,
  },
});

export default function EstadoCuentaPDF({
  data,
}: {
  data: EstadoCuentaPDFData;
}) {
  const footerDate = new Date().toLocaleDateString("es-MX");

  const totalAportado = (data.historico || []).reduce(
    (acc, item) => acc + Number(item.monto_recibido || 0),
    0,
  );

  const sinPagos = totalAportado === 0;

  const getEstatusBadgeStyle = (estatus: string) => {
    const value = (estatus || "").trim().toLowerCase();

    if (value === "pagado") return styles.badgePagado;
    if (value === "adeudo") return styles.badgeAdeudo;
    if (value === "rezagado") return styles.badgeRezagado;

    return styles.badgeDefault;
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.leftBrand}>
            <View style={styles.logoWrap}>
              <Image src={Logo} style={styles.logo} />
            </View>
            <Text style={styles.brandText}>
              COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO,{"\n"}ACUAMANALA, TLAX.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {getPdfTitle(data.estatus, data.historico)}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Número de Contrato</Text>
              <Text style={styles.value}>{data.numero_contrato}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{data.nombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{data.telefono || "—"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Tipo de servicio</Text>
              <Text style={styles.value}>{data.nombre_servicio || "—"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>
                {data.direccion}, Guadalupe Hidalgo, {"\n"}Acuamanala, Tlax.
                C.P. 90860
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.yearHeader}>
          <Text style={styles.yearTitle}>Histórico de pagos {data.anio}</Text>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Estatus</Text>
            <Text
              style={[styles.badgeBase, getEstatusBadgeStyle(data.estatus)]}
            >
              {(data.estatus || "—").toUpperCase()}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Saldo pendiente</Text>
            <Text style={styles.saldoCardValue}>
              {money(data.saldo_pendiente)}
            </Text>
          </View>
        </View>

        {data.historico?.length ? (
          <View style={styles.table}>
            <View style={styles.thead}>
              <Text style={[styles.th, styles.colFecha]}>Fecha de pago</Text>
              <Text style={[styles.th, styles.colTipo]}>
                Tipo de movimiento
              </Text>
              <Text style={[styles.th, styles.colMonto]}>Monto</Text>
            </View>

            {data.historico.map((p, idx) => (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.td, styles.colFecha]}>
                  {formatFechaLocal(p.fecha_pago)}
                </Text>
                <Text style={[styles.td, styles.colTipo]}>
                  {p.tipo_movimiento || "—"}
                </Text>
                <Text style={[styles.td, styles.colMonto]}>
                  {money(p.monto_recibido)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={styles.td}>Sin pagos registrados</Text>
            </View>
          </View>
        )}

        <View style={styles.summaryBox}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>
              Total aportado:{" "}
              <Text style={styles.summaryValue}>{money(totalAportado)}</Text>
            </Text>
          </View>

          {sinPagos && (
            <Text style={styles.alertText}>
              No se registran pagos en este año.
            </Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerCenter}>
            Guadalupe Hidalgo Acuamanala, C.P. 90860
          </Text>
          <Text>{footerDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
