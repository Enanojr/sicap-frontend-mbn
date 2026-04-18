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

// ── Tipos ────────────────────────────────────────────────────────────────────

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

// ── Agrupación ───────────────────────────────────────────────────────────────

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

const AZUL_OSCURO = "#0b2e52";
const AZUL_MED = "#1a4b7a";
const AZUL_SUAVE = "#2d6ca8";

const AZUL_PALO = "#eff6ff";
const GRIS_BORDE = "#d1d9e3";
const GRIS_BG = "#f8fafc";
const TEXTO_PRIM = "#0f172a";
const TEXTO_SEC = "#475569";
const TEXTO_HINT = "#94a3b8";
const VERDE = "#15803d";
const ROJO = "#b91c1c";

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 28,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXTO_PRIM,
    backgroundColor: "#ffffff",
  },

  // ── Marca de agua ──
  watermark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 310,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.06,
  },
  watermarkImg: {
    width: 360,
    height: 360,
    objectFit: "contain",
  },

  // ── Banda de hero superior ──
  heroBand: {
    backgroundColor: AZUL_OSCURO,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  heroLeft: {
    flexDirection: "column",
    flex: 1,
  },
  heroTagline: {
    fontSize: 7.5,
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroCalleLabel: {
    fontSize: 7,
    color: "#93c5fd",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  heroCalleName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 1.15,
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: 18,
  },
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  heroMetaText: {
    fontSize: 8,
    color: "#bfdbfe",
  },
  heroMetaValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 4,
  },
  heroRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexDirection: "column",
    minWidth: 120,
  },
  heroLogo: {
    width: 56,
    height: 56,
    objectFit: "contain",
    marginBottom: 8,
  },
  heroBrandText: {
    fontSize: 6.2,
    color: "#7dd3fc",
    textAlign: "right",
    lineHeight: 1.4,
  },

  // ── Banda de totales bajo el hero ──
  statsBand: {
    backgroundColor: AZUL_MED,
    paddingVertical: 12,
    paddingHorizontal: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 6.5,
    color: "#bfdbfe",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statValueAccent: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#7dd3fc",
  },

  // ── Contenedor del cuerpo ──
  body: {
    paddingHorizontal: 22,
  },

  // ── Título de sección ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  sectionAccent: {
    width: 4,
    height: 14,
    backgroundColor: AZUL_SUAVE,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: AZUL_OSCURO,
  },
  sectionCount: {
    fontSize: 8,
    color: TEXTO_HINT,
    marginLeft: 6,
  },

  // ── Tarjeta de cuentahabiente ──
  accountCard: {
    borderWidth: 1,
    borderColor: GRIS_BORDE,
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },

  // Cabecera de la tarjeta
  accountCardHeader: {
    backgroundColor: "#f0f4f8",
    borderBottomWidth: 1,
    borderBottomColor: GRIS_BORDE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  accountCardHeaderLeft: {
    flex: 1,
  },
  accountIndex: {
    fontSize: 7,
    color: AZUL_SUAVE,
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountName: {
    fontSize: 11,
    fontWeight: "bold",
    color: AZUL_OSCURO,
  },
  accountCardHeaderRight: {
    alignItems: "flex-end",
  },
  accountTotalLabel: {
    fontSize: 7,
    color: TEXTO_HINT,
    marginBottom: 2,
  },
  accountTotalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: AZUL_SUAVE,
  },

  // Meta del cuentahabiente (grid 2 cols)
  accountMeta: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  accountMetaItem: {
    width: "50%",
    marginBottom: 4,
  },
  accountMetaLabel: {
    fontSize: 7,
    color: TEXTO_HINT,
    marginBottom: 1,
  },
  accountMetaValue: {
    fontSize: 8,
    color: TEXTO_PRIM,
    fontWeight: "bold",
  },
  accountMetaValueRed: {
    fontSize: 8,
    color: ROJO,
    fontWeight: "bold",
  },
  accountMetaValueGreen: {
    fontSize: 8,
    color: VERDE,
    fontWeight: "bold",
  },

  // ── Sub-bloque del cobrador ──
  cobradorWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
  },
  cobradorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf3",
  },
  cobradorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AZUL_SUAVE,
    marginRight: 6,
  },
  cobradorName: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: AZUL_MED,
    flex: 1,
  },
  cobradorSubtotal: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: AZUL_SUAVE,
  },

  cobradorSeparator: {
    height: 1,
    backgroundColor: "#edf2f7",
    marginVertical: 8,
    marginHorizontal: 12,
  },

  // ── Tabla de pagos ──
  table: {
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: AZUL_OSCURO,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 7.5,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  trEven: { backgroundColor: AZUL_PALO },
  td: { fontSize: 7.5, color: TEXTO_PRIM },
  tdMuted: { fontSize: 7.5, color: TEXTO_SEC },

  colFecha: { width: "21%" },
  colTipo: { width: "26%" },
  colDetalle: { width: "31%" },
  colMonto: { width: "22%", textAlign: "right" },

  // ── Total general de la calle ──
  totalBand: {
    marginHorizontal: 22,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: AZUL_OSCURO,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBandLeft: { flex: 1 },
  totalBandTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#bfdbfe",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalBandSub: {
    fontSize: 7.5,
    color: "#7dd3fc",
  },
  totalBandValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // ── Estado vacío ──
  emptyBox: {
    margin: 22,
    borderWidth: 1,
    borderColor: GRIS_BORDE,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    backgroundColor: GRIS_BG,
  },
  emptyText: { fontSize: 9.5, color: TEXTO_SEC },

  // ── Pie de página ──
  footer: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: TEXTO_HINT,
  },
  footerCenter: { textAlign: "center", flexGrow: 1 },
});

