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
  estatus: string;
  saldo_pendiente: number;
  historico: Array<{
    fecha_pago: string;
    monto_recibido: number;
    anio: number;
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
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const statusColor = (estatus: string) => {
  const v = (estatus || "").trim().toLowerCase();
  if (v === "pagado") return "#16a34a";
  if (v === "rezagado") return "#f59e0b";
  if (v === "adeudo") return "#ef4444";
  if (v === "corriente") return "#16a34a";
  return "#64748b";
};

const getPdfTitle = (
  estatus: string,
  historico: EstadoCuentaPDFData["historico"],
) => {
  const v = (estatus || "").trim().toLowerCase();

  if (v === "pagado" && historico?.length) {
    const last = historico[historico.length - 1];
    return `Recibo de Pago ${last.anio}`;
  }
  return "Estado de Cuenta";
};

const getBrandYear = (data: EstadoCuentaPDFData) => {
  const v = (data.estatus || "").trim().toLowerCase();

  if (v === "pagado" && data.historico?.length) {
    const last = data.historico[data.historico.length - 1];
    return last.anio;
  }

  return new Date().getFullYear();
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

  label: { color: "#475569", fontSize: 9 },

  value: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: 700,
    maxWidth: "62%",
    textAlign: "right",
  },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "transparent",
    marginRight: 8,
  },

  cardTitle: { color: "#475569", marginBottom: 6, fontSize: 9 },

  cardBig: { fontSize: 12, fontWeight: 700, color: "#0f172a" },

  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
    alignSelf: "flex-start",
    opacity: 1,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0b3a66",
    marginBottom: 8,
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

  th: { color: "#ffffff", fontWeight: 700, fontSize: 9 },

  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },

  td: { fontSize: 9, color: "#0f172a" },

  colFecha: { width: "55%" },
  colMonto: { width: "25%", textAlign: "right" },
  colAnio: { width: "20%", textAlign: "right" },

  totalBox: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  totalText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
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
  const totalHistorico = (data.historico || []).reduce(
    (sum, p) => sum + Number(p.monto_recibido || 0),
    0,
  );

  const footerDate = new Date().toLocaleDateString("es-MX");
  const brandYear = getBrandYear(data);

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
              COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO,{"\n"}ACUAMANALA, TLAX.{" "}
              {brandYear}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {getPdfTitle(data.estatus, data.historico)}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Contrato</Text>
              <Text style={styles.value}>{data.numero_contrato}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{data.nombre}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>
                {data.direccion}, Guadalupe Hidalgo, {"\n"} Acuamanala, Tlax.
                C.P. 90860
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estatus</Text>
            <Text
              style={[
                styles.statusPill,
                { backgroundColor: statusColor(data.estatus) },
              ]}
            >
              {(data.estatus || "—").toUpperCase()}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Saldo pendiente</Text>
            <Text style={styles.cardBig}>{money(data.saldo_pendiente)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Histórico de pagos</Text>

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.colFecha]}>Fecha de pago</Text>
            <Text style={[styles.th, styles.colMonto]}>Monto</Text>
            <Text style={[styles.th, styles.colAnio]}>Año</Text>
          </View>

          {data.historico?.length ? (
            data.historico.map((p, idx) => (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.td, styles.colFecha]}>
                  {formatFechaLocal(p.fecha_pago)}
                </Text>
                <Text style={[styles.td, styles.colMonto]}>
                  {money(p.monto_recibido)}
                </Text>
                <Text style={[styles.td, styles.colAnio]}>{p.anio}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tr}>
              <Text style={styles.td}>Sin pagos registrados</Text>
            </View>
          )}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalText}>
            Total recaudado: {money(totalHistorico)}
          </Text>
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
