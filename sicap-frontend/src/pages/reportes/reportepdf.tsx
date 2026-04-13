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

type CuentahabienteGroup = {
  id_cuentahabiente: number;
  numero_contrato: string | number;
  nombre_cuentahabiente: string;
  calle: string;
  servicio: string;
  saldo_pendiente_actualizado: number;
  deuda_actualizada: string;
  pagos: EstadoCuentaNewDetalleRow[];
  total_recaudado: number;
};

type CobradorGroup = {
  id_cobrador: number;
  nombre_cobrador: string;
  cuentahabientes: CuentahabienteGroup[];
  total_recaudado: number;
  total_pagos_normales: number;
  total_pagos_cargos: number;
  total_cuentahabientes: number;
  total_pagos: number;
  cuentahabientes_con_adeudo: number;
  porcentaje_pagos_normales: number;
  porcentaje_pagos_cargos: number;
};

interface Props {
  rows: EstadoCuentaNewDetalleRow[];
  anio?: number;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const percent = (value: number) => `${Number(value || 0).toFixed(1)}%`;

const formatFechaLocal = (fecha?: string | null) => {
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

const normalizeText = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isCargoPayment = (
  tipoMovimiento?: string | null,
  detalle?: string | null,
) => {
  const tipo = normalizeText(tipoMovimiento);
  const det = normalizeText(detalle);

  return tipo.includes("cargo") || det.includes("cargo");
};

const sortByFechaAsc = (a?: string | null, b?: string | null) => {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return aTime - bTime;
};

const groupRows = (rows: EstadoCuentaNewDetalleRow[]): CobradorGroup[] => {
  const cobradorMap = new Map<number, CobradorGroup>();

  [...rows]
    .sort((a, b) => {
      const cobradorCmp = String(a.nombre_cobrador || "").localeCompare(
        String(b.nombre_cobrador || ""),
        "es-MX",
      );
      if (cobradorCmp !== 0) return cobradorCmp;

      const cuentaCmp = String(a.nombre_cuentahabiente || "").localeCompare(
        String(b.nombre_cuentahabiente || ""),
        "es-MX",
      );
      if (cuentaCmp !== 0) return cuentaCmp;

      return sortByFechaAsc(a.fecha_pago, b.fecha_pago);
    })
    .forEach((row) => {
      const cobradorId = Number(row.id_cobrador || 0);

      if (!cobradorMap.has(cobradorId)) {
        cobradorMap.set(cobradorId, {
          id_cobrador: cobradorId,
          nombre_cobrador: row.nombre_cobrador || "Sin nombre",
          cuentahabientes: [],
          total_recaudado: 0,
          total_pagos_normales: 0,
          total_pagos_cargos: 0,
          total_cuentahabientes: 0,
          total_pagos: 0,
          cuentahabientes_con_adeudo: 0,
          porcentaje_pagos_normales: 0,
          porcentaje_pagos_cargos: 0,
        });
      }

      const cobrador = cobradorMap.get(cobradorId)!;

      let cuenta = cobrador.cuentahabientes.find(
        (item) => item.id_cuentahabiente === row.id_cuentahabiente,
      );

      if (!cuenta) {
        cuenta = {
          id_cuentahabiente: Number(row.id_cuentahabiente || 0),
          numero_contrato: row.numero_contrato,
          nombre_cuentahabiente: row.nombre_cuentahabiente || "Sin nombre",
          calle: row.calle || "",
          servicio: row.servicio || "",
          saldo_pendiente_actualizado: Number(
            row.saldo_pendiente_actualizado || 0,
          ),
          deuda_actualizada: row.deuda_actualizada || "",
          pagos: [],
          total_recaudado: 0,
        };

        cobrador.cuentahabientes.push(cuenta);
      }

      const monto = Number(row.monto_recibido || 0);

      cuenta.pagos.push(row);
      cuenta.total_recaudado += monto;

      cobrador.total_recaudado += monto;
      cobrador.total_pagos += 1;

      if (isCargoPayment(row.tipo_movimiento, row.detalle_movimiento)) {
        cobrador.total_pagos_cargos += monto;
      } else {
        cobrador.total_pagos_normales += monto;
      }
    });

  const cobradores = Array.from(cobradorMap.values()).map((cobrador) => {
    const cuentahabientes = cobrador.cuentahabientes
      .map((cuenta) => ({
        ...cuenta,
        pagos: [...cuenta.pagos].sort((a, b) =>
          sortByFechaAsc(a.fecha_pago, b.fecha_pago),
        ),
      }))
      .sort((a, b) =>
        String(a.nombre_cuentahabiente || "").localeCompare(
          String(b.nombre_cuentahabiente || ""),
          "es-MX",
        ),
      );

    const total_cuentahabientes = cuentahabientes.length;

    const cuentahabientes_con_adeudo = cuentahabientes.filter(
      (cuenta) => Number(cuenta.saldo_pendiente_actualizado || 0) > 0,
    ).length;

    const porcentaje_pagos_normales = cobrador.total_recaudado
      ? (cobrador.total_pagos_normales / cobrador.total_recaudado) * 100
      : 0;

    const porcentaje_pagos_cargos = cobrador.total_recaudado
      ? (cobrador.total_pagos_cargos / cobrador.total_recaudado) * 100
      : 0;

    return {
      ...cobrador,
      total_cuentahabientes,
      cuentahabientes_con_adeudo,
      porcentaje_pagos_normales,
      porcentaje_pagos_cargos,
      cuentahabientes,
    };
  });

  return cobradores;
};

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
    fontWeight: "bold",
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
    fontWeight: "bold",
    maxWidth: "62%",
    textAlign: "right",
  },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },
  summaryCardPrimary: {
    width: "48.5%",
    borderWidth: 1.2,
    borderColor: "#0b3a66",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#eff6ff",
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
  summaryCardValuePrimary: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0b3a66",
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },

  secondarySummaryBox: {
    borderWidth: 1,
    borderColor: "#d7dee7",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  secondarySummaryTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0b3a66",
    marginBottom: 8,
  },
  secondarySummaryText: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 5,
    lineHeight: 1.3,
  },
  secondarySummaryStrong: {
    fontWeight: "bold",
    color: "#0b3a66",
  },
  secondarySummaryStrongGreen: {
    fontWeight: "bold",
    color: "#15803d",
  },
  secondarySummaryStrongOrange: {
    fontWeight: "bold",
    color: "#c2410c",
  },
  secondarySummaryStrongRed: {
    fontWeight: "bold",
    color: "#b91c1c",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0b3a66",
    marginBottom: 8,
    marginTop: 6,
  },

  accountCard: {
    borderWidth: 1,
    borderColor: "#d6dbe3",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "transparent",
  },

  accountHeader: {
    marginBottom: 8,
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
  accountMetaLabel: {
    fontSize: 8.5,
    color: "#64748b",
  },
  accountMetaValue: {
    fontSize: 8.5,
    color: "#0f172a",
    fontWeight: "bold",
    maxWidth: "62%",
    textAlign: "right",
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
    fontWeight: "bold",
    fontSize: 8.5,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  trEven: {
    backgroundColor: "#f8fafc",
  },
  td: {
    fontSize: 8.5,
    color: "#0f172a",
  },

  colFecha: {
    width: "20%",
  },
  colTipo: {
    width: "25%",
  },
  colDetalle: {
    width: "30%",
  },
  colMonto: {
    width: "25%",
    textAlign: "right",
  },

  subtotalBox: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  subtotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtotalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0b3a66",
  },

  totalCobradorBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#0b3a66",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#eff6ff",
    alignItems: "flex-end",
  },
  totalCobradorLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalCobradorValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0b3a66",
    marginTop: 3,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#d6dbe3",
    borderRadius: 12,
    padding: 14,
  },
  emptyText: {
    fontSize: 10,
    color: "#475569",
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

const getReportTitle = (anio?: number) =>
  anio
    ? `Reporte de pagos por cobrador — ${anio}`
    : "Reporte de pagos por cobrador";

export default function EstadoCuentaCobradoresPDF({ rows, anio }: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const cobradores = groupRows(rows);

  if (!cobradores.length) {
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
              <Text style={styles.infoTitle}>{getReportTitle(anio)}</Text>
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
      {cobradores.map((cobrador, cobradorIndex) => (
        <Page
          key={`${cobrador.id_cobrador}-${cobradorIndex}`}
          size="LETTER"
          style={styles.page}
          wrap
        >
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
              <Text style={styles.infoTitle}>{getReportTitle(anio)}</Text>

              {/* Año destacado */}
              {anio && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Año del reporte</Text>
                  <Text style={styles.value}>{anio}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.label}>Cobrador</Text>
                <Text style={styles.value}>{cobrador.nombre_cobrador}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>ID cobrador</Text>
                <Text style={styles.value}>{cobrador.id_cobrador}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Cuentahabientes atendidos</Text>
                <Text style={styles.value}>
                  {cobrador.total_cuentahabientes}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Pagos registrados</Text>
                <Text style={styles.value}>{cobrador.total_pagos}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Fecha de emisión</Text>
                <Text style={styles.value}>{footerDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardsRow}>
            <View style={styles.summaryCardPrimary}>
              <Text style={styles.summaryCardLabel}>Total recaudado</Text>
              <Text style={styles.summaryCardValuePrimary}>
                {money(cobrador.total_recaudado)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>
                Cuentahabientes atendidos
              </Text>
              <Text style={styles.summaryCardValue}>
                {cobrador.total_cuentahabientes}
              </Text>
            </View>
          </View>

          <View style={styles.secondarySummaryBox}>
            <Text style={styles.secondarySummaryTitle}>
              Resumen de distribución
            </Text>

            <Text style={styles.secondarySummaryText}>
              Pagos normales:{" "}
              <Text style={styles.secondarySummaryStrongGreen}>
                {money(cobrador.total_pagos_normales)}
              </Text>
              {"  "}(
              <Text style={styles.secondarySummaryStrongGreen}>
                {percent(cobrador.porcentaje_pagos_normales)}
              </Text>
              )
            </Text>

            <Text style={styles.secondarySummaryText}>
              Pagos de cargos:{" "}
              <Text style={styles.secondarySummaryStrongOrange}>
                {money(cobrador.total_pagos_cargos)}
              </Text>
              {"  "}(
              <Text style={styles.secondarySummaryStrongOrange}>
                {percent(cobrador.porcentaje_pagos_cargos)}
              </Text>
              )
            </Text>

            <Text style={styles.secondarySummaryText}>
              Cuentahabientes con adeudo:{" "}
              <Text style={styles.secondarySummaryStrongRed}>
                {cobrador.cuentahabientes_con_adeudo}
              </Text>
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Desglose por cuentahabiente</Text>

          {cobrador.cuentahabientes.map((cuenta, cuentaIndex) => (
            <View
              key={`${cuenta.id_cuentahabiente}-${cuentaIndex}`}
              style={styles.accountCard}
              wrap={false}
            >
              <View style={styles.accountHeader}>
                <Text style={styles.accountName}>
                  {cuenta.nombre_cuentahabiente}
                </Text>

                <View style={styles.accountMetaRow}>
                  <Text style={styles.accountMetaLabel}>
                    Número de contrato
                  </Text>
                  <Text style={styles.accountMetaValue}>
                    {cuenta.numero_contrato || "—"}
                  </Text>
                </View>

                <View style={styles.accountMetaRow}>
                  <Text style={styles.accountMetaLabel}>Dirección / Calle</Text>
                  <Text style={styles.accountMetaValue}>
                    {cuenta.calle || "—"}
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
              </View>

              <View style={styles.table}>
                <View style={styles.thead}>
                  <Text style={[styles.th, styles.colFecha]}>
                    Fecha de pago
                  </Text>
                  <Text style={[styles.th, styles.colTipo]}>Tipo</Text>
                  <Text style={[styles.th, styles.colDetalle]}>Descuento</Text>
                  <Text style={[styles.th, styles.colMonto]}>Monto</Text>
                </View>

                {cuenta.pagos.length > 0 ? (
                  cuenta.pagos.map((pago, pagoIndex) => (
                    <View
                      key={`${cuenta.id_cuentahabiente}-${pagoIndex}`}
                      style={[
                        styles.tr,
                        pagoIndex % 2 === 1 ? styles.trEven : {},
                      ]}
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
                        {money(Number(pago.monto_recibido || 0))}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.tr}>
                    <Text style={styles.td}>Sin pagos registrados</Text>
                  </View>
                )}
              </View>

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

          <View style={styles.totalCobradorBox}>
            <Text style={styles.totalCobradorLabel}>
              Total recaudado por el cobrador
            </Text>
            <Text style={styles.totalCobradorValue}>
              {money(cobrador.total_recaudado)}
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerCenter}>
              Guadalupe Hidalgo Acuamanala, C.P. 90860
            </Text>
            <Text>{footerDate}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
