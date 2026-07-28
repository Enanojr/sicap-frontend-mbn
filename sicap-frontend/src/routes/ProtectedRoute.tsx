// ProtectedRoute.tsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../services/auth.context';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  // Si está autenticado, renderiza las rutas hijas (Outlet)
  // Si no, redirige al Login
  return isAuthenticated ? <Outlet /> : <Navigate to="/Login" replace />;
}
