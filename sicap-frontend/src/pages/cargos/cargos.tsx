import React, { useState, useEffect } from "react";
import {
  getCargos,
  registrarCargo,
  pagarCargo,
} from "../../services/cargos.service";
import type {
  CargoResponse,
  CargoData,
  PagoData,
} from "../../services/cargos.service";
import { getCuentahabientesList } from "../../services/Rcuentahabientes.service";
import type { CuentahabienteResponse } from "../../services/Rcuentahabientes.service";
import {
  getAllCargos,
  type CargoResponse as TipoCargoOp,
} from "../../services/tcargos.service";

import TicketPago, { type TicketData as TicketPagoData } from "./TicketCargo";
import SearchableSelect from "../../components/searchselect/searchselect";
import LogoApp from "../../assets/Logo.png"; 
import Swal from "sweetalert2";
import "../../styles/styles.css";

const CargosManager = () => {
  const [listaCargos, setListaCargos] = useState<CargoResponse[]>([]);
  const [listaUsuarios, setListaUsuarios] = useState<CuentahabienteResponse[]>([]);
  const [tiposDeCargo, setTiposDeCargo] = useState<TipoCargoOp[]>([]);

  // Paginación (Restaurada)
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [totalCargos, setTotalCargos] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  // Ticket y Feedback
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketPagoData | null>(null);


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

  // Errores (Restaurados)
  const [errorsCargo, setErrorsCargo] = useState<any>({});
  const [errorsPago, setErrorsPago] = useState<any>({});

  useEffect(() => {
    const cargarDatos = async () => {
      const [usuarios, tipos] = await Promise.all([
        getCuentahabientesList(),
        getAllCargos(),
      ]);
      setListaUsuarios(usuarios);
      setTiposDeCargo(tipos);
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (formCargo.tipo_cargo) {
      const seleccionado = tiposDeCargo.find(t => String(t.id) === String(formCargo.tipo_cargo));
      if (seleccionado) setFormCargo(prev => ({ ...prev, monto_cargo: seleccionado.monto }));
    } else {
      setFormCargo(prev => ({ ...prev, monto_cargo: 0 }));
    }
  }, [formCargo.tipo_cargo, tiposDeCargo]);

  useEffect(() => {
    const timeoutId = setTimeout(() => cargarTablaCargos(undefined, busquedaTabla), 500);
    return () => clearTimeout(timeoutId);
  }, [busquedaTabla]);

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
        // Alerta de éxito con SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Cargo registrado",
          text: "El cargo se ha guardado correctamente en la base de datos.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#3b82f6",
        });

        setFormCargo({ ...formCargo, monto_cargo: 0, tipo_cargo: "" });
        cargarTablaCargos();
      } else {
        setErrorsCargo(res.errors || { general: "Error al registrar" });
        
        // Opcional: Alerta de error si no hay errores de campo específicos
        if (res.errors?.general) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.errors.general,
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (error) {
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
      const usuario = listaUsuarios.find(u => String(u.id_cuentahabiente) === String(formPago.cuentahabiente_id));
      setTicketData({
        nombre_completo: usuario ? `${usuario.nombres} ${usuario.ap} ${usuario.am}` : "Cliente",
        numero_contrato: usuario ? Number(usuario.numero_contrato) : 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        monto_recibido: formPago.monto,
        nombre_descuento: "Sin descuento",
        comentarios: "Abono aplicado correctamente."
      });
      setShowTicket(true);
      setFormPago({ ...formPago, monto: 0 });
      cargarTablaCargos();
    } else {
      setErrorsPago(res.errors || { general: "Error en el pago" });
    }
    setLoading(false);
  };

  const opcionesUsuarios = listaUsuarios.map((user) => ({
    value: user.id_cuentahabiente,
    label: `#${user.numero_contrato} - ${user.nombres} ${user.ap} ${user.am}`,
    keywords: String(user.numero_contrato),
  }));

  return (
    <div className="cm-container">
      <h2 className="cm-page-title">Gestión de Cargos y Pagos</h2>

      {showTicket && ticketData && (
  <TicketPago 
    ticketData={ticketData} 
    onClose={() => setShowTicket(false)} 
    logoUrl={LogoApp} // Enviamos la imagen importada
  />
)}

      

      <div className="cm-top-section">
        <div className="cm-card cm-form-card cm-charge-mode">
          <h3>📝 Registrar Cargo (Deuda)</h3>
          <form onSubmit={handleSubmitCargo}>
            <div className="cm-form-group">
              <label>Cuentahabiente</label>
              <SearchableSelect
                options={opcionesUsuarios}
                value={formCargo.cuentahabiente}
                onChange={(v) => setFormCargo({ ...formCargo, cuentahabiente: v })}
                placeholder="Buscar..."
              />
              {errorsCargo.cuentahabiente && <span className="cm-error-msg">{errorsCargo.cuentahabiente}</span>}
            </div>
            <div className="cm-form-row">
              <div className="cm-form-group">
                <label>Tipo</label>
                <select className="cm-select-custom" value={formCargo.tipo_cargo} onChange={(e) => setFormCargo({ ...formCargo, tipo_cargo: e.target.value })} required>
                  <option value="">-- Seleccionar --</option>
                  {tiposDeCargo.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                {errorsCargo.tipo_cargo && <span className="cm-error-msg">{errorsCargo.tipo_cargo}</span>}
              </div>
              <div className="cm-form-group">
                <label>Fecha</label>
                <input type="date" value={formCargo.fecha_cargo} onChange={(e) => setFormCargo({ ...formCargo, fecha_cargo: e.target.value })} />
              </div>
            </div>
            <div className="cm-form-group">
              <label>Monto</label>
              <input type="number" className="cm-input-money cm-input-readonly" value={formCargo.monto_cargo || ""} readOnly />
            </div>
            <button type="submit" className="cm-btn cm-btn-primary" disabled={loading}>{loading ? "..." : "Registrar Cargo"}</button>
          </form>
        </div>

        <div className="cm-card cm-form-card cm-pay-mode">
          <h3>💰 Realizar Pago (Abono)</h3>
          <form onSubmit={handleSubmitPago}>
            <div className="cm-form-group">
              <label>Cuentahabiente</label>
              <SearchableSelect
                options={opcionesUsuarios}
                value={formPago.cuentahabiente_id}
                onChange={(v) => setFormPago({ ...formPago, cuentahabiente_id: v })}
                placeholder="Buscar..."
              />
              {errorsPago.cuentahabiente_id && <span className="cm-error-msg">{errorsPago.cuentahabiente_id}</span>}
            </div>
            <div className="cm-form-group">
              <label>Monto a Pagar</label>
              <input type="number" className="cm-input-money" value={formPago.monto || ""} onChange={(e) => setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
              {errorsPago.monto && <span className="cm-error-msg">{errorsPago.monto}</span>}
            </div>
            <div className="cm-info-box">
              <p>Este pago se aplicará al saldo global.</p>
            </div>
            <button type="submit" className="cm-btn cm-btn-success" disabled={loading}>{loading ? "..." : "Procesar Pago"}</button>
          </form>
        </div>
      </div>

      <div className="cm-card cm-bottom-section">
        <div className="cm-table-header">
          <h3>Historial ({totalCargos})</h3>
          <div className="cm-search-box">
            <input type="text" placeholder="🔍 Buscar..." value={busquedaTabla} onChange={(e) => setBusquedaTabla(e.target.value)} />
          </div>
        </div>
        <div className="cm-table-responsive">
          <table>
            <thead>
              <tr><th>Cliente</th><th>Concepto</th><th>Fecha</th><th>Saldo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {listaCargos.map((item) => (
                <tr key={item.id_cargo}>
                  <td>{item.cuentahabiente_nombre}</td>
                  <td><span className="cm-badge">{item.tipo_cargo_detalle?.nombre || "N/A"}</span></td>
                  <td>{item.fecha_cargo}</td>
                  <td style={{ color: parseFloat(item.saldo_restante_cargo) > 0 ? "#e74c3c" : "#27ae60", fontWeight: "bold" }}>
                    ${parseFloat(item.saldo_restante_cargo).toFixed(2)}
                  </td>
                  <td>{item.activo ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cm-pagination">
          <button className="cm-btn-pag" onClick={handlePrev} disabled={!prevPage || loading}>⬅ Ant.</button>
          <span className="cm-pag-info">Mostrando {listaCargos.length} de {totalCargos}</span>
          <button className="cm-btn-pag" onClick={handleNext} disabled={!nextPage || loading}>Sig. ➡</button>
        </div>
      </div>
    </div>
  );
};

export default CargosManager;