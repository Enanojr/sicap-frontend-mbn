import { useState } from "react";
import { UserSearch, Download, X } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import "../../styles/styles.css";
import { getEstadosById } from "../../services/Estado_cuenta.service";
import EstadoCuentaPDF from "../../pages/Estado_Cuenta/EstadoCuentaPDF";

export default function EstadoCuentaPage() {
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleClear = () => setInput("");

  const handleDownload = async () => {
    const id = Number(input);

    if (!input.trim() || Number.isNaN(id) || id <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Dato inválido",
        text: "Ingresa un ID numérico válido del cuentahabiente.",
      });
      return;
    }

    try {
      setLoading(true);

      Swal.fire({
        title: "Generando Estado de Cuenta...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const rows = await getEstadosById(id);

      if (!rows || rows.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontró historial para ese cuentahabiente.",
        });
        return;
      }

      const first = rows[0];

      const data = {
        numero_contrato: first.numero_contrato,
        nombre: first.nombre,
        direccion: first.direccion,
        telefono: first.telefono,
        estatus: first.deuda,
        saldo_pendiente: first.saldo_pendiente,
        historico: rows.map((r) => ({
          fecha_pago: r.fecha_pago,
          monto_recibido: Number(r.monto_recibido || 0),
          anio: r.anio,
        })),
      };

      const blob = await pdf(<EstadoCuentaPDF data={data} />).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EstadoCuenta_${data.numero_contrato}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.close();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "No fue posible generar el estado de cuenta.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contracts-page-container">
      <div className="contracts-card">
        <h2 className="contracts-title">
          <span className="contracts-title-gradient">Estado de Cuenta</span>
        </h2>
        <div className="contracts-divider"></div>

        <div className="estado-bar">
          <div className="estado-input-wrap">
            <UserSearch className="estado-icon" />
            <input
              className="estado-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ingresa ID del cuentahabiente..."
              inputMode="numeric"
            />

            {input && (
              <button
                type="button"
                className="estado-clear"
                onClick={handleClear}
                aria-label="Limpiar"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="estado-download-btn"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download size={18} />
            {loading ? "Generando..." : "Descargar PDF"}
          </button>
        </div>

        <div className="estado-hint">
          * Genera el Estado de Cuenta consultando el histórico del
          cuentahabiente por ID.
        </div>
      </div>
    </div>
  );
}
