import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Evita que una petición colgada deje la UI cargando indefinidamente.
  timeout: 30000,
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

// Reintenta automáticamente cuando el backend responde 429 (demasiadas
// peticiones) o 503 (servicio despertando). Espera con backoff exponencial,
// respetando la cabecera Retry-After si viene. Así una ráfaga de páginas no
// falla con 429, solo se ralentiza y se reacomoda sola.
const MAX_REINTENTOS = 4;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config;

    if ((status === 429 || status === 503) && config) {
      config._reintentos = config._reintentos ?? 0;

      if (config._reintentos < MAX_REINTENTOS) {
        config._reintentos++;

        const retryAfter = Number(error.response?.headers?.['retry-after']);
        const esperaBase =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(1000 * 2 ** (config._reintentos - 1), 8000); // 1s,2s,4s,8s
        const jitter = Math.random() * 300; // evita que todas reintenten a la vez

        await new Promise((resolve) => setTimeout(resolve, esperaBase + jitter));
        return api(config);
      }
    }

    if (status === 401) {
      localStorage.removeItem('access');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;