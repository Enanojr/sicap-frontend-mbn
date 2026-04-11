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
}

/**
 * true  = cada cobrador empieza en una hoja nueva
 * false = aprovecha espacio y solo salta cuando ya no cabe
 */
const ONE_COBRADOR_PER_PAGE = false;

/**
 * Reserva espacio para que no quede “viudo” el encabezado del cobrador.
 * Si no hay suficiente espacio disponible, manda el bloque a la siguiente página.
 */
const COBRADOR_MIN_PRESENCE_AHEAD = 155;

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

type ResumenCuentahabiente = {
  nombre: string;
  total_recaudado: number;
  total_pagos_normales: number;
  total_pagos_cargos: number;
  total_pagos: number;
};

type ResumenCobrador = {
  id_cobrador: number;
  nombre_cobrador: string;
  total_recaudado: number;
  total_pagos_normales: number;
  total_pagos_cargos: number;
  total_cuentahabientes: number;
  total_pagos: number;
  cuentahabientes: ResumenCuentahabiente[];
};

const buildResumen = (rows: EstadoCuentaNewDetalleRow[]): ResumenCobrador[] => {
  const cobradoresMap = new Map<
    number,
    {
      id_cobrador: number;
      nombre_cobrador: string;
      total_recaudado: number;
      total_pagos_normales: number;
      total_pagos_cargos: number;
      total_pagos: number;
      cuentahabientesMap: Map<string, ResumenCuentahabiente>;
    }
  >();

  rows.forEach((row) => {
    const id = Number(row.id_cobrador || 0);
    const nombreCobrador = row.nombre_cobrador?.trim() || "Sin nombre";
    const monto = Number(row.monto_recibido || 0);
    const nombreCuentahabiente =
      row.nombre_cuentahabiente?.trim() || "Sin nombre";
    const cargo = isCargoPayment(row.tipo_movimiento, row.detalle_movimiento);

    if (!cobradoresMap.has(id)) {
      cobradoresMap.set(id, {
        id_cobrador: id,
        nombre_cobrador: nombreCobrador,
        total_recaudado: 0,
        total_pagos_normales: 0,
        total_pagos_cargos: 0,
        total_pagos: 0,
        cuentahabientesMap: new Map<string, ResumenCuentahabiente>(),
      });
    }

    const cobrador = cobradoresMap.get(id)!;

    cobrador.total_recaudado += monto;
    cobrador.total_pagos += 1;

    if (cargo) {
      cobrador.total_pagos_cargos += monto;
    } else {
      cobrador.total_pagos_normales += monto;
    }

    if (!cobrador.cuentahabientesMap.has(nombreCuentahabiente)) {
      cobrador.cuentahabientesMap.set(nombreCuentahabiente, {
        nombre: nombreCuentahabiente,
        total_recaudado: 0,
        total_pagos_normales: 0,
        total_pagos_cargos: 0,
        total_pagos: 0,
      });
    }

    const cuenta = cobrador.cuentahabientesMap.get(nombreCuentahabiente)!;
    cuenta.total_recaudado += monto;
    cuenta.total_pagos += 1;

    if (cargo) {
      cuenta.total_pagos_cargos += monto;
    } else {
      cuenta.total_pagos_normales += monto;
    }
  });

  return Array.from(cobradoresMap.values())
    .map((c) => ({
      id_cobrador: c.id_cobrador,
      nombre_cobrador: c.nombre_cobrador,
      total_recaudado: c.total_recaudado,
      total_pagos_normales: c.total_pagos_normales,
      total_pagos_cargos: c.total_pagos_cargos,
      total_pagos: c.total_pagos,
      total_cuentahabientes: c.cuentahabientesMap.size,
      cuentahabientes: Array.from(c.cuentahabientesMap.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es-MX"),
      ),
    }))
    .sort((a, b) =>
      a.nombre_cobrador.localeCompare(b.nombre_cobrador, "es-MX"),
    );
};

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
  watermarkImg: {
    width: 320,
    height: 320,
    objectFit: "contain",
  },

  // Header fijo
  headerRow: {
    position: "absolute",
    top: 18,
    left: 22,
    right: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftBrand: {
    width: "27%",
    paddingRight: 10,
  },
  logo: {
    width: 66,
    height: 66,
    objectFit: "contain",
    marginBottom: 4,
  },
  brandText: {
    fontSize: 6.4,
    color: "#334155",
    lineHeight: 1.25,
  },

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
  label: {
    fontSize: 8,
    color: "#64748b",
  },
  value: {
    fontSize: 8,
    color: "#0f172a",
    fontWeight: "bold",
  },

  // Resumen general
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
  globalCard: {
    width: "31.8%",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#d5dde6",
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
  globalValuePrimary: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#123e6b",
  },
  globalValueGreen: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#15803d",
  },
  globalValueOrange: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#c2410c",
  },

  // Bloque por cobrador
  cobradorSection: {
    marginBottom: 14,
  },

  topLockedBlock: {
    // Este bloque se mantiene junto
  },

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
  sectionHeaderName: {
    width: "58%",
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 1.2,
  },
  sectionHeaderMeta: {
    width: "40%",
    fontSize: 7.2,
    color: "#dbeafe",
    textAlign: "right",
    lineHeight: 1.2,
  },

  summaryRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#d7e0ea",
    borderRightColor: "#d7e0ea",
    borderBottomWidth: 1,
    borderBottomColor: "#d7e0ea",
    backgroundColor: "#f8fafc",
  },
  summaryCell: {
    width: "33.33%",
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  summaryCellLast: {
    width: "33.34%",
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
  summaryValueBlue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#123e6b",
  },
  summaryValueGreen: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#15803d",
  },
  summaryValueOrange: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#c2410c",
  },

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
  headName: {
    width: "40%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
  },
  headPagos: {
    width: "10%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "center",
  },
  headNormales: {
    width: "17%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "right",
  },
  headCargos: {
    width: "15%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "right",
  },
  headTotal: {
    width: "18%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "right",
  },

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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    backgroundColor: "#ffffff",
  },
  detailRowAlt: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    backgroundColor: "#fafcff",
  },

  cellName: {
    width: "40%",
    fontSize: 7.2,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  cellPagos: {
    width: "10%",
    fontSize: 7.2,
    color: "#334155",
    textAlign: "center",
  },
  cellNormales: {
    width: "17%",
    fontSize: 7.2,
    color: "#15803d",
    textAlign: "right",
  },
  cellCargos: {
    width: "15%",
    fontSize: 7.2,
    color: "#c2410c",
    textAlign: "right",
  },
  cellTotal: {
    width: "18%",
    fontSize: 7.2,
    color: "#123e6b",
    textAlign: "right",
    fontWeight: "bold",
  },

  noDataRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
  },
  noDataText: {
    fontSize: 7.4,
    color: "#64748b",
    textAlign: "center",
  },

  grandTotalBox: {
    marginTop: 4,
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
  grandTotalLeft: {
    width: "68%",
  },
  grandTotalTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#123e6b",
  },
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

  emptyBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 10,
    color: "#64748b",
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

