// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/rutas'; // Tu archivo de rutas
import { AuthProvider } from './services/authcontext'; // AuthProvider
import { ThemeProvider } from './components/botones/ThemeContext'; // ThemeProvider
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider> {/* Envuelve el RouterProvider con AuthProvider */}
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);