// ── Componente principal ─────────────────────────────────────────────────────

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
  const totalPagos = cuentahabientes.reduce(
    (s, c) => s + c.cobradores.reduce((sc, cb) => sc + cb.pagos.length, 0),
    0,
  );

  // Cobradores únicos en esta calle
  const cobradoresUnicos = [
    ...new Set(
      cuentahabientes.flatMap((c) =>
        c.cobradores.map((cb) => cb.nombre_cobrador),
      ),
    ),
  ];

  // ── Vacío ────────────────────────────────────────────────────────────────
  if (!cuentahabientes.length) {
    return (
      <Document>
        <Page size="LETTER" style={styles.page}>
          <View style={styles.heroBand}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTagline}>Estado de cuenta · Calle</Text>
              <Text style={styles.heroCalleLabel}>CALLE</Text>
              <Text style={styles.heroCalleName}>{nombreCalle}</Text>
            </View>
            <View style={styles.heroRight}>
              <Image src={Logo} style={styles.heroLogo} />
              <Text style={styles.heroBrandText}>
                COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO{"\n"}ACUAMANALA, TLAX.
              </Text>
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

  // ── Normal ───────────────────────────────────────────────────────────────
  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Marca de agua */}
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        {/* ── HERO: protagonista = la calle ── */}
        <View style={styles.heroBand} fixed>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTagline}>
              {anio ? `Estado de cuenta · ${anio}` : "Reporte · Calle"}
            </Text>
            <Text style={styles.heroCalleLabel}>CALLE</Text>
            <Text style={styles.heroCalleName}>{nombreCalle}</Text>

            {/* Pills de resumen rápido */}
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaText}>Cuentahabientes</Text>
                <Text style={styles.heroMetaValue}>
                  {cuentahabientes.length}
                </Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaText}>Cobros</Text>
                <Text style={styles.heroMetaValue}>{totalPagos}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Text style={styles.heroMetaText}>Emitido</Text>
                <Text style={styles.heroMetaValue}>{footerDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroRight}>
            <Image src={Logo} style={styles.heroLogo} />
            <Text style={styles.heroBrandText}>
              COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO{"\n"}ACUAMANALA, TLAX.
            </Text>
          </View>
        </View>

        {/* ── Banda de estadísticas ── */}
        <View style={styles.statsBand} fixed>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total recaudado</Text>
            <Text style={styles.statValueAccent}>{money(totalRecaudado)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cuentahabientes</Text>
            <Text style={styles.statValue}>{cuentahabientes.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cobradores activos</Text>
            <Text style={styles.statValue}>{cobradoresUnicos.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cobros registrados</Text>
            <Text style={styles.statValue}>{totalPagos}</Text>
          </View>
        </View>

        {/* ── Cuerpo ── */}
        <View style={styles.body}>
          {/* Título de sección */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Desglose por cuentahabiente</Text>
            <Text style={styles.sectionCount}>
              ({cuentahabientes.length} registros)
            </Text>
          </View>

          {/* Una tarjeta por cuentahabiente */}
          {cuentahabientes.map((cuenta, ci) => (
            <View
              key={`${cuenta.id_cuentahabiente}-${ci}`}
              style={styles.accountCard}
              wrap={false}
            >
              {/* Cabecera de la tarjeta */}
              <View style={styles.accountCardHeader}>
                <View style={styles.accountCardHeaderLeft}>
                  <Text style={styles.accountIndex}>
                    Cuentahabiente #{ci + 1}
                  </Text>
                  <Text style={styles.accountName}>
                    {cuenta.nombre_cuentahabiente}
                  </Text>
                </View>
                <View style={styles.accountCardHeaderRight}>
                  <Text style={styles.accountTotalLabel}>Total cobrado</Text>
                  <Text style={styles.accountTotalValue}>
                    {money(cuenta.total_recaudado)}
                  </Text>
                </View>
              </View>

              {/* Meta en grid 2×2 */}
              <View style={styles.accountMeta}>
                <View style={styles.accountMetaItem}>
                  <Text style={styles.accountMetaLabel}>Contrato</Text>
                  <Text style={styles.accountMetaValue}>
                    {cuenta.numero_contrato || "—"}
                  </Text>
                </View>
                <View style={styles.accountMetaItem}>
                  <Text style={styles.accountMetaLabel}>Tipo de servicio</Text>
                  <Text style={styles.accountMetaValue}>
                    {cuenta.servicio || "—"}
                  </Text>
                </View>
                <View style={styles.accountMetaItem}>
                  <Text style={styles.accountMetaLabel}>Estatus</Text>
                  <Text
                    style={
                      (cuenta.deuda_actualizada || "")
                        .toLowerCase()
                        .includes("adeudo")
                        ? styles.accountMetaValueRed
                        : styles.accountMetaValueGreen
                    }
                  >
                    {cuenta.deuda_actualizada || "—"}
                  </Text>
                </View>
                <View style={styles.accountMetaItem}>
                  <Text style={styles.accountMetaLabel}>Saldo pendiente</Text>
                  <Text
                    style={
                      cuenta.saldo_pendiente_actualizado > 0
                        ? styles.accountMetaValueRed
                        : styles.accountMetaValueGreen
                    }
                  >
                    {money(cuenta.saldo_pendiente_actualizado)}
                  </Text>
                </View>
              </View>

              {/* Sub-bloque por cobrador */}
              {cuenta.cobradores.map((cobrador, cbi) => (
                <View key={`${cobrador.id_cobrador}-${cbi}`}>
                  {cbi > 0 && <View style={styles.cobradorSeparator} />}

                  <View style={styles.cobradorWrap}>
                    {/* Encabezado del cobrador */}
                    <View style={styles.cobradorHeader}>
                      <View style={styles.cobradorDot} />
                      <Text style={styles.cobradorName}>
                        {cobrador.nombre_cobrador}
                      </Text>
                      <Text style={styles.cobradorSubtotal}>
                        {money(cobrador.total_recaudado)}
                      </Text>
                    </View>

                    {/* Tabla de pagos */}
                    <View style={styles.table}>
                      <View style={styles.thead}>
                        <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
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
                            style={[
                              styles.tr,
                              pi % 2 === 1 ? styles.trEven : {},
                            ]}
                          >
                            <Text style={[styles.td, styles.colFecha]}>
                              {formatFechaLocal(pago.fecha_pago)}
                            </Text>
                            <Text style={[styles.tdMuted, styles.colTipo]}>
                              {pago.tipo_movimiento || "—"}
                            </Text>
                            <Text style={[styles.tdMuted, styles.colDetalle]}>
                              {pago.detalle_movimiento || "—"}
                            </Text>
                            <Text style={[styles.td, styles.colMonto]}>
                              {money(pago.monto_recibido)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.tr}>
                          <Text style={styles.tdMuted}>
                            Sin cobros registrados
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── Total general de la calle ── */}
        <View style={styles.totalBand} wrap={false}>
          <View style={styles.totalBandLeft}>
            <Text style={styles.totalBandTitle}>
              Total recaudado en la calle
            </Text>
            <Text style={styles.totalBandSub}>
              {nombreCalle} · {cuentahabientes.length} cuentahabientes ·{" "}
              {totalPagos} Cobros
            </Text>
          </View>
          <Text style={styles.totalBandValue}>{money(totalRecaudado)}</Text>
        </View>

        {/* Pie de página */}
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
