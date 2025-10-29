import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormConfig } from '../forms/form';
import FormularioReutilizable from '../forms/form';
import { DollarSign, Calendar, User, Percent, MessageSquare } from 'lucide-react';
import Swal from "sweetalert2";
import { createPago, type PagoCreate } from '../../services/pago.service';
import api from '../../api_axios';

// Interface para cuentahabiente
interface Cuentahabiente {
  id_cuentahabiente: number;
  numero_contrato: number;
  nombres: string;
  ap: string;
  am: string;
}

// Interface para la respuesta paginada
interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cuentahabiente[];
}

// Interface para descuento
interface Descuento {
  id_descuento: number;
  nombre_descuento: string;
  porcentaje?: number;
}

// Interface para la respuesta paginada de descuentos
interface PaginatedDescuentosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Descuento[];
}

const FormularioPagos: React.FC = () => {
  const navigate = useNavigate();
  const [cuentahabientes, setCuentahabientes] = useState<Array<{ value: string; label: string }>>([]);
  const [descuentos, setDescuentos] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Cargar cuentahabientes al montar el componente
  useEffect(() => {
    const fetchCuentahabientes = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // Verificar token
        const token = localStorage.getItem("access");
        if (!token) {
          Swal.fire({
            icon: 'error',
            title: 'Sesión expirada',
            text: 'Por favor, inicia sesión nuevamente.',
            confirmButtonColor: '#ef4444',
          });
          return;
        }

        console.log('Cargando cuentahabientes...');
        
        // Cargar TODAS las páginas 
        const allCuentahabientes: Cuentahabiente[] = [];
        let nextUrl: string | null = '/cuentahabientes/';
        let pageCount: number = 0;

        while (nextUrl) {
          pageCount++;
          console.log(` Cargando página ${pageCount}...`);
          
          const response = await api.get<PaginatedResponse>(nextUrl);
          const data: PaginatedResponse = response.data;
          
         
          if (data.results && Array.isArray(data.results)) {
            allCuentahabientes.push(...data.results);
            nextUrl = data.next ? data.next.replace('https://sicap-backend.onrender.com', '') : null;
            console.log(` Página ${pageCount}: ${data.results.length} registros (Total: ${allCuentahabientes.length})`);
          } else {
            console.warn(' Estructura inesperada:', data);
            break;
          }
        }
        
        console.log(` Total de cuentahabientes cargados: ${allCuentahabientes.length}`);
        
    
        const formattedData = allCuentahabientes.map((cuenta) => ({
          value: cuenta.id_cuentahabiente.toString(), 
          label: `#${cuenta.numero_contrato} - ${cuenta.nombres} ${cuenta.ap} ${cuenta.am}`.trim() 
        }));

        setCuentahabientes(formattedData);
        console.log('Select preparado con', formattedData.length, 'opciones');
      } catch (error: any) {
        console.error(' Error al cargar cuentahabientes:', error);
        
        const message =
          error.response?.status === 403
            ? "Acceso prohibido. Tu sesión puede haber expirado."
            : error.response?.status === 401
            ? "No autorizado. Por favor, inicia sesión nuevamente."
            : "No se pudieron cargar los cuentahabientes";

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: message,
          confirmButtonColor: '#ef4444',
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
        console.log('Cargando descuentos...');
        
        
        const allDescuentos: Descuento[] = [];
        let nextUrl: string | null = '/descuentos/';
        let pageCount: number = 0;

        while (nextUrl) {
          pageCount++;
          console.log(`  Cargando página de descuentos ${pageCount}...`);
          
          const response = await api.get<PaginatedDescuentosResponse>(nextUrl);
          const data: PaginatedDescuentosResponse = response.data;
          
        
          if (data.results && Array.isArray(data.results)) {
            allDescuentos.push(...data.results);
            nextUrl = data.next ? data.next.replace('https://sicap-backend.onrender.com', '') : null;
            console.log(`  Página ${pageCount}: ${data.results.length} descuentos (Total: ${allDescuentos.length})`);
          } else {
            console.warn('  Estructura inesperada en descuentos:', data);
            break;
          }
        }
        
        console.log(`  Total de descuentos cargados: ${allDescuentos.length}`);
        
   
        const formattedData = allDescuentos.map((desc) => ({
          value: desc.id_descuento.toString(), 
          label: desc.nombre_descuento 
        }));

        setDescuentos(formattedData);
        console.log('Descuentos preparados:', formattedData.length, 'opciones');
      } catch (error: any) {
        console.error('  Error al cargar descuentos:', error);
        
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudieron cargar los descuentos. Podrás continuar sin seleccionar descuento.',
          confirmButtonColor: '#f59e0b',
        });
      }
    };

    fetchCuentahabientes();
    fetchDescuentos();
  }, []);

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

  const validatePositiveNumber = (value: any): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return 'Debe ser un número mayor a 0';
    }
    return null;
  };

  const validateNonNegativeNumber = (value: any): string | null => {
    if (!value || value === '') return null; 
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 'Debe ser un número mayor o igual a 0';
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
    title: 'Registro de Pagos',
    fields: [
      {
        name: 'cuentahabiente',
        label: 'Cuenta Habiente',
        type: 'select',
        icon: User,
        required: true,
        options: cuentahabientes,
        placeholder: loading ? 'Cargando...' : 'Selecciona un cuentahabiente',
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
        name: 'descuento',
        label: 'Descuento',
        type: 'select',
        icon: Percent,
        required: false,
        options: descuentos,
        placeholder: 'Selecciona un descuento (opcional)',
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
      {
        name: 'comentarios',
        label: 'Comentarios',
        type: 'textarea',
        placeholder: 'Observaciones o comentarios adicionales (opcional)',
        icon: MessageSquare,
        required: false,
        defaultValue: '',
      },
    ],

    onSubmit: async (data) => {
      try {
        
        const token = localStorage.getItem("access");
        if (!token) {
          Swal.fire({
            icon: 'error',
            title: 'Sesión expirada',
            text: 'Por favor, inicia sesión nuevamente.',
            confirmButtonColor: '#ef4444',
          });
          return;
        }

        Swal.fire({
          title: 'Enviando...',
          text: 'Registrando el pago, por favor espera.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        
        const pagoData: PagoCreate = {
          cuentahabiente: parseInt(data.cuentahabiente), 
          fecha_pago: data.fecha_pago,
          monto_recibido: parseFloat(data.monto_recibido),
          descuento: data.descuento ? parseInt(data.descuento) : 0, 
          mes: data.mes,
          anio: parseInt(data.anio),
          comentarios: data.comentarios || '' 
        };

        console.log(' Datos a enviar:', pagoData);

        const result = await createPago(pagoData);

        Swal.fire({
          icon: 'success',
          title: '¡Pago registrado exitosamente!',
          text: `ID del Pago: ${result.ID_Pago}`,
          confirmButtonColor: '#58b2ee',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          navigate('/Tabla');
        });

        console.log('Pago registrado:', result);

      } catch (error: any) {
        console.error(' Error al registrar el pago:', error);
        
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          const message = error.response?.status === 403
            ? "Acceso prohibido. Tu sesión puede haber expirado."
            : "No autorizado. Por favor, inicia sesión nuevamente.";
          
          Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: message,
            confirmButtonColor: '#ef4444',
          });

          // Limpiar localStorage
          localStorage.removeItem("access");
          localStorage.removeItem("usuario");
        } else {
         
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar el pago',
            text: error.message || 'Ocurrió un problema al procesar la solicitud. Intenta nuevamente.',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Cerrar'
          });
        }

        throw error;
      }
    },

    submitButtonText: 'Registrar Pago',
    resetButtonText: 'Limpiar Formulario',
    successMessage: '¡Pago registrado exitosamente!',
    errorMessage: 'Error al registrar el pago. Intente nuevamente.',
    showResetButton: true,
  };

  if (loading) {
    return <div className="text-center p-4">Cargando formulario...</div>;
  }

  return <FormularioReutilizable config={formConfig} />;
};

export default FormularioPagos;