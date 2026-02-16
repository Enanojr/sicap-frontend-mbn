// Rutas.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import ContractTable from "../components/tablas/tabla";
import Main_Card from "../pages/Home/Main_Cards";
import RootLayout from "../components/layout/layout";
import ProtectedRoute from "../routes/ProtectedRoute";
import RegisterAdmin from "../pages/Radmin/Radmin";
import FormularioPago from "../components/forms/form_pago";
import ServiciosPage from "../pages/Principal_Form_Table/serviciospage";
import Admin_Cards from "../pages/Home/Admin_Cards";
import DescuentosPage from "../pages/Principal_Form_Table/descuentospage";
import CuentahabientesPage from "../pages/Principal_Form_Table/cuentahabientespage";
import CobradoresPage from "../pages/Principal_Form_Table/cobradorespage";
import ColoniasPage from "../pages/Principal_Form_Table/coloniaspage";
import AsignacionesPage from "../pages/Principal_Form_Table/asignacionespage";
import SectoresPage from "../pages/Principal_Form_Table/sectorespage";
import ProgresoTable from "../pages/Users/Users";
import EstadoCuentaPage from "../pages/Estado_Cuenta/estado_cuenta";
import CierreAnual from "../pages/cierre_anual/cierreanual";
import CargosManager from "../pages/cargos/cargos";
import CargosPage from "../pages/Principal_Form_Table/cargospage";
import CorteCaja from "../pages/CorteCaja/CorteCaja";


const Rutas = [
  // Ruta #1: Login (pública)
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/Login",
    element: <Login />,
  },
  {
    path: "/users",
    element: <ProgresoTable />,
  },

  // Ruta #2: Rutas protegidas con Layout y Navbar
  {
    element: <ProtectedRoute />, // Protege todas las rutas hijas
    children: [
      {
        element: <RootLayout />, // El Layout con Navbar
        children: [
          {
            path: "/Home",
            element: <Home />,
          },
          {
            path: "/Tabla",
            element: <ContractTable />,
          },
          {
            path: "/Main_Card",
            element: <Main_Card />,
          },
          {
            path: "/Rcobradores",
            element: <CobradoresPage />,
          },
          {
            path: "/Radmin",
            element: <RegisterAdmin />,
          },
          {
            path: "/Rsector",
            element: <SectoresPage />,
          },
          {
            path: "/Rcolonia",
            element: <ColoniasPage />,
          },
          {
            path: "/Rcuentahabiente",
            element: <CuentahabientesPage />,
          },
          {
            path: "/Rasignacion",
            element: <AsignacionesPage />,
          },
          {
            path: "/Pago",
            element: <FormularioPago />,
          },
          {
            path: "/Descuento",
            element: <DescuentosPage />,
          },

          {
            path: "/Admin_Cards",
            element: <Admin_Cards />,
          },
          {
            path: "/servicios",
            element: <ServiciosPage />,
          },
          {
            path: "/estadocuenta",
            element: <EstadoCuentaPage />,
          },
          {
            path: "/cierreanual",
            element: <CierreAnual />,
          },
          {
            path: "/cargos",
            element: <CargosManager />,
          },
          {
            path: "/tcargos",
            element: (
              <CargosPage/>
            ),
          },
          {
            path: "/corte-caja",
            element: <CorteCaja />,
          }
        ],
      },
    ],
  },

  // Ruta catch-all
  {
    path: "*",
    element: <Navigate to="/Login" replace />,
  },
];

export const router = createBrowserRouter(Rutas);
