// context/authcontext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../services/auth.service';

interface Usuario {
  id_cobrador: number;
  nombre: string;
  apellidos: string;
  usuario: string;
  email: string;
  role: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Al montar el componente, verificar si hay sesión activa en localStorage
  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUsuario(user);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      
      if (response && response.cobrador) {
        setUsuario(response.cobrador);
      }
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    // Limpiar localStorage
    authService.logout();
    
    // Limpiar estado
    setUsuario(null);
    
    // Redirigir al login
    window.location.href = '/Login';
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: authService.isAuthenticated(),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};