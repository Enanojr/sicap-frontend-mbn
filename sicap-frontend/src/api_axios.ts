import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    // 1. Busca el token
    const token = localStorage.getItem('access');

    // 2. Si existe, lo añade al encabezado
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Correcto: Se crea una cadena de texto
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// El interceptor de respuesta sigue siendo igual de importante
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;