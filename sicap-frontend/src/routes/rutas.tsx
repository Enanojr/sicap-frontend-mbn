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

// Importaciones de rutas por eliminar
import FormularioPago from '../components/forms/form_pago'
import FormularioDescuentos from "../components/forms/form_descuentos";
import  FormularioServicios from "../components/forms/form_servicios"

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

  //Rutas para validar componentes, borrar 
    {
    path: "pago",
    element: <FormularioPago />,
  },
    {
    path: "descuento",
    element: <FormularioDescuentos />,
  },
   {
    path: "servicios",
    element: < FormularioServicios />,
  },

];

export const router = createBrowserRouter(Rutas);