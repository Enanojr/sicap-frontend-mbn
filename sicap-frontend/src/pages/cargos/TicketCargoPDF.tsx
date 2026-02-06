import React from "react";
import { Page, View, Text, Document, StyleSheet, Image} from "@react-pdf/renderer";
import { type TicketData } from "./TicketCargo"; // Asegúrate de que el tipo coincida con tu definición actual

const styles = StyleSheet.create({
  page: { padding: 20, backgroundColor: "#FFFFFF" },
  header: { backgroundColor: "#2F3B7E", color: "white", padding: 10, textAlign: "center", marginBottom: 10 },
  logo: { width: 60, height: 60, marginBottom: 8, marginLeft: "auto", marginRight: "auto" },
  title: { fontSize: 14, fontWeight: 'bold', color: "#2F3B7E" },
  section: { marginBottom: 10 },
  label: { fontSize: 10, color: "#666" },
  value: { fontSize: 12, marginBottom: 5, fontWeight: "bold" },
  monto: { fontSize: 24, textAlign: "center", color: "#3B82F6", marginVertical: 10, border: "1pt solid #3B82F6", padding: 10 }
});

export const TicketPDF: React.FC<{ ticketData: TicketData; logoUrl?: string }> = ({ ticketData, logoUrl }) => (
  <Document>
    <Page size="A6" style={styles.page}>
      <View style={styles.header}>
        {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        <Text>Comprobante de Pago</Text>
        <Text style={{ fontSize: 8 }}>Contrato #{ticketData.numero_contrato}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.monto}>${Number(ticketData.monto_recibido).toFixed(2)}</Text>
        <Text style={styles.label}>CLIENTE</Text>
        <Text style={styles.value}>{ticketData.nombre_completo}</Text>
        <Text style={styles.label}>FECHA</Text>
        <Text style={styles.value}>{ticketData.fecha_pago}</Text>
        <Text style={styles.label}>NOTAS</Text>
        <Text style={styles.value}>{ticketData.comentarios}</Text>
      </View>
    </Page>
  </Document>
);