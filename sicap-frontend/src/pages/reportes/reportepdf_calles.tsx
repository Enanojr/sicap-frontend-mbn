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

import type { EstadoCuentaNewDetalleRow } from "../../services/reporte_cobradores";

interface Props {
  rows: EstadoCuentaNewDetalleRow[];
  anio?: number;
  nombreCalle: string;
}

// ── Tipos de agrupación ──────────────────────────────────────────────────────

type PagoGroup = {
  fecha_pago: string | null;
  tipo_movimiento: string | null;
  detalle_movimiento: string | null;
  monto_recibido: number;
};

type CobradorGroup = {
  id_cobrador: number;
  nombre_cobrador: string;
  pagos: PagoGroup[];
  total_recaudado: number;
};

type CuentahabienteGroup = {
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  servicio: string;
  saldo_pendiente_actualizado: number;
  deuda_actualizada: string;
  cobradores: CobradorGroup[];
  total_recaudado: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatFechaLocal = (fecha?: string | null) => {
  if (!fecha) return "—";
  const clean = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const sortByFechaAsc = (a?: string | null, b?: string | null) =>
  (a ? new Date(a).getTime() : 0) - (b ? new Date(b).getTime() : 0);

// ── Agrupación: Calle → Cuentahabiente → Cobrador → Pagos ───────────────────

const groupRows = (
  rows: EstadoCuentaNewDetalleRow[],
): CuentahabienteGroup[] => {
  const cuentaMap = new Map<number, CuentahabienteGroup>();

  [...rows]
    .sort((a, b) => {
      const nameCmp = String(a.nombre_cuentahabiente || "").localeCompare(
        String(b.nombre_cuentahabiente || ""),
        "es-MX",
      );
      if (nameCmp !== 0) return nameCmp;
      return sortByFechaAsc(a.fecha_pago, b.fecha_pago);
    })
    .forEach((row) => {
      const cuentaId = Number(row.id_cuentahabiente || 0);
      const monto = Number(row.monto_recibido || 0);
      const cobradorId = Number(row.id_cobrador || 0);

      if (!cuentaMap.has(cuentaId)) {
        cuentaMap.set(cuentaId, {
          id_cuentahabiente: cuentaId,
          numero_contrato: row.numero_contrato,
          nombre_cuentahabiente: row.nombre_cuentahabiente || "Sin nombre",
          servicio: row.servicio || "",
          saldo_pendiente_actualizado: Number(
            row.saldo_pendiente_actualizado || 0,
          ),
          deuda_actualizada: row.deuda_actualizada || "",
          cobradores: [],
          total_recaudado: 0,
        });
      }

      const cuenta = cuentaMap.get(cuentaId)!;
      cuenta.total_recaudado += monto;

      let cobrador = cuenta.cobradores.find(
        (c) => c.id_cobrador === cobradorId,
      );

      if (!cobrador) {
        cobrador = {
          id_cobrador: cobradorId,
          nombre_cobrador: row.nombre_cobrador || "Sin nombre",
          pagos: [],
          total_recaudado: 0,
        };
        cuenta.cobradores.push(cobrador);
      }

      cobrador.pagos.push({
        fecha_pago: row.fecha_pago,
        tipo_movimiento: row.tipo_movimiento,
        detalle_movimiento: row.detalle_movimiento,
        monto_recibido: monto,
      });
      cobrador.total_recaudado += monto;
    });

  return Array.from(cuentaMap.values())
    .map((cuenta) => ({
      ...cuenta,
      cobradores: cuenta.cobradores
        .map((c) => ({
          ...c,
          pagos: [...c.pagos].sort((a, b) =>
            sortByFechaAsc(a.fecha_pago, b.fecha_pago),
          ),
        }))
        .sort((a, b) =>
          a.nombre_cobrador.localeCompare(b.nombre_cobrador, "es-MX"),
        ),
    }))
    .sort((a, b) =>
      a.nombre_cuentahabiente.localeCompare(b.nombre_cuentahabiente, "es-MX"),
    );
};

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 28,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },

  watermark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 250,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.1,
  },
  watermarkImg: {
    width: 380,
    height: 380,
    objectFit: "contain",
  },

  // Encabezado
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  leftBrand: { width: "34%" },
  logoWrap: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  logo: { width: 78, height: 78, objectFit: "contain" },
  brandText: { marginTop: 6, fontSize: 7, color: "#0f172a", lineHeight: 1.2 },

  infoCard: {
    width: "66%",
    borderWidth: 1,
    borderColor: "#d6dbe3",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "bold",
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
    fontWeight: "bold",
    maxWidth: "62%",
    textAlign: "right",
  },

  // Tarjetas resumen
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryCardPrimary: {
    width: "48.5%",
    borderWidth: 1.2,
    borderColor: "#0b3a66",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#eff6ff",
  },
  summaryCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#d7dee7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
  },
  summaryLabel: { fontSize: 8.5, color: "#64748b", marginBottom: 5 },
  summaryValuePrimary: { fontSize: 15, fontWeight: "bold", color: "#0b3a66" },
  summaryValue: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0b3a66",
    marginBottom: 8,
    marginTop: 4,
  },

  // Tarjeta de cuentahabiente
  accountCard: {
    borderWidth: 1,
    borderColor: "#d6dbe3",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  accountName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  accountMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  accountMetaLabel: { fontSize: 8.5, color: "#64748b" },
  accountMetaValue: {
    fontSize: 8.5,
    color: "#0f172a",
    fontWeight: "bold",
    maxWidth: "62%",
    textAlign: "right",
  },

  // Sub-sección cobrador dentro de la tarjeta
  cobradorBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  cobradorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e3a5f",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cobradorName: { fontSize: 9, fontWeight: "bold", color: "#ffffff" },
  cobradorTotal: { fontSize: 9, color: "#bfdbfe" },

  // Tabla de pagos dentro del cobrador
  table: { backgroundColor: "transparent" },
  thead: {
    flexDirection: "row",
    backgroundColor: "#0b3a66",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  th: { color: "#ffffff", fontWeight: "bold", fontSize: 8 },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  trEven: { backgroundColor: "#f8fafc" },
  td: { fontSize: 8, color: "#0f172a" },

  colFecha: { width: "22%" },
  colTipo: { width: "25%" },
  colDetalle: { width: "30%" },
  colMonto: { width: "23%", textAlign: "right" },

  // Subtotal por cuentahabiente
  subtotalBox: { marginTop: 8, alignItems: "flex-end" },
  subtotalLabel: { fontSize: 9.5, fontWeight: "bold", color: "#0f172a" },
  subtotalValue: { fontSize: 12, fontWeight: "bold", color: "#0b3a66" },

  // Total general
  totalBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#0b3a66",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#eff6ff",
    alignItems: "flex-end",
  },
  totalLabel: { fontSize: 11, fontWeight: "bold", color: "#0f172a" },
  totalValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0b3a66",
    marginTop: 3,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#d6dbe3",
    borderRadius: 10,
    padding: 14,
  },
  emptyText: { fontSize: 10, color: "#475569" },

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
  footerCenter: { textAlign: "center", flexGrow: 1 },
});

