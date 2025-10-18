// services/auth.service.ts
import api from '../api_axios'; // Ajusta la ruta según tu estructura

const API_URL = "/auth";

// Funciones auxiliares para localStorage
const getStoredToken = (): string | null => {
  return localStorage.getItem('access');
};

const getStoredUser = (): any | null => {
  const user = localStorage.getItem('usuario');
  return user ? JSON.parse(user) : null;
};

// Login del usuario
export const login = async (usuario: string, password: string) => {
    try {
        const response = await api.post(`${API_URL}/login/`, { usuario, password });
        
        if (response.data.access) {
            // Guardar en localStorage
            localStorage.setItem('access', response.data.access);
            localStorage.setItem('usuario', JSON.stringify(response.data.cobrador));
        }
        
        return response.data;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
};

// Obtener el token desde localStorage
export const getToken = (): string | null => {
    return getStoredToken();
};

// Obtener el usuario autenticado desde localStorage
export const getUser = (): any | null => {
    return getStoredUser();
};

// Logout del usuario
export const logout = (): void => {
    localStorage.removeItem('access');
    localStorage.removeItem('usuario');
};

// Verificar si está autenticado
export const isAuthenticated = (): boolean => {
    return getStoredToken() !== null && getStoredUser() !== null;
};