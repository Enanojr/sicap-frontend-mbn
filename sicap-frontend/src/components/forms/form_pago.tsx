import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { createPago } from "../../services/pago.service";
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
  porcentaje?: string;
}

interface PaginatedDescuentosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Descuento[];
}

const FormularioPagos: React.FC = () => {
  const navigate = useNavigate();

  const [filteredOptions, setFilteredOptions] = useState<
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
    new Map(),
  );

  // Referencia para manejar el temporizador del debounce
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchCuentahabientes = async () => {
      try {
        setLoading(true);

        // Cargar únicamente la primera página para mostrar opciones iniciales
        const response = await api.get<PaginatedResponse>("/cuentahabientes/");
        const data = response.data.results;

        // Guardar en el mapa para tener los datos completos al crear el ticket
        const map = new Map<number, Cuentahabiente>();
        data.forEach((c) => map.set(c.id_cuentahabiente, c));
        setCuentahabientesMap(map);

        const initial = data.map((c) => ({
          value: c.id_cuentahabiente.toString(),
          label: `#${c.numero_contrato} - ${c.nombres} ${c.ap} ${c.am}`.trim(),
        }));

        setFilteredOptions(initial);
      } catch (error) {
        Swal.fire(
          "Error",
          "No se pudieron cargar los cuentahabientes iniciales",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchDescuentos = async () => {
      try {
        const all: Descuento[] = [];
        let nextUrl: string | null = "/descuentos/";

        // Para catálogos pequeños como descuentos, el while es aceptable.
        // Si crece mucho, aplicar la misma técnica asíncrona que en cuentahabientes.
        while (nextUrl) {
          const response = await api.get<PaginatedDescuentosResponse>(nextUrl);
          const data: PaginatedDescuentosResponse = response.data;

          all.push(...data.results);

          nextUrl = data.next
            ? data.next.replace("https://sicap-backend.onrender.com", "")
            : null;
        }
        const activos = all.filter((d) => (d as any).activo === true);

        const map = new Map<number, Descuento>();
        activos.forEach((d) => map.set(d.id_descuento, d));
        setDescuentosMap(map);

        setDescuentos(
          activos.map((d) => ({
            value: d.id_descuento.toString(),
            label: d.nombre_descuento,
          })),
        );
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los descuentos", "error");
      }
    };

    fetchCuentahabientes();
    fetchDescuentos();
  }, []);

  const handleSearchCuentahabiente = useCallback((searchTerm: string) => {
    // Limpiar el temporizador anterior si el usuario sigue tecleando
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!searchTerm.trim()) {
      return;
    }

    // Configurar un nuevo temporizador (Debounce de 500ms)
    searchTimeout.current = setTimeout(async () => {
      try {
        // Enviar la búsqueda al backend
        // Nota: Asegurar que Django esté configurado para aceptar '?search='
        const response = await api.get<PaginatedResponse>(
          `/cuentahabientes/?search=${encodeURIComponent(searchTerm)}`
        );
        
        const resultados = response.data.results;

        // Actualizar el mapa con los nuevos resultados para no perder su información
        setCuentahabientesMap((prevMap) => {
          const nuevoMapa = new Map(prevMap);
          resultados.forEach((c) => nuevoMapa.set(c.id_cuentahabiente, c));
          return nuevoMapa;
        });

        const opcionesFiltradas = resultados.map((c) => ({
          value: c.id_cuentahabiente.toString(),
          label: `#${c.numero_contrato} - ${c.nombres} ${c.ap} ${c.am}`.trim(),
        }));

        setFilteredOptions(opcionesFiltradas);
      } catch (error) {
        console.error("Error al buscar en el servidor:", error);
      }
    }, 500); // Esperar medio segundo antes de disparar la petición
  }, []);

  const validatePositiveNumber = useCallback(
    (value: string | number): string | null => {
      const num = parseFloat(value.toString());
      if (isNaN(num) || num <= 0) return "Debe ser un número mayor a 0";
      return null;
    },
    [],
  );

  const validateYear = useCallback((value: string | number): string | null => {
    const y = parseInt(value.toString());
    const current = new Date().getFullYear();
    if (isNaN(y) || y < 2000 || y > current + 10)
      return `Debe ser un año entre 2000 y ${current + 10}`;
    return null;
  }, []);

  const meses = useMemo(
    () =>
      [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ].map((m) => ({ value: m, label: m })),
    [],
  );

  const handleSubmit = useCallback(
    async (data: Record<string, any>) => {
      try {
        const montoOriginal = parseFloat(data.monto_recibido);
        let montoFinal = montoOriginal;

        const descuento =
          data.descuento && data.descuento !== ""
            ? descuentosMap.get(parseInt(data.descuento))
            : null;

        let cantidadDescuento = 0;

        if (descuento?.porcentaje) {
          cantidadDescuento = parseFloat(descuento.porcentaje);
          montoFinal = montoOriginal - cantidadDescuento;

          const confirm = await Swal.fire({
            title: "Confirmar descuento",
            html: `
              <p><b>Monto original:</b> $${montoOriginal}</p>
              <p><b>Descuento:</b> -$${cantidadDescuento}</p>
              <p><b>Total final:</b> $${montoFinal}</p>
            `,
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#3b82f6",
            cancelButtonColor: "#ef4444",
          });

          if (!confirm.isConfirmed) return;
        }

        Swal.fire({
          title: "Registrando pago...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await createPago({
          cuentahabiente: parseInt(data.cuentahabiente),
          fecha_pago: data.fecha_pago,
          monto_recibido: montoOriginal,
          mes: data.mes,
          anio: parseInt(data.anio),
          comentarios: data.comentarios || "",
          ...(data.descuento &&
            data.descuento !== "" && { descuento: parseInt(data.descuento) }),
        });

        Swal.close();

        // Recuperar los datos del mapa para imprimir el ticket
        const c = cuentahabientesMap.get(parseInt(data.cuentahabiente));
        if (c) {
          setTicketData({
            nombre_completo: `${c.nombres} ${c.ap} ${c.am}`,
            numero_contrato: c.numero_contrato,
            fecha_pago: data.fecha_pago,
            monto_recibido: montoOriginal,
            nombre_descuento: descuento?.nombre_descuento || "Sin descuento",
            porcentaje_descuento: cantidadDescuento,
            comentarios: data.comentarios || "",
            periodo_mes: String(data.mes),
            periodo_anio: Number(data.anio),
          });

          setShowTicket(true);
        }
      } catch (error: any) {
        Swal.close();

        const status = error?.response?.status;
        const backendDetail =
          error?.response?.data?.detail || error?.response?.data?.message || "";

        if (status === 400) {
          await Swal.fire({
            icon: "warning",
            title: "Pago no permitido",
            html: `
        <div style="text-align:left; line-height:1.35">
          <p style="margin:0 0 .6rem 0">
            No es posible registrar el pago en este momento.
          </p>
          <p style="margin:0">
            El cuentahabiente debe <b>completar sus cargos pendientes</b> antes de poder realizar un pago.
          </p>
          ${
            backendDetail
              ? `<p style="margin:.75rem 0 0 0; color:#9ca3af; font-size:.85rem">
                   Detalle: ${backendDetail}
                 </p>`
              : ""
          }
        </div>
      `,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#58b2ee",
          });
          return;
        }

        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar el pago. Intente nuevamente.",
          confirmButtonColor: "#ef4444",
        });
      }
    },
    [cuentahabientesMap, descuentosMap],
  );

  const formConfig: FormConfig = useMemo(
    () => ({
      title: "Registro de Pagos",
      fields: [
        {
          name: "cuentahabiente",
          label: "Cuentahabiente",
          type: "search-select" as const,
          required: true,
          options: filteredOptions,
          icon: User,
          placeholder: loading
            ? "Cargando..."
            : "Escribe el nombre o número de contrato",
          onSearch: handleSearchCuentahabiente,
        },
        {
          name: "fecha_pago",
          label: "Fecha de Pago",
          type: "date" as const,
          icon: Calendar,
          required: true,
          defaultValue: new Date().toISOString().split("T")[0],
        },
        {
          name: "monto_recibido",
          label: "Cantidad por Pagar",
          type: "number" as const,
          placeholder: "0.00",
          icon: DollarSign,
          required: true,
          validation: validatePositiveNumber,
        },
        {
          name: "descuento",
          label: "Descuento (Opcional)",
          type: "select" as const,
          icon: Percent,
          options: descuentos,
        },
        {
          name: "mes",
          label: "Mes",
          type: "select" as const,
          icon: Calendar,
          required: true,
          options: meses,
          defaultValue: meses[new Date().getMonth()].value,
        },
        {
          name: "anio",
          label: "Año",
          type: "number" as const,
          placeholder: "Ej: 2024",
          icon: Calendar,
          required: true,
          defaultValue: new Date().getFullYear().toString(),
          validation: validateYear,
        },
        {
          name: "comentarios",
          label: "Comentarios",
          type: "textarea" as const,
          placeholder: "Observaciones (opcional)",
          icon: MessageSquare,
        },
      ],
      onSubmit: handleSubmit,
      submitButtonText: "Registrar Pago",
      resetButtonText: "Limpiar Formulario",
      showResetButton: true,
    }),
    [
      filteredOptions,
      descuentos,
      loading,
      handleSearchCuentahabiente,
      validatePositiveNumber,
      validateYear,
      meses,
      handleSubmit,
    ],
  );

  if (loading) {
    Swal.fire({
      title: "Cargando datos...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    return null;
  }

  Swal.close();

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