// ── Componente ───────────────────────────────────────────────────────────────

export default function EstadoCuentaCallesPDF({
  rows,
  anio,
  nombreCalle,
}: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const cuentahabientes = groupRows(rows);

  const totalRecaudado = cuentahabientes.reduce(
    (s, c) => s + c.total_recaudado,
    0,
  );

  const reportTitle = anio
    ? `Reporte de pagos por calle — ${anio}`
    : "Reporte de pagos por calle";

  if (!cuentahabientes.length) {
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
              <Text style={styles.infoTitle}>{reportTitle}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Calle</Text>
                <Text style={styles.value}>{nombreCalle}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Fecha de emisión</Text>
                <Text style={styles.value}>{footerDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No existe información disponible para generar este reporte.
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

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        {/* Encabezado */}
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
            <Text style={styles.infoTitle}>{reportTitle}</Text>

            {anio && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Año del reporte</Text>
                <Text style={styles.value}>{anio}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Calle</Text>
              <Text style={styles.value}>{nombreCalle}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Cuentahabientes</Text>
              <Text style={styles.value}>{cuentahabientes.length}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Fecha de emisión</Text>
              <Text style={styles.value}>{footerDate}</Text>
            </View>
          </View>
        </View>

        {/* Tarjetas resumen */}
        <View style={styles.cardsRow}>
          <View style={styles.summaryCardPrimary}>
            <Text style={styles.summaryLabel}>Total recaudado en la calle</Text>
            <Text style={styles.summaryValuePrimary}>
              {money(totalRecaudado)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Cuentahabientes atendidos</Text>
            <Text style={styles.summaryValue}>{cuentahabientes.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Desglose por cuentahabiente y cobrador
        </Text>

        {/* Una tarjeta por cuentahabiente */}
        {cuentahabientes.map((cuenta, ci) => (
          <View
            key={`${cuenta.id_cuentahabiente}-${ci}`}
            style={styles.accountCard}
            wrap={false}
          >
            {/* Datos del cuentahabiente */}
            <Text style={styles.accountName}>
              {cuenta.nombre_cuentahabiente}
            </Text>

            <View style={styles.accountMetaRow}>
              <Text style={styles.accountMetaLabel}>Número de contrato</Text>
              <Text style={styles.accountMetaValue}>
                {cuenta.numero_contrato || "—"}
              </Text>
            </View>

            <View style={styles.accountMetaRow}>
              <Text style={styles.accountMetaLabel}>Tipo de servicio</Text>
              <Text style={styles.accountMetaValue}>
                {cuenta.servicio || "—"}
              </Text>
            </View>

            <View style={styles.accountMetaRow}>
              <Text style={styles.accountMetaLabel}>Estatus</Text>
              <Text style={styles.accountMetaValue}>
                {cuenta.deuda_actualizada || "—"}
              </Text>
            </View>

            <View style={styles.accountMetaRow}>
              <Text style={styles.accountMetaLabel}>Saldo pendiente</Text>
              <Text style={styles.accountMetaValue}>
                {money(cuenta.saldo_pendiente_actualizado)}
              </Text>
            </View>

            {/* Sub-secciones por cobrador */}
            {cuenta.cobradores.map((cobrador, cbi) => (
              <View
                key={`${cobrador.id_cobrador}-${cbi}`}
                style={styles.cobradorBox}
              >
                {/* Cabecera del cobrador */}
                <View style={styles.cobradorHeader}>
                  <Text style={styles.cobradorName}>
                    Cobrador: {cobrador.nombre_cobrador}
                  </Text>
                  <Text style={styles.cobradorTotal}>
                    Recaudado: {money(cobrador.total_recaudado)}
                  </Text>
                </View>

                {/* Tabla de pagos */}
                <View style={styles.table}>
                  <View style={styles.thead}>
                    <Text style={[styles.th, styles.colFecha]}>
                      Fecha de pago
                    </Text>
                    <Text style={[styles.th, styles.colTipo]}>Tipo</Text>
                    <Text style={[styles.th, styles.colDetalle]}>
                      Descuento
                    </Text>
                    <Text style={[styles.th, styles.colMonto]}>Monto</Text>
                  </View>

                  {cobrador.pagos.length > 0 ? (
                    cobrador.pagos.map((pago, pi) => (
                      <View
                        key={pi}
                        style={[styles.tr, pi % 2 === 1 ? styles.trEven : {}]}
                      >
                        <Text style={[styles.td, styles.colFecha]}>
                          {formatFechaLocal(pago.fecha_pago)}
                        </Text>
                        <Text style={[styles.td, styles.colTipo]}>
                          {pago.tipo_movimiento || "—"}
                        </Text>
                        <Text style={[styles.td, styles.colDetalle]}>
                          {pago.detalle_movimiento || "—"}
                        </Text>
                        <Text style={[styles.td, styles.colMonto]}>
                          {money(pago.monto_recibido)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.tr}>
                      <Text style={styles.td}>Sin pagos registrados</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Subtotal del cuentahabiente */}
            <View style={styles.subtotalBox}>
              <Text style={styles.subtotalLabel}>
                Total recaudado por cuentahabiente
              </Text>
              <Text style={styles.subtotalValue}>
                {money(cuenta.total_recaudado)}
              </Text>
            </View>
          </View>
        ))}

        {/* Total general de la calle */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>
            Total recaudado en {nombreCalle}
          </Text>
          <Text style={styles.totalValue}>{money(totalRecaudado)}</Text>
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
