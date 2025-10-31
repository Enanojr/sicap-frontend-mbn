import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { FormConfig } from "../forms/form";
import FormularioReutilizable from "../forms/form";
import {
  DollarSign,
  Calendar,
  User,
  Percent,
  MessageSquare,
} from "lucide-react";
import Swal from "sweetalert2";
import { createPago, type PagoCreate } from "../../services/pago.service";
import api from "../../api_axios";
import TicketPago, { type TicketData } from "../forms/ticket";
import Logo from "../../assets/Logo.png";

interface Cuentahabiente {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cuentahabiente[];
}

interface Descuento {
  id_descuento: number;
  nombre_descuento: string;
  porcentaje?: number;
}

interface PaginatedDescuentosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Descuento[];
}

const FormularioPagos: React.FC = () => {
  const navigate = useNavigate();
  const [cuentahabientes, setCuentahabientes] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [descuentos, setDescuentos] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  const [cuentahabientesMap, setCuentahabientesMap] = useState<
    Map<number, Cuentahabiente>
  >(new Map());
  const [descuentosMap, setDescuentosMap] = useState<Map<number, Descuento>>(
    new Map()
  );

  useEffect(() => {
    const fetchCuentahabientes = async (): Promise<void> => {
      try {
        setLoading(true);

        const token = localStorage.getItem("access");
        if (!token) {
          Swal.fire({
            icon: "error",
            title: "Sesión expirada",
            text: "Por favor, inicia sesión nuevamente.",
            confirmButtonColor: "#ef4444",
          });
          return;
        }

        console.log("Cargando cuentahabientes...");

        const allCuentahabientes: Cuentahabiente[] = [];
        let nextUrl: string | null = "/cuentahabientes/";
        let pageCount: number = 0;

        while (nextUrl) {
          pageCount++;
          const response = await api.get<PaginatedResponse>(nextUrl);
          const data: PaginatedResponse = response.data;

          if (data.results && Array.isArray(data.results)) {
            allCuentahabientes.push(...data.results);
            nextUrl = data.next
              ? data.next.replace("https://sicap-backend.onrender.com", "")
              : null;
          } else {
            break;
          }
        }

        const map = new Map<number, Cuentahabiente>();
        allCuentahabientes.forEach((cuenta) => {
          map.set(cuenta.id_cuentahabiente, cuenta);
        });
        setCuentahabientesMap(map);

        const formattedData = allCuentahabientes.map((cuenta) => ({
          value: cuenta.id_cuentahabiente.toString(),
          label:
            `#${cuenta.numero_contrato} - ${cuenta.nombres} ${cuenta.ap} ${cuenta.am}`.trim(),
        }));

        setCuentahabientes(formattedData);
      } catch (error: any) {
        console.error("Error al cargar cuentahabientes:", error);

        const message =
          error.response?.status === 403
            ? "Acceso prohibido. Tu sesión puede haber expirado."
            : error.response?.status === 401
            ? "No autorizado. Por favor, inicia sesión nuevamente."
            : "No se pudieron cargar los cuentahabientes";

        Swal.fire({
          icon: "error",
          title: "Error",
          text: message,
          confirmButtonColor: "#ef4444",
        });

        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("access");
          localStorage.removeItem("usuario");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchDescuentos = async (): Promise<void> => {
      try {
        const allDescuentos: Descuento[] = [];
        let nextUrl: string | null = "/descuentos/";

        while (nextUrl) {
          const response = await api.get<PaginatedDescuentosResponse>(nextUrl);
          const data: PaginatedDescuentosResponse = response.data;

          if (data.results && Array.isArray(data.results)) {
            allDescuentos.push(...data.results);
            nextUrl = data.next
              ? data.next.replace("https://sicap-backend.onrender.com", "")
              : null;
          } else {
            break;
          }
        }

        const map = new Map<number, Descuento>();
        allDescuentos.forEach((desc) => {
          map.set(desc.id_descuento, desc);
        });
        setDescuentosMap(map);

        const formattedData = allDescuentos.map((desc) => ({
          value: desc.id_descuento.toString(),
          label: desc.nombre_descuento,
        }));

        setDescuentos(formattedData);
      } catch (error: any) {
        console.error("Error al cargar descuentos:", error);

        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "No se pudieron cargar los descuentos.",
          confirmButtonColor: "#f59e0b",
        });
      }
    };

    fetchCuentahabientes();
    fetchDescuentos();
  }, []);

  const meses = [
    { value: "Enero", label: "Enero" },
    { value: "Febrero", label: "Febrero" },
    { value: "Marzo", label: "Marzo" },
    { value: "Abril", label: "Abril" },
    { value: "Mayo", label: "Mayo" },
    { value: "Junio", label: "Junio" },
    { value: "Julio", label: "Julio" },
    { value: "Agosto", label: "Agosto" },
    { value: "Septiembre", label: "Septiembre" },
    { value: "Octubre", label: "Octubre" },
    { value: "Noviembre", label: "Noviembre" },
    { value: "Diciembre", label: "Diciembre" },
  ];

  const validatePositiveNumber = (value: any): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "Debe ser un número mayor a 0";
    }
    return null;
  };

  const validateYear = (value: any): string | null => {
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > currentYear + 10) {
      return `Debe ser un año entre 2000 y ${currentYear + 10}`;
    }
    return null;
  };

  const formConfig: FormConfig = {
    title: "Registro de Pagos",
    fields: [
      {
        name: "cuentahabiente",
        label: "Cuenta Habiente",
        type: "select",
        icon: User,
        required: true,
        options: cuentahabientes,
        placeholder: loading ? "Cargando..." : "Selecciona un cuentahabiente",
      },
      {
        name: "fecha_pago",
        label: "Fecha de Pago",
        type: "date",
        icon: Calendar,
        required: true,
        defaultValue: new Date().toISOString().split("T")[0],
      },
      {
        name: "monto_recibido",
        label: "Monto Recibido",
        type: "number",
        placeholder: "0.00",
        icon: DollarSign,
        required: true,
        validation: validatePositiveNumber,
      },
      {
        name: "descuento",
        label: "Descuento (Opcional)",
        type: "select",
        icon: Percent,
        required: false,
        options: descuentos,
        placeholder: "Sin descuento",
      },
      {
        name: "mes",
        label: "Mes",
        type: "select",
        icon: Calendar,
        required: true,
        options: meses,
        defaultValue: meses[new Date().getMonth()].value,
      },
      {
        name: "anio",
        label: "Año",
        type: "number",
        placeholder: "Ej: 2024",
        icon: Calendar,
        required: true,
        defaultValue: new Date().getFullYear().toString(),
        validation: validateYear,
      },
      {
        name: "comentarios",
        label: "Comentarios",
        type: "textarea",
        placeholder: "Observaciones o comentarios adicionales (opcional)",
        icon: MessageSquare,
        required: false,
        defaultValue: "",
      },
    ],

    onSubmit: async (data) => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          Swal.fire({
            icon: "error",
            title: "Sesión expirada",
            text: "Por favor, inicia sesión nuevamente.",
            confirmButtonColor: "#ef4444",
          });
          return;
        }

        Swal.fire({
          title: "Enviando...",
          text: "Registrando el pago, por favor espera.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const pagoData: PagoCreate = {
          cuentahabiente: parseInt(data.cuentahabiente),
          fecha_pago: data.fecha_pago,
          monto_recibido: parseFloat(data.monto_recibido),
          mes: data.mes,
          anio: parseInt(data.anio),
          comentarios: data.comentarios || "",
          ...(data.descuento &&
            data.descuento !== "" && { descuento: parseInt(data.descuento) }),
        };

        const result = await createPago(pagoData);

        Swal.close();

        const cuentahabiente = cuentahabientesMap.get(
          parseInt(data.cuentahabiente)
        );
        const descuento =
          data.descuento && data.descuento !== ""
            ? descuentosMap.get(parseInt(data.descuento))
            : null;

        if (cuentahabiente) {
          const ticket: TicketData = {
            nombre_completo:
              `${cuentahabiente.nombres} ${cuentahabiente.ap} ${cuentahabiente.am}`.trim(),
            numero_contrato: cuentahabiente.numero_contrato,
            fecha_pago: data.fecha_pago,
            monto_recibido: data.monto_recibido,
            nombre_descuento: descuento?.nombre_descuento || "Sin descuento",
            comentarios: data.comentarios || "",
          };

          setTicketData(ticket);
          setShowTicket(true);
        }

        console.log("Pago registrado:", result);
      } catch (error: any) {
        console.error(" Error al registrar el pago:", error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          const message =
            error.response?.status === 403
              ? "Acceso prohibido. Tu sesión puede haber expirado."
              : "No autorizado. Por favor, inicia sesión nuevamente.";

          Swal.fire({
            icon: "error",
            title: "Error de autenticación",
            text: message,
            confirmButtonColor: "#ef4444",
          });

          localStorage.removeItem("access");
          localStorage.removeItem("usuario");
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al registrar el pago",
            text:
              error.message || "Ocurrió un problema al procesar la solicitud.",
            confirmButtonColor: "#ef4444",
          });
        }

        throw error;
      }
    },

    submitButtonText: "Registrar Pago",
    resetButtonText: "Limpiar Formulario",
    successMessage: "¡Pago registrado exitosamente!",
    errorMessage: "Error al registrar el pago. Intente nuevamente.",
    showResetButton: true,
  };

  if (loading) {
    return <div className="text-center p-4">Cargando formulario...</div>;
  }

  return (
    <>
      <FormularioReutilizable config={formConfig} />

      {showTicket && ticketData && (
        <TicketPago
          ticketData={ticketData}
          onClose={() => {
            setShowTicket(false);
            navigate("/Tabla");
          }}
          logoUrl={Logo}
        />
      )}
    </>
  );
};

export default FormularioPagos;