export default function EstadoCuentaGeneralPDF({ rows }: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const resumen = buildResumen(rows);

  const granTotal = resumen.reduce((s, c) => s + c.total_recaudado, 0);
  const granNormales = resumen.reduce((s, c) => s + c.total_pagos_normales, 0);
  const granCargos = resumen.reduce((s, c) => s + c.total_pagos_cargos, 0);
  const totalCuentahabientes = resumen.reduce(
    (s, c) => s + c.total_cuentahabientes,
    0,
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        <View style={styles.headerRow} fixed>
          <View style={styles.leftBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.brandText}>
              COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO{"\n"}ACUAMANALA, TLAX.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Resumen general de cobradores</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Total de cobradores</Text>
              <Text style={styles.value}>{resumen.length}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Cuentahabientes atendidos</Text>
              <Text style={styles.value}>{totalCuentahabientes}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Fecha de emisión</Text>
              <Text style={styles.value}>{footerDate}</Text>
            </View>
          </View>
        </View>

        {resumen.length > 0 && (
          <View style={styles.globalRow} wrap={false}>
            <View style={styles.globalCardPrimary}>
              <Text style={styles.globalLabel}>Gran total recaudado</Text>
              <Text style={styles.globalValuePrimary}>{money(granTotal)}</Text>
            </View>

            <View style={styles.globalCard}>
              <Text style={styles.globalLabel}>Pagos normales</Text>
              <Text style={styles.globalValueGreen}>{money(granNormales)}</Text>
            </View>

            <View style={styles.globalCard}>
              <Text style={styles.globalLabel}>Pagos de cargos</Text>
              <Text style={styles.globalValueOrange}>{money(granCargos)}</Text>
            </View>
          </View>
        )}

        {resumen.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No existe información disponible para generar este reporte.
            </Text>
          </View>
        ) : (
          <>
            {resumen.map((cobrador, index) => (
              <View
                key={cobrador.id_cobrador}
                style={styles.cobradorSection}
                break={ONE_COBRADOR_PER_PAGE && index > 0}
                minPresenceAhead={COBRADOR_MIN_PRESENCE_AHEAD}
              >
                {/* Este bloque se mantiene junto */}
                <View style={styles.topLockedBlock} wrap={false}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderName}>
                      {cobrador.nombre_cobrador}
                    </Text>
                    <Text style={styles.sectionHeaderMeta}>
                      {cobrador.total_cuentahabientes} cuentahabientes •{" "}
                      {cobrador.total_pagos} pagos
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Total recaudado</Text>
                      <Text style={styles.summaryValueBlue}>
                        {money(cobrador.total_recaudado)}
                      </Text>
                    </View>

                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Pagos normales</Text>
                      <Text style={styles.summaryValueGreen}>
                        {money(cobrador.total_pagos_normales)}
                      </Text>
                    </View>

                    <View style={styles.summaryCellLast}>
                      <Text style={styles.summaryLabel}>Pagos de cargos</Text>
                      <Text style={styles.summaryValueOrange}>
                        {money(cobrador.total_pagos_cargos)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailTitleBox}>
                    <Text style={styles.detailTitle}>
                      Detalle de recaudación por cuentahabiente
                    </Text>
                  </View>

                  <View style={styles.tableHead}>
                    <Text style={styles.headName}>Cuentahabiente</Text>
                    <Text style={styles.headPagos}>Pagos</Text>
                    <Text style={styles.headNormales}>Normales</Text>
                    <Text style={styles.headCargos}>Cargos</Text>
                    <Text style={styles.headTotal}>Total</Text>
                  </View>
                </View>

                {/* Estas filas sí pueden continuar en la siguiente página */}
                <View style={styles.detailRowsBox}>
                  {cobrador.cuentahabientes.length === 0 ? (
                    <View style={styles.noDataRow}>
                      <Text style={styles.noDataText}>
                        No hay cuentahabientes registrados para este cobrador.
                      </Text>
                    </View>
                  ) : (
                    cobrador.cuentahabientes.map((cuenta, rowIndex) => (
                      <View
                        key={`${cobrador.id_cobrador}-${cuenta.nombre}-${rowIndex}`}
                        style={
                          rowIndex % 2 === 0
                            ? styles.detailRow
                            : styles.detailRowAlt
                        }
                        wrap={false}
                      >
                        <Text style={styles.cellName}>{cuenta.nombre}</Text>
                        <Text style={styles.cellPagos}>
                          {cuenta.total_pagos}
                        </Text>
                        <Text style={styles.cellNormales}>
                          {money(cuenta.total_pagos_normales)}
                        </Text>
                        <Text style={styles.cellCargos}>
                          {money(cuenta.total_pagos_cargos)}
                        </Text>
                        <Text style={styles.cellTotal}>
                          {money(cuenta.total_recaudado)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ))}

            <View style={styles.grandTotalBox} wrap={false}>
              <View style={styles.grandTotalLeft}>
                <Text style={styles.grandTotalTitle}>Gran total recaudado</Text>
                <Text style={styles.grandTotalSub}>
                  Pagos normales: {money(granNormales)} • Pagos de cargos:{" "}
                  {money(granCargos)}
                </Text>
              </View>

              <Text style={styles.grandTotalValue}>{money(granTotal)}</Text>
            </View>
          </>
        )}

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
