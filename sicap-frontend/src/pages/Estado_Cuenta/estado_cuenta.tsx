import { useState } from "react";
import { Download } from "lucide-react";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";

import "../../styles/styles.css";

import {
  ReusableTable,
  type Column,
} from "../../components/tablas/registros_general"; // ajusta la ruta si aplica
import { getCuentahabientes } from "../../services/Rcuentahabientes.service";
import { getEstadosById } from "../../services/Estado_cuenta.service";
import EstadoCuentaPDF from "../../pages/Estado_Cuenta/EstadoCuentaPDF";

type Row = {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
};

export default function EstadoCuentaPage() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchAllCuentahabientes = async (): Promise<Row[]> => {
    let url: string | null = "/cuentahabientes/";
    let all: Row[] = [];

    while (url) {
      const resp = await getCuentahabientes(url);
      if (!resp?.success || !resp?.data) break;

      const pageItems = resp.data.results ?? resp.data;

      const rows: Row[] = (pageItems || []).map((r: any) => ({
        id_cuentahabiente: r.id_cuentahabiente,
        numero_contrato: r.numero_contrato,
        nombres: r.nombres,
        ap: r.ap ?? "",
        am: r.am ?? "",
      }));

      all = [...all, ...rows];
      url = resp.data.next;
    }

    return all;
  };

  const handleDownloadPDF = async (id_cuentahabiente: number) => {
    try {
      setDownloadingId(id_cuentahabiente);

      Swal.fire({
        title: "Generando Estado de Cuenta...",
        text: "Un momento.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const rows = await getEstadosById(id_cuentahabiente);

      if (!rows || rows.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontró historial para este cuentahabiente.",
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
        historico: rows.map((r: any) => ({
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
      setDownloadingId(null);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "nombres",
      label: "Cuentahabiente",
      render: (_, row) =>
        `${row.nombres} ${row.ap ?? ""} ${row.am ?? ""}`.trim(),
    },
    {
      key: "numero_contrato",
      label: "Contrato",
    },

    // 👇 Columna extra para el botón (sin tocar tu ReusableTable)
    {
      key: "id_cuentahabiente" as any,
      label: "Estado de cuenta",
      render: (_, row) => (
        <button
          type="button"
          className="estado-download-btn"
          onClick={() => handleDownloadPDF(row.id_cuentahabiente)}
          disabled={downloadingId === row.id_cuentahabiente}
          title="Descargar estado de cuenta"
          style={{ whiteSpace: "nowrap" }}
        >
          <Download size={16} />
          {downloadingId === row.id_cuentahabiente
            ? "Generando..."
            : "Descargar PDF"}
        </button>
      ),
    },
  ];

  return (
    <div className="table-with-action">
      <ReusableTable<Row>
        columns={columns}
        fetchData={fetchAllCuentahabientes}
        searchableFields={["nombres", "ap", "am", "numero_contrato"]}
        itemsPerPage={10}
        title="Estado de Cuenta"
        showActions={false} // ya no usamos Editar/acciones default
      />
    </div>
  );
}
