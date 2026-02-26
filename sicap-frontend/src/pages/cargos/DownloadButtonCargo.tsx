import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { TicketPDF } from "./TicketCargoPDF"; // Nombre del archivo del PDF
import { type TicketData } from "./TicketCargo"; // Asegúrate de que el tipo coincida con tu definición actual

interface DownloadButtonProps {
  ticketData: TicketData;
  logoUrl?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ ticketData, logoUrl }) => {
  const fileName = `Ticket_Pago_${ticketData.numero_contrato}.pdf`;

  return (
    <PDFDownloadLink
      document={<TicketPDF ticketData={ticketData} logoUrl={logoUrl} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          style={{
            padding: "10px",
            backgroundColor: loading ? "#2b2e35" : "#58b2ee",
            color: "white",
            border: "none",
            borderRadius: "8px",
            width: "100%",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer"
          }}
          disabled={loading}
        >
          {loading ? "Generando..." : "Descargar Ticket PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default DownloadButton;