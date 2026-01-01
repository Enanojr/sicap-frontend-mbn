import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import Logo from "../../assets/Logo.png";

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
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

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
  return "#64748b";
};

const getPdfTitle = (
  estatus: string,
  historico: EstadoCuentaPDFData["historico"]
) => {
  const v = (estatus || "").trim().toLowerCase();

  if (v === "pagado" && historico?.length) {
    const last = historico[historico.length - 1];
    return `Recibo de Pago ${last.anio}`;
  }

  return "Estado de Cuenta";
};

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  logosBox: {
    width: "38%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 110,
    height: 42,
    objectFit: "contain",
  },

  infoBox: {
    width: "60%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
  },

  title: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0b3a66",
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    gap: 10,
  },

  label: { color: "#475569" },
  value: { fontWeight: 700, color: "#0f172a" },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },

  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ffffff",
  },

  cardTitle: { color: "#475569", marginBottom: 5 },
  cardBig: { fontSize: 12, fontWeight: 700, color: "#0f172a" },

  statusPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0b3a66",
    marginBottom: 8,
  },

  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
  },

  thead: {
    flexDirection: "row",
    backgroundColor: "#0b3a66",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  th: { color: "#ffffff", fontWeight: 700, fontSize: 9 },

  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },

  td: { fontSize: 9, color: "#0f172a" },

  colFecha: { width: "45%" },
  colMonto: { width: "35%", textAlign: "right" },
  colAnio: { width: "20%", textAlign: "right" },

  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#64748b",
    fontSize: 8,
  },
});

export default function EstadoCuentaPDF({
  data,
}: {
  data: EstadoCuentaPDFData;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logosBox}>
            <Image src={Logo} style={styles.logo} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.title}>
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
              <Text style={styles.value}>{data.direccion}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{data.telefono}</Text>
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

          {data.historico && data.historico.length > 0 ? (
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

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Documento generado automáticamente</Text>
          <Text>{new Date().toLocaleDateString("es-MX")}</Text>
        </View>
      </Page>
    </Document>
  );
}
