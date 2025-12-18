import React from "react";
import "../../styles/styles.css";
import { X } from "lucide-react";
import DownloadButton from "../forms/ticketbutton";

export interface TicketData {
  nombre_completo: string;
  numero_contrato: number;
  fecha_pago: string;
  monto_recibido: number | string;
  nombre_descuento: string;
  porcentaje_descuento?: number;
  comentarios: string;
}

export interface TicketPagoProps {
  ticketData: TicketData;
  onClose: () => void;
  logoUrl?: string;
}

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

const TicketPago: React.FC<TicketPagoProps> = ({
  ticketData,
  onClose,
  logoUrl,
}) => {
  const montoOriginal = Number(ticketData.monto_recibido);
  const montoDescuento = Number(ticketData.porcentaje_descuento) || 0;
  const montoFinal = montoOriginal - montoDescuento;
  const tieneDescuento = montoDescuento > 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1a1d24",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            backgroundColor: "#2b2e35",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ccc",
            transition: "all 0.2s",
            zIndex: 10,
          }}
          onClick={onClose}
          aria-label="Cerrar ticket"
        >
          <X size={18} />
        </button>

        <div style={{ flexGrow: 1, overflowY: "auto" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #58b2ee 0%, #2F3B7E 100%)",
              padding: "1.5rem",
              textAlign: "center",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
            }}
          >
            <div
              style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}
            >
              Ticket de Pago
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.85)",
                marginTop: "0.25rem",
              }}
            >
              Folio #{ticketData.numero_contrato}
            </div>
          </div>

          <div style={{ padding: "2rem 1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo SICAP"
                  style={{
                    maxWidth: "120px",
                    height: "auto",
                    filter: "drop-shadow(0 4px 12px rgba(88, 178, 238, 0.3))",
                  }}
                />
              ) : (
                <div style={{ fontSize: "3rem" }}>💧</div>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                backgroundColor: "#2b2e35",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                border: `2px solid ${tieneDescuento ? "#4ade80" : "#58b2ee"}`,
              }}
            >
              {tieneDescuento ? (
                <>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#999",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Monto Original
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      color: "#999",
                      textDecoration: "line-through",
                    }}
                  >
                    $
                    {montoOriginal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>

                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#4ade80",
                      marginTop: "1rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Descuento
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#4ade80",
                    }}
                  >
                    -$
                    {montoDescuento.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "1px",
                      backgroundColor: "#444",
                      margin: "1rem 0",
                    }}
                  />

                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#999",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Monto Final
                  </div>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: "#4ade80",
                    }}
                  >
                    $
                    {montoFinal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#999",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Monto Pagado
                  </div>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: "#58b2ee",
                    }}
                  >
                    $
                    {montoOriginal.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </>
              )}
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#999",
                  marginTop: "0.25rem",
                }}
              >
                MXN
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#999",
                    marginBottom: "0.25rem",
                  }}
                >
                  Cliente
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    color: "#e0e0e0",
                    fontWeight: 500,
                  }}
                >
                  {ticketData.nombre_completo}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#999",
                    marginBottom: "0.25rem",
                  }}
                >
                  Fecha de Pago
                </div>
                <div style={{ fontSize: "1rem", color: "#e0e0e0" }}>
                  {formatFechaLarga(ticketData.fecha_pago)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#999",
                    marginBottom: "0.25rem",
                  }}
                >
                  Descuento Aplicado
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    color: tieneDescuento ? "#4ade80" : "#e0e0e0",
                    fontWeight: tieneDescuento ? 600 : 400,
                  }}
                >
                  {ticketData.nombre_descuento}
                </div>
              </div>

              {ticketData.comentarios &&
                ticketData.comentarios.trim() !== "" && (
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#999",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Comentarios
                    </div>
                    <div
                      style={{
                        backgroundColor: "#252831",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        color: "#e0e0e0",
                        lineHeight: "1.5",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      {ticketData.comentarios}
                    </div>
                  </div>
                )}
            </div>

            <div
              style={{
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #2a2a2a",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  color: "#58b2ee",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                ¡Gracias por su pago!
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#999",
                  marginBottom: "0.25rem",
                }}
              >
                Sistema de Captura de Pagos
              </div>
              <div style={{ fontSize: "0.75rem", color: "#666" }}>
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
        </div>

        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #2a2a2a",
            textAlign: "center",
          }}
        >
          <DownloadButton ticketData={ticketData} logoUrl={logoUrl} />
        </div>
      </div>
    </div>
  );
};

export default TicketPago;
