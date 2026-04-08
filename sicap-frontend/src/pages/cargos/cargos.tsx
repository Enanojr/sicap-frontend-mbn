import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getCargos,
  registrarCargo,
  pagarCargo,
  getCargosByUser,
} from "../../services/cargos.service";
import type {
  CargoResponse,
  CargoData,
  PagoData,
} from "../../services/cargos.service";
import { getCuentahabientes } from "../../services/Rcuentahabientes.service";
import {
  getAllCargos,
  type CargoResponse as TipoCargoOp,
} from "../../services/tcargos.service";

import TicketPago, { type TicketData as TicketPagoData } from "./TicketCargo";
import SearchableSelect from "../../components/searchselect/searchselect";
import LogoApp from "../../assets/Logo.png";
import Swal from "sweetalert2";
import "../../styles/styles.css";

// ────────────────────────────────────────────────────────────
// Trae TODOS los cargos recorriendo la paginación.
// Cargos activos son muchos menos que cuentahabientes,
// así que las páginas son pocas y no satura el servidor.
// ────────────────────────────────────────────────────────────
const getTodosLosCargosActivos = async (): Promise<CargoResponse[]> => {
  const todos: CargoResponse[] = [];
  // Filtramos activos directo en el endpoint para reducir páginas
  let nextUrl: string | null = "/cargos/?activo=true";

  while (nextUrl) {
    const res = await getCargos(nextUrl);
    if (!res.success || !res.data) break;

    const pagina: CargoResponse[] = res.data.results || res.data;
    // Guardamos solo los que tienen saldo pendiente
    todos.push(...pagina.filter((c) => parseFloat(c.saldo_restante_cargo) > 0));

    nextUrl = res.data.next || null;
  }

  return todos;
};

// ────────────────────────────────────────────────────────────
// Hook: búsqueda lazy de cuentahabientes (Registrar Cargo)
// ────────────────────────────────────────────────────────────
const useCuentahabientesSearch = () => {
  const [opciones, setOpciones] = useState<
    { value: string | number; label: string; keywords: string }[]
  >([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<{
    value: string | number;
    label: string;
    keywords: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscar = useCallback((termino: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!termino.trim()) {
        setOpciones([]);
        return;
      }
      setBuscando(true);
      const res = await getCuentahabientes(
        `/cuentahabientes/?search=${encodeURIComponent(termino)}`
      );
      if (res.success && res.data) {
        setOpciones(
          res.data.results.map((u) => ({
            value: u.id_cuentahabiente,
            label: `#${u.numero_contrato} - ${u.nombres} ${u.ap} ${u.am}`,
            keywords: String(u.numero_contrato),
          }))
        );
      }
      setBuscando(false);
    }, 400);
  }, []);

  const marcarSeleccionado = (value: string | number) => {
    const encontrado = opciones.find((o) => String(o.value) === String(value));
    if (encontrado) setSeleccionado(encontrado);
  };

  const opcionesFinales = seleccionado
    ? [
        seleccionado,
        ...opciones.filter(
          (o) => String(o.value) !== String(seleccionado.value)
        ),
      ]
    : opciones;

  return { opcionesFinales, buscando, buscar, marcarSeleccionado, setSeleccionado };
};

// ────────────────────────────────────────────────────────────
// Hook: usuarios únicos con cargos activos (Realizar Pago)
// Recorre TODAS las páginas de cargos activos — sin llamadas
// extra por usuario, solo el endpoint de cargos.
// ────────────────────────────────────────────────────────────
const useUsuariosConCargosActivos = () => {
  const [opciones, setOpciones] = useState<
    { value: string | number; label: string; keywords: string }[]
  >([]);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);

    const todosLosCargos = await getTodosLosCargosActivos();

    // Deduplicar por cuentahabiente
    const mapa = new Map<
      number,
      { value: number; label: string; keywords: string }
    >();
    todosLosCargos.forEach((c) => {
      if (!mapa.has(c.cuentahabiente)) {
        mapa.set(c.cuentahabiente, {
          value: c.cuentahabiente,
          label: c.cuentahabiente_nombre,
          keywords: String(c.cuentahabiente),
        });
      }
    });

    setOpciones(Array.from(mapa.values()));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  return { opciones, cargando, refrescar: cargar };
};

