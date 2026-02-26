import React from "react";
import { X } from "lucide-react";
import DownloadButton from "./DownloadButtonCargo"; // Asegúrate de que el nombre coincida

export interface TicketData {
  nombre_completo: string;
  numero_contrato: number;
  fecha_pago: string;
  monto_recibido: number | string;
  nombre_descuento: string;
  porcentaje_descuento?: number;
  comentarios: string;
}

interface TicketPagoProps {
  ticketData: TicketData;
  onClose: () => void;
  logoUrl?: string;
}

const formatFechaLarga = (fechaString: string): string => {
  if (!fechaString) return "—";
  const fechaLimpia = fechaString.includes("T") ? fechaString.split("T")[0] : fechaString;
  const [year, month, day] = fechaLimpia.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
};

const TicketPago: React.FC<TicketPagoProps> = ({ ticketData, onClose, logoUrl }) => {
  const montoOriginal = Number(ticketData.monto_recibido);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}><X size={18} /></button>

        <div style={{ padding: "1.5rem" }}>
          {/* Si quieres ver el logo en el modal, puedes añadirlo aquí: */}
          {logoUrl && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img src={logoUrl} alt="Logo" style={{ maxHeight: '50px' }} />
            </div>
          )}
        
        <div style={headerStyle}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>Ticket de Pago</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>Folio #{ticketData.numero_contrato}</div>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <div style={montoBoxStyle}>
            <div style={{ fontSize: "0.85rem", color: "#999" }}>Monto Pagado</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#58b2ee" }}>
              ${montoOriginal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#999" }}>MXN</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <DetailItem label="Cliente" value={ticketData.nombre_completo} />
            <DetailItem label="Fecha de Pago" value={formatFechaLarga(ticketData.fecha_pago)} />
            <DetailItem label="Concepto" value={ticketData.comentarios} />
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <DownloadButton ticketData={ticketData} logoUrl={logoUrl} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.25rem" }}>{label}</div>
    <div style={{ color: "#e0e0e0", fontWeight: 500 }}>{value}</div>
  </div>
);

// Estilos
const overlayStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalStyle: React.CSSProperties = { backgroundColor: "#1a1d24", borderRadius: "12px", width: "90%", maxWidth: "420px", position: "relative", overflow: "hidden" };
const headerStyle: React.CSSProperties = { background: "linear-gradient(135deg, #58b2ee 0%, #2F3B7E 100%)", padding: "1.5rem", textAlign: "center" };
const montoBoxStyle: React.CSSProperties = { textAlign: "center", backgroundColor: "#2b2e35", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", border: "2px solid #58b2ee" };
const closeButtonStyle: React.CSSProperties = { position: "absolute", top: "1rem", right: "1rem", background: "#2b2e35", border: "none", borderRadius: "50%", color: "white", cursor: "pointer", padding: "5px", zIndex: 10 };

export default TicketPago;