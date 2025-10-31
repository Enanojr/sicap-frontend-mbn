// Rutas.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import ContractTable from "../components/tablas/tabla";
import Main_Card from "../pages/Home/Main_Cards";
import RootLayout from "../components/layout/layout";
import ProtectedRoute from "../routes/ProtectedRoute";
import RegisterCobrador from "../pages/Rcobradores/Rcobradores";
import RegisterAdmin from "../pages/Radmin/Radmin";
import RegisterSector from "../pages/Rsector/Rsector";
import RegisterColonia from "../pages/Rcolonias/Rcolonias";
import RegisterCuentahabiente from "../pages/Rcuentahabientes/Rcuentahabientes";
import RegisterAsignacion from "../pages/Asignaciones/Asignaciones";
import FormularioPago from "../components/forms/form_pago";
import FormularioDescuentos from "../components/forms/form_descuentos";
import FormularioServicios from "../components/forms/form_servicios";
import Admin_Cards from "../pages/Home/Admin_Cards";

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
            element: <RegisterCobrador />,
          },
          {
            path: "/Radmin",
            element: <RegisterAdmin />,
          },
          {
            path: "/Rsector",
            element: <RegisterSector />,
          },
          {
            path: "/Rcolonia",
            element: <RegisterColonia />,
          },
          {
            path: "/Rcuentahabiente",
            element: <RegisterCuentahabiente />,
          },
          {
            path: "/Rasignacion",
            element: <RegisterAsignacion />,
          },
          {
            path: "/Pago",
            element: <FormularioPago />,
          },
          {
            path: "/Descuento",
            element: <FormularioDescuentos />,
          },
          {
            path: "/Servicios",
            element: <FormularioServicios />,
          },
          {
            path: "/Admin_Cards",
            element: <Admin_Cards />,
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
