import React from "react";
import { Download, X } from "lucide-react";
import "../../styles/styles.css";

// Interface para el ticket
export interface TicketData {
  nombre_completo: string;
  numero_contrato: number;
  fecha_pago: string;
  monto_recibido: number | string;
  nombre_descuento: string;
  comentarios: string;
}

interface TicketPagoProps {
  ticketData: TicketData;
  onClose: () => void;
  logoUrl?: string;
}

const TicketPago: React.FC<TicketPagoProps> = ({
  ticketData,
  onClose,
  logoUrl,
}) => {
  const handleDownloadTicket = () => {
    const ticketContent = `


  ${ticketData.numero_contrato}
  
${ticketData.nombre_completo}
  


  ${Number(ticketData.monto_recibido).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 

  
   ${new Date(ticketData.fecha_pago).toLocaleDateString("es-MX", {
     day: "2-digit",
     month: "long",
     year: "numeric",
   })}
  
   ${ticketData.nombre_descuento || "Sin descuento"}
  
  ${ticketData.comentarios ? `Comentarios:\n  ${ticketData.comentarios}` : ""}
  

  

  
 
  ${new Date().toLocaleString("es-MX")}
  

    `.trim();

    const blob = new Blob([ticketContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket_pago_${
      ticketData.numero_contrato
    }_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-container" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button
          className="ticket-close-button"
          onClick={onClose}
          aria-label="Cerrar ticket"
        >
          <X size={18} />
        </button>

        {/* Header decorativo */}
        <div className="ticket-header">
          <div className="ticket-header-title">Ticket de Pago</div>
          <div className="ticket-header-folio">
            Folio #{ticketData.numero_contrato}
          </div>
        </div>

        {/* Cuerpo del ticket */}
        <div className="ticket-body">
          {/* Logo del agua */}
          <div className="ticket-logo-container">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo SICAP" className="ticket-logo" />
            ) : (
              <div className="ticket-logo-placeholder">💧</div>
            )}
          </div>

          {/* Monto principal - destacado */}
          <div className="ticket-amount-section">
            <div className="ticket-amount-label">Monto Pagado</div>
            <div className="ticket-amount-value">
              $
              {Number(ticketData.monto_recibido).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="ticket-amount-currency">MXN</div>
          </div>

          {/* Información detallada */}
          <div className="ticket-details">
            {/* Cliente */}
            <div className="ticket-detail-item">
              <div className="ticket-detail-label">Cliente</div>
              <div className="ticket-detail-value">
                {ticketData.nombre_completo}
              </div>
            </div>

            {/* Fecha de pago */}
            <div className="ticket-detail-item">
              <div className="ticket-detail-label">Fecha de Pago</div>
              <div className="ticket-detail-value">
                {new Date(ticketData.fecha_pago).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Descuento aplicado */}
            <div className="ticket-detail-item">
              <div className="ticket-detail-label">Descuento Aplicado</div>
              <div
                className={`ticket-detail-value ${
                  ticketData.nombre_descuento !== "Sin descuento"
                    ? "highlight"
                    : "no-discount"
                }`}
              >
                {ticketData.nombre_descuento}
              </div>
            </div>

            {/* Comentarios (solo si existen) */}
            {ticketData.comentarios && ticketData.comentarios.trim() !== "" && (
              <div className="ticket-detail-item ticket-comments-container">
                <div className="ticket-detail-label">Comentarios</div>
                <div className="ticket-comments-box">
                  {ticketData.comentarios}
                </div>
              </div>
            )}
          </div>

          {/* Pie del ticket */}
          <div className="ticket-footer">
            <div className="ticket-footer-thanks">¡Gracias por su pago!</div>
            <div className="ticket-footer-system">
              Sistema de Captura de Pagos - SICAP
            </div>
            <div className="ticket-footer-timestamp">
              Emitido:{" "}
              {new Date().toLocaleString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Botón de descarga */}
        <div className="ticket-download-section">
          <button
            className="ticket-download-button"
            onClick={handleDownloadTicket}
            aria-label="Descargar ticket"
          >
            <Download size={18} />
            Descargar Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketPago;
