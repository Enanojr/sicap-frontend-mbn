import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { type TicketData } from "../forms/ticket";
import { TicketPDF } from "../forms/ticket_pdf";

interface DownloadButtonProps {
  ticketData: TicketData;
  logoUrl?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  ticketData,
  logoUrl,
}) => {
  const fileName = `Ticket_Pago_${ticketData.numero_contrato}_${new Date()
    .toLocaleDateString("es-MX")
    .replace(/\//g, "-")}.pdf`;

  return (
    <PDFDownloadLink
      document={<TicketPDF ticketData={ticketData} logoUrl={logoUrl} />}
      fileName={fileName}
    >
      {({ loading }) =>
        loading ? (
          "Generando PDF..."
        ) : (
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: loading ? "#2F3B7E" : "#58b2ee",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              width: "100%",
              transition: "background-color 0.2s, opacity 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Generando PDF..." : "Descargar Ticket PDF"}
          </button>
        )
      }
    </PDFDownloadLink>
  );
};

export default DownloadButton;
