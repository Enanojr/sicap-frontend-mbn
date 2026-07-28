import { createContext, useContext } from "react";

export interface Usuario {
  id_cobrador: number;
  nombre: string;
  apellidos: string;
  usuario: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
