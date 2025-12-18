import React from "react";
import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { type TicketData } from "../forms/ticket";

const styles = StyleSheet.create({
  page: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  container: {
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 6,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
    backgroundColor: "#2F3B7E",
    color: "white",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  folio: {
    fontSize: 8,
    color: "rgba(255,255,255,0.8)",
  },
  body: {
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: 8,
    marginTop: 5,
  },
  logo: {
    maxWidth: 60,
    height: "auto",

    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
  },
  montoBox: {
    textAlign: "center",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 2,
  },
  montoOriginal: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  montoOriginalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    textDecoration: "line-through",
    marginBottom: 2,
  },
  descuentoLabel: {
    fontSize: 8,
    color: "#10B981",
    marginTop: 6,
    marginBottom: 2,
  },
  descuentoValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#cccccc",
    marginVertical: 6,
  },
  montoFinalLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  montoFinalValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  montoSimpleLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  montoSimpleValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  currency: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  detailSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 7,
    color: "#666",
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 9,
    color: "#333333",
    fontWeight: "medium",
  },
  commentBox: {
    backgroundColor: "#EEEEEE",
    padding: 5,
    borderRadius: 3,
    fontSize: 8,
    color: "#333333",
    lineHeight: 1.2,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    textAlign: "center",
  },
  thanks: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "bold",
    marginBottom: 2,
  },
  systemInfo: {
    fontSize: 8,
    color: "#666",
    marginBottom: 1,
  },
  emittedDate: {
    fontSize: 7,
    color: "#999",
  },
});

const formatFechaLarga = (fechaString: string): string => {
  if (!fechaString) return "—";
  const fechaLimpia = fechaString.includes("T")
    ? fechaString.split("T")[0]
    : fechaString;
  const [year, month, day] = fechaLimpia.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

interface TicketPDFProps {
  ticketData: TicketData;
  logoUrl?: string;
}

export const TicketPDF: React.FC<TicketPDFProps> = ({
  ticketData,
  logoUrl,
}) => {
  const montoOriginal = Number(ticketData.monto_recibido);
  const montoDescuento = Number(ticketData.porcentaje_descuento) || 0;
  const montoFinal = montoOriginal - montoDescuento;
  const tieneDescuento = montoDescuento > 0;

  const montoBoxStyle = {
    ...styles.montoBox,
    borderColor: tieneDescuento ? "#10B981" : "#3B82F6",
  };

  const montoFinalColor = {
    color: tieneDescuento ? "#10B981" : "#3B82F6",
  };

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ticket de Pago</Text>
            <Text style={styles.folio}>
              Folio #{ticketData.numero_contrato}
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.logoContainer}>
              {logoUrl ? (
                <Image src={logoUrl} style={styles.logo} />
              ) : (
                <Text
                  style={{
                    fontSize: 25,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  💧
                </Text>
              )}
            </View>

            <View style={montoBoxStyle}>
              {tieneDescuento ? (
                <>
                  <Text style={styles.montoOriginal}>Monto Original</Text>
                  <Text style={styles.montoOriginalValue}>
                    $
                    {montoOriginal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>

                  <Text style={styles.descuentoLabel}>Descuento</Text>
                  <Text style={styles.descuentoValue}>
                    -$
                    {montoDescuento.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>

                  <View style={styles.divider} />

                  <Text style={styles.montoFinalLabel}>Monto Final</Text>
                  <Text
                    style={{ ...styles.montoFinalValue, ...montoFinalColor }}
                  >
                    $
                    {montoFinal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.montoSimpleLabel}>Monto Pagado</Text>
                  <Text style={styles.montoSimpleValue}>
                    $
                    {montoOriginal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </>
              )}
              <Text style={styles.currency}>MXN</Text>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cliente</Text>
                <Text style={styles.detailValue}>
                  {ticketData.nombre_completo}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Fecha de Pago</Text>
                <Text style={styles.detailValue}>
                  {formatFechaLarga(ticketData.fecha_pago)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Descuento Aplicado</Text>
                <Text
                  style={{
                    ...styles.detailValue,
                    color: tieneDescuento ? "#10B981" : "#333333",
                    fontWeight: tieneDescuento ? "bold" : "normal",
                  }}
                >
                  {ticketData.nombre_descuento}
                </Text>
              </View>

              {ticketData.comentarios &&
                ticketData.comentarios.trim() !== "" && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Comentarios</Text>
                    <Text style={styles.commentBox}>
                      {ticketData.comentarios}
                    </Text>
                  </View>
                )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.thanks}>¡Gracias por su pago!</Text>
              <Text style={styles.emittedDate}>
                Emitido:{" "}
                {new Date().toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
