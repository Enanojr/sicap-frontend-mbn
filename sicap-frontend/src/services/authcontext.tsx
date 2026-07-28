// context/authcontext.tsx
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../services/auth.service';
import { AuthContext } from './auth.context';
import type { Usuario } from './auth.context';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Hidrata la sesión desde localStorage una sola vez, al crear el estado
  const [usuario, setUsuario] = useState<Usuario | null>(() =>
    authService.getUser(),
  );

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
