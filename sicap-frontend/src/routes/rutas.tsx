// Rutas.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import ContractTable from "../components/tablas/tabla";
import Main_Card from "../pages/Home/Main_Cards";
import RootLayout from "../components/layout/layout";
import ProtectedRoute from "../routes/ProtectedRoute";

// Importaciones de rutas por eliminar
import FormularioPago from '../components/forms/form_pago'

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

];

export const router = createBrowserRouter(Rutas);