// ────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────
const CargosManager = () => {
  const [listaCargos, setListaCargos] = useState<CargoResponse[]>([]);
  const [tiposDeCargo, setTiposDeCargo] = useState<TipoCargoOp[]>([]);

  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [totalCargos, setTotalCargos] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketPagoData | null>(null);

  const [cargosActivosUsuario, setCargosActivosUsuario] = useState<CargoResponse[]>([]);
  const [loadingCargosUsuario, setLoadingCargosUsuario] = useState(false);

  const {
    opcionesFinales: opcionesCargo,
    buscando: buscandoCargo,
    buscar: buscarCargo,
    marcarSeleccionado: marcarSeleccionadoCargo,
    setSeleccionado: resetSeleccionadoCargo,
  } = useCuentahabientesSearch();

  const {
    opciones: opcionesPago,
    cargando: cargandoPago,
    refrescar: refrescarOpcionesPago,
  } = useUsuariosConCargosActivos();

  const [formCargo, setFormCargo] = useState<CargoData>({
    cuentahabiente: "",
    tipo_cargo: "",
    monto_cargo: 0,
    fecha_cargo: new Date().toISOString().split("T")[0],
  });

  const [formPago, setFormPago] = useState<PagoData>({
    cuentahabiente_id: "",
    monto: 0,
  });

  const [errorsCargo, setErrorsCargo] = useState<any>({});
  const [errorsPago, setErrorsPago] = useState<any>({});

  useEffect(() => {
    getAllCargos().then(setTiposDeCargo);
    cargarTablaCargos();
  }, []);

  useEffect(() => {
    if (formCargo.tipo_cargo) {
      const sel = tiposDeCargo.find(
        (t) => String(t.id) === String(formCargo.tipo_cargo)
      );
      if (sel) setFormCargo((prev) => ({ ...prev, monto_cargo: sel.monto }));
    } else {
      setFormCargo((prev) => ({ ...prev, monto_cargo: 0 }));
    }
  }, [formCargo.tipo_cargo, tiposDeCargo]);

  useEffect(() => {
    const id = setTimeout(() => cargarTablaCargos(undefined, busquedaTabla), 500);
    return () => clearTimeout(id);
  }, [busquedaTabla]);

  useEffect(() => {
    const cargar = async () => {
      if (!formPago.cuentahabiente_id) {
        setCargosActivosUsuario([]);
        return;
      }
      setLoadingCargosUsuario(true);
      const cargos = await getCargosByUser(formPago.cuentahabiente_id);
      setCargosActivosUsuario(cargos);
      setLoadingCargosUsuario(false);
    };
    cargar();
  }, [formPago.cuentahabiente_id]);

  const cargarTablaCargos = async (url?: string, searchTerm?: string) => {
    const res = await getCargos(url, searchTerm);
    if (res.success && res.data) {
      const data = res.data.results || res.data;
      setListaCargos(Array.isArray(data) ? data : []);
      setNextPage(res.data.next || null);
      setPrevPage(res.data.previous || null);
      setTotalCargos(res.data.count || (Array.isArray(data) ? data.length : 0));
    }
  };

  const handleNext = () => nextPage && cargarTablaCargos(nextPage);
  const handlePrev = () => prevPage && cargarTablaCargos(prevPage);

  const handleSubmitCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorsCargo({});
    setLoading(true);
    try {
      const res = await registrarCargo(formCargo);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Cargo registrado",
          text: "El cargo se ha guardado correctamente.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#3b82f6",
        });
        setFormCargo({ ...formCargo, monto_cargo: 0, tipo_cargo: "", cuentahabiente: "" });
        resetSeleccionadoCargo(null);
        cargarTablaCargos();
        refrescarOpcionesPago();
      } else {
        setErrorsCargo(res.errors || { general: "Error al registrar" });
        if (res.errors?.general) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.errors.general,
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo conectar con el servidor.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorsPago({});
    setLoading(true);
    const res = await pagarCargo(formPago);
    if (res.success) {
      const usuarioPago = opcionesPago.find(
        (u) => String(u.value) === String(formPago.cuentahabiente_id)
      );
      setTicketData({
        nombre_completo: usuarioPago?.label || "Cliente",
        numero_contrato: 0,
        fecha_pago: new Date().toISOString().split("T")[0],
        monto_recibido: formPago.monto,
        nombre_descuento: "Sin descuento",
        comentarios: "Abono aplicado correctamente.",
      });
      setShowTicket(true);
      setFormPago({ cuentahabiente_id: "", monto: 0 });
      setCargosActivosUsuario([]);
      await refrescarOpcionesPago();
      cargarTablaCargos();
    } else {
      setErrorsPago(res.errors || { general: "Error en el pago" });
    }
    setLoading(false);
  };

  const saldoTotalPendiente = cargosActivosUsuario.reduce(
    (acc, c) => acc + parseFloat(c.saldo_restante_cargo),
    0
  );

  return (
    <div className="cm-container">
      <h2 className="cm-page-title">Gestión de Cargos y Pagos</h2>

      {showTicket && ticketData && (
        <TicketPago
          ticketData={ticketData}
          onClose={() => setShowTicket(false)}
          logoUrl={LogoApp}
        />
      )}

      <div className="cm-top-section">
        {/* ── Registrar Cargo ── */}
        <div className="cm-card cm-form-card cm-charge-mode">
          <h3>📝 Registrar Cargo (Deuda)</h3>
          <form onSubmit={handleSubmitCargo}>
            <div className="cm-form-group">
              <label>Cuentahabiente</label>
              <SearchableSelect
                options={opcionesCargo}
                value={formCargo.cuentahabiente}
                onChange={(v) => {
                  marcarSeleccionadoCargo(v);
                  setFormCargo({ ...formCargo, cuentahabiente: v });
                }}
                onSearch={buscarCargo}
                placeholder={buscandoCargo ? "Buscando..." : "Escribe para buscar..."}
              />
              {errorsCargo.cuentahabiente && (
                <span className="cm-error-msg">{errorsCargo.cuentahabiente}</span>
              )}
            </div>
            <div className="cm-form-row">
              <div className="cm-form-group">
                <label>Tipo</label>
                <select
                  className="cm-select-custom"
                  value={formCargo.tipo_cargo}
                  onChange={(e) =>
                    setFormCargo({ ...formCargo, tipo_cargo: e.target.value })
                  }
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposDeCargo.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                {errorsCargo.tipo_cargo && (
                  <span className="cm-error-msg">{errorsCargo.tipo_cargo}</span>
                )}
              </div>
              <div className="cm-form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={formCargo.fecha_cargo}
                  onChange={(e) =>
                    setFormCargo({ ...formCargo, fecha_cargo: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="cm-form-group">
              <label>Monto</label>
              <input
                type="number"
                className="cm-input-money cm-input-readonly"
                value={formCargo.monto_cargo || ""}
                readOnly
              />
            </div>
            <button type="submit" className="cm-btn cm-btn-primary" disabled={loading}>
              {loading ? "..." : "Registrar Cargo"}
            </button>
          </form>
        </div>

        {/* ── Realizar Pago ── */}
        <div className="cm-card cm-form-card cm-pay-mode">
          <h3>💰 Realizar Pago (Abono)</h3>
          <form onSubmit={handleSubmitPago}>
            <div className="cm-form-group">
              <label>Cuentahabiente</label>
              <SearchableSelect
                options={opcionesPago}
                value={formPago.cuentahabiente_id}
                onChange={(v) => {
                  setFormPago({ ...formPago, cuentahabiente_id: v });
                  setErrorsPago({});
                }}
                placeholder={cargandoPago ? "Cargando deudores..." : "Buscar por nombre..."}
              />
              {errorsPago.cuentahabiente_id && (
                <span className="cm-error-msg">{errorsPago.cuentahabiente_id}</span>
              )}
            </div>

            {/* Panel de cargos activos */}
            {formPago.cuentahabiente_id && (
              <div className="cm-cargos-activos-panel">
                {loadingCargosUsuario ? (
                  <p className="cm-cargos-loading">Cargando deudas...</p>
                ) : cargosActivosUsuario.length === 0 ? (
                  <div className="cm-cargos-sin-deuda">
                    <span>✅</span> Sin cargos pendientes.
                  </div>
                ) : (
                  <>
                    <p className="cm-cargos-activos-titulo">
                      Cargos pendientes
                      <span className="cm-cargos-count">{cargosActivosUsuario.length}</span>
                    </p>
                    <ul className="cm-cargos-activos-lista">
                      {cargosActivosUsuario.map((cargo) => (
                        <li key={cargo.id_cargo} className="cm-cargo-activo-item">
                          <div className="cm-cargo-activo-info">
                            <span className="cm-badge">
                              {cargo.tipo_cargo_detalle?.nombre || "N/A"}
                            </span>
                            <span className="cm-cargo-activo-fecha">
                              {cargo.fecha_cargo}
                            </span>
                          </div>
                          <span className="cm-cargo-activo-saldo">
                            ${parseFloat(cargo.saldo_restante_cargo).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="cm-cargos-total">
                      <span>Total pendiente</span>
                      <span className="cm-cargos-total-monto">
                        ${saldoTotalPendiente.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="cm-form-group">
              <label>Monto a Pagar</label>
              <input
                type="number"
                className="cm-input-money"
                value={formPago.monto || ""}
                onChange={(e) =>
                  setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
              {errorsPago.monto && (
                <span className="cm-error-msg">{errorsPago.monto}</span>
              )}
            </div>
            <div className="cm-info-box">
              <p>Este pago se aplicará al saldo global.</p>
            </div>
            <button type="submit" className="cm-btn cm-btn-success" disabled={loading}>
              {loading ? "..." : "Procesar Pago"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Historial ── */}
      <div className="cm-card cm-bottom-section">
        <div className="cm-table-header">
          <h3>Historial ({totalCargos})</h3>
          <div className="cm-search-box">
            <input
              type="text"
              placeholder="🔍 Buscar..."
              value={busquedaTabla}
              onChange={(e) => setBusquedaTabla(e.target.value)}
            />
          </div>
        </div>
        <div className="cm-table-responsive">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Concepto</th>
                <th>Fecha</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {listaCargos.map((item) => (
                <tr key={item.id_cargo}>
                  <td>{item.cuentahabiente_nombre}</td>
                  <td>
                    <span className="cm-badge">
                      {item.tipo_cargo_detalle?.nombre || "N/A"}
                    </span>
                  </td>
                  <td>{item.fecha_cargo}</td>
                  <td
                    style={{
                      color:
                        parseFloat(item.saldo_restante_cargo) > 0
                          ? "#e74c3c"
                          : "#27ae60",
                      fontWeight: "bold",
                    }}
                  >
                    ${parseFloat(item.saldo_restante_cargo).toFixed(2)}
                  </td>
                  <td>{item.activo ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cm-pagination">
          <button className="cm-btn-pag" onClick={handlePrev} disabled={!prevPage || loading}>
            ⬅ Ant.
          </button>
          <span className="cm-pag-info">
            Mostrando {listaCargos.length} de {totalCargos}
          </span>
          <button className="cm-btn-pag" onClick={handleNext} disabled={!nextPage || loading}>
            Sig. ➡
          </button>
        </div>
      </div>
    </div>
  );
};

export default CargosManager;