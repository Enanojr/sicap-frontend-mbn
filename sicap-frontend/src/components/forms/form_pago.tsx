import React from 'react';
import type { FormConfig } from '../forms/form';
import FormularioReutilizable from '../forms/form';
import { DollarSign, Calendar, User, Percent, Users } from 'lucide-react';
import Swal from "sweetalert2";
import { createPago, type PagoCreate } from '../../services/pago.service'; // 👈 Importar el servicio

const FormularioPagos: React.FC = () => {
  
  const cobradores = [
    { value: '1', label: 'Juan Pérez' },
    { value: '2', label: 'María García' },
    { value: '3', label: 'Carlos Rodríguez' }
  ];

  const cuentahabientes = [
    { value: '1', label: 'Cliente A - Juan López' },
    { value: '2', label: 'Cliente B - Ana Martínez' },
    { value: '3', label: 'Cliente C - Pedro Sánchez' }
  ];

  const descuentos = [
    { value: '0', label: 'INAPAM' },
    { value: '1', label: 'Promoción anual' },
    { value: '2', label: 'Pago puntual' },
    { value: '3', label: 'Empleado' },
    { value: '4', label: 'Fuga de agua' },
    { value: '5', label: 'Convenio con la empresa' },
    { value: '6', label: 'Buen fin 2024' }, 
    { value: '7', label: 'Adulto mayor' }, 
    { value: '8', label: 'Ninguno' }, 
  ];

  const meses = [
    { value: 'Enero', label: 'Enero' },
    { value: 'Febrero', label: 'Febrero' },
    { value: 'Marzo', label: 'Marzo' },
    { value: 'Abril', label: 'Abril' },
    { value: 'Mayo', label: 'Mayo' },
    { value: 'Junio', label: 'Junio' },
    { value: 'Julio', label: 'Julio' },
    { value: 'Agosto', label: 'Agosto' },
    { value: 'Septiembre', label: 'Septiembre' },
    { value: 'Octubre', label: 'Octubre' },
    { value: 'Noviembre', label: 'Noviembre' },
    { value: 'Diciembre', label: 'Diciembre' }
  ];

  // Validaciones personalizadas
  const validatePositiveNumber = (value: any): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return 'Debe ser un número mayor a 0';
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

  // Configuración del formulario
  const formConfig: FormConfig = {
    title: 'Registro de Pagos',
    fields: [
      {
        name: 'id_cuentahabiente',
        label: 'Cuenta Habiente',
        type: 'select',
        icon: User,
        required: true,
        options: cuentahabientes,
      },
      {
        name: 'id_cobrador',
        label: 'Cobrador',
        type: 'select',
        icon: Users,
        required: true,
        options: cobradores,
      },
      {
        name: 'fecha_pago',
        label: 'Fecha de Pago',
        type: 'date',
        icon: Calendar,
        required: true,
        defaultValue: new Date().toISOString().split('T')[0],
      },
      {
        name: 'monto_recibido',
        label: 'Monto Recibido',
        type: 'number',
        placeholder: '0.00',
        icon: DollarSign,
        required: true,
        validation: validatePositiveNumber,
      },
      {
        name: 'id_descuento',
        label: 'Descuento Aplicado',
        type: 'select',
        icon: Percent,
        required: false,
        options: descuentos,
        defaultValue: '8', // "Ninguno" como default
      },
      {
        name: 'monto_descuento',
        label: 'Monto de Descuento',
        type: 'number',
        placeholder: '0.00',
        icon: Percent,
        required: false,
        defaultValue: '0',
      },
      {
        name: 'mes',
        label: 'Mes',
        type: 'select',
        icon: Calendar,
        required: true,
        options: meses,
        defaultValue: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                       [new Date().getMonth()],
      },
      {
        name: 'anio',
        label: 'Año',
        type: 'number',
        placeholder: 'Ej: 2024',
        icon: Calendar,
        required: true,
        defaultValue: new Date().getFullYear().toString(),
        validation: validateYear,
      },
    ],

    onSubmit: async (data) => {
      try {
        // 1. Mostrar loading
        Swal.fire({
          title: 'Enviando...',
          text: 'Registrando el pago, por favor espera.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // 2. Preparar los datos según la interfaz PagoCreate
        const pagoData: PagoCreate = {
          ID_Descuento: parseInt(data.id_descuento),
          ID_Cobrador: parseInt(data.id_cobrador),
          ID_Cuentahabiente: parseInt(data.id_cuentahabiente),
          Fecha_pago: data.fecha_pago,
          Monto_recibido: parseFloat(data.monto_recibido),
          Monto_descuento: parseFloat(data.monto_descuento) || 0,
          Mes: data.mes,
          Anio: parseInt(data.anio)
        };

        console.log('📤 Datos a enviar:', pagoData);

        // 3. Llamar al servicio (maneja autenticación y errores automáticamente)
        const result = await createPago(pagoData);

        // 4. Mostrar éxito
        Swal.fire({
          icon: 'success',
          title: '¡Pago registrado exitosamente!',
          text: `ID del Pago: ${result.ID_Pago}`,
          confirmButtonColor: '#58b2ee',
          confirmButtonText: 'Aceptar'
        });

        console.log('✅ Pago registrado:', result);

        // El FormularioReutilizable resetea automáticamente el formulario
        
      } catch (error: any) {
        console.error('❌ Error al registrar el pago:', error);
        
        // Solo mostrar error si no fue manejado por el servicio
        // (el servicio ya muestra Swal para errores de autenticación)
        if (!error.message.includes("Sesión expirada") && 
            !error.message.includes("autenticación") &&
            !error.message.includes("autorizado")) {
          
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar el pago',
            text: error.message || 'Ocurrió un problema al procesar la solicitud. Intenta nuevamente.',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Cerrar'
          });
        }

        // Re-lanzar el error para que FormularioReutilizable lo maneje
        throw error;
      }
    },

    submitButtonText: 'Registrar Pago',
    resetButtonText: 'Limpiar Formulario',
    successMessage: '¡Pago registrado exitosamente!',
    errorMessage: 'Error al registrar el pago. Intente nuevamente.',
    showResetButton: true,
  };

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioPagos;