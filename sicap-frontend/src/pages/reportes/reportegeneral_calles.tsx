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
}

const ONE_CALLE_PER_PAGE = false;
const CALLE_MIN_PRESENCE_AHEAD = 140;

// ── Helpers ──────────────────────────────────────────────────────────────────

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Tipos de agrupación ──────────────────────────────────────────────────────

type ResumenCobrador = {
  nombre_cobrador: string;
  total_recaudado: number;
  total_pagos: number;
};

type ResumenCuentahabiente = {
  nombre: string;
  numero_contrato: string | number;
  total_recaudado: number;
  total_pagos: number;
  cobradores: ResumenCobrador[];
};

type ResumenCalle = {
  nombre_calle: string;
  total_recaudado: number;
  total_pagos: number;
  total_cuentahabientes: number;
  cuentahabientes: ResumenCuentahabiente[];
};

// ── Construcción del resumen ─────────────────────────────────────────────────

const buildResumen = (rows: EstadoCuentaNewDetalleRow[]): ResumenCalle[] => {
  const calleMap = new Map<
    string,
    {
      nombre_calle: string;
      total_recaudado: number;
      total_pagos: number;
      cuentahabientesMap: Map<
        string,
        {
          nombre: string;
          numero_contrato: string | number;
          total_recaudado: number;
          total_pagos: number;
          cobradoresMap: Map<
            string,
            {
              nombre_cobrador: string;
              total_recaudado: number;
              total_pagos: number;
            }
          >;
        }
      >;
    }
  >();

  rows.forEach((row) => {
    const calle = (row.calle || "Sin calle").trim();
    const cuentahabiente = (row.nombre_cuentahabiente || "Sin nombre").trim();
    const cobrador = (row.nombre_cobrador || "Sin cobrador").trim();
    const monto = Number(row.monto_recibido || 0);
    const contrato = row.numero_contrato;

    if (!calleMap.has(calle)) {
      calleMap.set(calle, {
        nombre_calle: calle,
        total_recaudado: 0,
        total_pagos: 0,
        cuentahabientesMap: new Map(),
      });
    }

    const calleData = calleMap.get(calle)!;
    calleData.total_recaudado += monto;
    calleData.total_pagos += 1;

    if (!calleData.cuentahabientesMap.has(cuentahabiente)) {
      calleData.cuentahabientesMap.set(cuentahabiente, {
        nombre: cuentahabiente,
        numero_contrato: contrato,
        total_recaudado: 0,
        total_pagos: 0,
        cobradoresMap: new Map(),
      });
    }

    const cuentaData = calleData.cuentahabientesMap.get(cuentahabiente)!;
    cuentaData.total_recaudado += monto;
    cuentaData.total_pagos += 1;

    if (!cuentaData.cobradoresMap.has(cobrador)) {
      cuentaData.cobradoresMap.set(cobrador, {
        nombre_cobrador: cobrador,
        total_recaudado: 0,
        total_pagos: 0,
      });
    }

    const cobradorData = cuentaData.cobradoresMap.get(cobrador)!;
    cobradorData.total_recaudado += monto;
    cobradorData.total_pagos += 1;
  });

  return Array.from(calleMap.values())
    .map((c) => ({
      nombre_calle: c.nombre_calle,
      total_recaudado: c.total_recaudado,
      total_pagos: c.total_pagos,
      total_cuentahabientes: c.cuentahabientesMap.size,
      cuentahabientes: Array.from(c.cuentahabientesMap.values())
        .map((cu) => ({
          nombre: cu.nombre,
          numero_contrato: cu.numero_contrato,
          total_recaudado: cu.total_recaudado,
          total_pagos: cu.total_pagos,
          cobradores: Array.from(cu.cobradoresMap.values()).sort((a, b) =>
            a.nombre_cobrador.localeCompare(b.nombre_cobrador, "es-MX"),
          ),
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-MX")),
    }))
    .sort((a, b) => a.nombre_calle.localeCompare(b.nombre_calle, "es-MX"));
};

// ── Estilos ──────────────────────────────────────────────────────────────────

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

  // Encabezado fijo
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
  globalValuePrimary: { fontSize: 13, fontWeight: "bold", color: "#123e6b" },
  globalValueSecondary: { fontSize: 13, fontWeight: "bold", color: "#0f172a" },

  // Sección por calle
  calleSection: { marginBottom: 14 },

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
  },
  sectionHeaderMeta: {
    width: "40%",
    fontSize: 7.2,
    color: "#dbeafe",
    textAlign: "right",
  },

  // Fila de resumen de la calle
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
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  summaryCellLast: {
    width: "33.34%",
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 6.4,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
    textAlign: "center",
  },
  summaryValueBlue: { fontSize: 10, fontWeight: "bold", color: "#123e6b" },
  summaryValueGray: { fontSize: 10, fontWeight: "bold", color: "#334155" },

  // Cabecera tabla cuentahabientes
  detailTitleBox: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 6,
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
    width: "34%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
  },
  headContrato: {
    width: "16%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
  },
  headCobrador: {
    width: "28%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
  },
  headPagos: {
    width: "8%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "center",
  },
  headTotal: {
    width: "14%",
    fontSize: 6.7,
    fontWeight: "bold",
    color: "#123e6b",
    textTransform: "uppercase",
    textAlign: "right",
  },

  // Filas de detalle
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
  // Sub-fila de cobrador dentro del cuentahabiente
  cobradorSubRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingLeft: 16,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fbff",
  },

  cellName: { width: "34%", fontSize: 7.2, color: "#0f172a", lineHeight: 1.2 },
  cellContrato: { width: "16%", fontSize: 7.2, color: "#334155" },
  cellCobrador: { width: "28%", fontSize: 6.8, color: "#475569" },
  cellPagos: {
    width: "8%",
    fontSize: 7.2,
    color: "#334155",
    textAlign: "center",
  },
  cellTotal: {
    width: "14%",
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
  noDataText: { fontSize: 7.4, color: "#64748b", textAlign: "center" },

  // Gran total
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

  emptyBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 10, color: "#64748b", textAlign: "center" },

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

