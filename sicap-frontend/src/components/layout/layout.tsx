import React from 'react';
import { Outlet } from 'react-router-dom'; // <-- Importante: este componente renderiza las rutas hijas
import Navbar from '../navbar/navbar'; 

const RootLayout: React.FC = () => {
  return (
    <>
      <Navbar />
      <main>
        {/* El contenido de las rutas anidadas (Home, Tabla, etc.) aparecerá aquí */}
        <Outlet />
      </main>
    </>
  );
};

export default RootLayout;