import React, { useState } from 'react';
import { validarCierre, confirmarCierre } from '../../services/cierreanual.service'; 
import '../../styles/styles.css';

const CierreAnual = () => {
  // Estado del formulario
  const [form, setForm] = useState({
    anio_cierre: new Date().getFullYear(),
    anio_nuevo: new Date().getFullYear() + 1
  });

  // Estados de control
  const [step, setStep] = useState<number>(1); 
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: parseInt(e.target.value) || ''
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  // PASO 1: Validar
  const handleValidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const resultado = await validarCierre(form);

    setLoading(false);

    if (resultado.success) {
      setStep(2); 
    } else {
      setErrors(resultado.errors); 
    }
  };

  // PASO 2: Confirmar
  const handleConfirmar = async () => {
    setLoading(true);
    const resultado = await confirmarCierre(form);
    setLoading(false);

    if (resultado.success) {
      setStep(3); 
    } else {
      setErrors(resultado.errors); 
    }
  };

  if (step === 3) {
    return (
      // Reutilizamos cm-container y cm-card para mantener el estilo
      <div className="cm-container">
        <div className="cm-card cm-cierre-card cm-success-mode">
            <h3>¡Cierre Anual Exitoso!</h3>
            <p>El sistema ha cerrado el periodo {form.anio_cierre} correctamente.</p>
            <button className="cm-btn cm-btn-primary" onClick={() => setStep(1)}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cm-container">
      {/* Contenedor centrado específico para este formulario */}
      <div className="cm-card cm-cierre-card">
          <h2 className="cm-page-title" style={{marginBottom: '20px'}}>Gestión de Cierre Anual</h2>

          {/* Error general */}
          {errors.general && <div className="cm-feedback error">{errors.general}</div>}

          {step === 1 && (
            <form onSubmit={handleValidar} className="cm-cierre-form">
              <div className="cm-form-group">
                <label>Año a Cerrar</label>
                <input
                  type="number"
                  name="anio_cierre"
                  value={form.anio_cierre}
                  onChange={handleChange}
                  className={errors.anio_cierre ? 'cm-input-error' : ''}
                />
                {errors.anio_cierre && <span className="cm-error-msg">{errors.anio_cierre}</span>}
              </div>

              <div className="cm-form-group">
                <label>Nuevo Año Fiscal</label>
                <input
                  type="number"
                  name="anio_nuevo"
                  value={form.anio_nuevo}
                  onChange={handleChange}
                  className={errors.anio_nuevo ? 'cm-input-error' : ''}
                />
                {errors.anio_nuevo && <span className="cm-error-msg">{errors.anio_nuevo}</span>}
              </div>

              <button type="submit" disabled={loading} className="cm-btn cm-btn-primary">
                {loading ? 'Verificando...' : 'Iniciar Cierre'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="cm-confirmacion-box">
              <div className="cm-icon-warning">⚠️</div>
              <h3>Confirmación Requerida</h3>
              <p>
                Está a punto de cerrar el año <strong>{form.anio_cierre}</strong>.
                Esta acción es irreversible y reiniciará los saldos/valores.
              </p>
              
              {errors.confirmar && <div className="cm-feedback error">{errors.confirmar}</div>}

              <div className="cm-actions">
                <button 
                  className="cm-btn cm-btn-secondary" 
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  className="cm-btn cm-btn-danger" 
                  onClick={handleConfirmar}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'CONFIRMAR CIERRE'}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default CierreAnual;