// ── Componente ───────────────────────────────────────────────────────────────

export default function EstadoCuentaGeneralCallesPDF({ rows, anio }: Props) {
  const footerDate = new Date().toLocaleDateString("es-MX");
  const resumen = buildResumen(rows);

  const granTotal = resumen.reduce((s, c) => s + c.total_recaudado, 0);
  const granPagos = resumen.reduce((s, c) => s + c.total_pagos, 0);
  const totalCuentahabientes = resumen.reduce(
    (s, c) => s + c.total_cuentahabientes,
    0,
  );

  const reportTitle = anio
    ? `Resumen general de calles — ${anio}`
    : "Resumen general de calles";

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Marca de agua */}
        <View style={styles.watermark} fixed>
          <Image src={WatermarkLogo} style={styles.watermarkImg} />
        </View>

        {/* Encabezado fijo */}
        <View style={styles.headerRow} fixed>
          <View style={styles.leftBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.brandText}>
              COMISIÓN DE AGUA{"\n"}GUADALUPE HIDALGO{"\n"}ACUAMANALA, TLAX.
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
              <Text style={styles.label}>Total de calles</Text>
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

        {/* Tarjetas globales */}
        {resumen.length > 0 && (
          <View style={styles.globalRow} wrap={false}>
            <View style={styles.globalCardPrimary}>
              <Text style={styles.globalLabel}>Gran total recaudado</Text>
              <Text style={styles.globalValuePrimary}>{money(granTotal)}</Text>
            </View>
            <View style={styles.globalCard}>
              <Text style={styles.globalLabel}>Total de cobros</Text>
              <Text style={styles.globalValueSecondary}>{granPagos}</Text>
            </View>
            <View style={styles.globalCard}>
              <Text style={styles.globalLabel}>Calles con actividad</Text>
              <Text style={styles.globalValueSecondary}>{resumen.length}</Text>
            </View>
          </View>
        )}

        {/* Contenido */}
        {resumen.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No existe información disponible para generar este reporte.
            </Text>
          </View>
        ) : (
          <>
            {resumen.map((calle, index) => (
              <View
                key={calle.nombre_calle}
                style={styles.calleSection}
                break={ONE_CALLE_PER_PAGE && index > 0}
                minPresenceAhead={CALLE_MIN_PRESENCE_AHEAD}
              >
                {/* Encabezado de la calle */}
                <View wrap={false}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderName}>
                      {calle.nombre_calle}
                    </Text>
                    <Text style={styles.sectionHeaderMeta}>
                      {calle.total_cuentahabientes} cuentahabientes •{" "}
                      {calle.total_pagos} pagos
                    </Text>
                  </View>

                  {/* Resumen numérico de la calle */}
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Total recaudado</Text>
                      <Text style={styles.summaryValueBlue}>
                        {money(calle.total_recaudado)}
                      </Text>
                    </View>
                    <View style={styles.summaryCell}>
                      <Text style={styles.summaryLabel}>Cuentahabientes</Text>
                      <Text style={styles.summaryValueGray}>
                        {calle.total_cuentahabientes}
                      </Text>
                    </View>
                    <View style={styles.summaryCellLast}>
                      <Text style={styles.summaryLabel}>Total cobros</Text>
                      <Text style={styles.summaryValueGray}>
                        {calle.total_pagos}
                      </Text>
                    </View>
                  </View>

                  {/* Título tabla */}
                  <View style={styles.detailTitleBox}>
                    <Text style={styles.detailTitle}>
                      Cuentahabientes y cobradores
                    </Text>
                  </View>

                  {/* Cabecera tabla */}
                  <View style={styles.tableHead}>
                    <Text style={styles.headName}>Cuentahabiente</Text>
                    <Text style={styles.headContrato}>Contrato</Text>
                    <Text style={styles.headCobrador}>Cobrador</Text>
                    <Text style={styles.headPagos}>Pagos</Text>
                    <Text style={styles.headTotal}>Total</Text>
                  </View>
                </View>

                {/* Filas de cuentahabientes */}
                <View style={styles.detailRowsBox}>
                  {calle.cuentahabientes.length === 0 ? (
                    <View style={styles.noDataRow}>
                      <Text style={styles.noDataText}>
                        No hay cuentahabientes registrados para esta calle.
                      </Text>
                    </View>
                  ) : (
                    calle.cuentahabientes.map((cuenta, rowIndex) => (
                      <View
                        key={`${calle.nombre_calle}-${cuenta.nombre}-${rowIndex}`}
                      >
                        {/* Fila principal del cuentahabiente (primera sub-fila = primer cobrador) */}
                        {cuenta.cobradores.length === 0 ? (
                          <View
                            style={
                              rowIndex % 2 === 0
                                ? styles.detailRow
                                : styles.detailRowAlt
                            }
                            wrap={false}
                          >
                            <Text style={styles.cellName}>{cuenta.nombre}</Text>
                            <Text style={styles.cellContrato}>
                              {cuenta.numero_contrato || "—"}
                            </Text>
                            <Text style={styles.cellCobrador}>—</Text>
                            <Text style={styles.cellPagos}>
                              {cuenta.total_pagos}
                            </Text>
                            <Text style={styles.cellTotal}>
                              {money(cuenta.total_recaudado)}
                            </Text>
                          </View>
                        ) : (
                          cuenta.cobradores.map((cobrador, ci) => (
                            <View
                              key={`${cuenta.nombre}-${cobrador.nombre_cobrador}-${ci}`}
                              style={
                                ci === 0
                                  ? rowIndex % 2 === 0
                                    ? styles.detailRow
                                    : styles.detailRowAlt
                                  : styles.cobradorSubRow
                              }
                              wrap={false}
                            >
                              {/* Solo el primer cobrador muestra nombre y contrato del cuentahabiente */}
                              <Text style={styles.cellName}>
                                {ci === 0 ? cuenta.nombre : ""}
                              </Text>
                              <Text style={styles.cellContrato}>
                                {ci === 0
                                  ? String(cuenta.numero_contrato || "—")
                                  : ""}
                              </Text>
                              <Text style={styles.cellCobrador}>
                                {cobrador.nombre_cobrador}
                              </Text>
                              <Text style={styles.cellPagos}>
                                {cobrador.total_pagos}
                              </Text>
                              <Text style={styles.cellTotal}>
                                {money(cobrador.total_recaudado)}
                              </Text>
                            </View>
                          ))
                        )}
                      </View>
                    ))
                  )}
                </View>
              </View>
            ))}

            {/* Gran total */}
            <View style={styles.grandTotalBox} wrap={false}>
              <View style={styles.grandTotalLeft}>
                <Text style={styles.grandTotalTitle}>Gran total recaudado</Text>
                <Text style={styles.grandTotalSub}>
                  {resumen.length} calles • {totalCuentahabientes}{" "}
                  cuentahabientes • {granPagos} pagos registrados
                </Text>
              </View>
              <Text style={styles.grandTotalValue}>{money(granTotal)}</Text>
            </View>
          </>
        )}

        {/* Pie de página fijo */}
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
