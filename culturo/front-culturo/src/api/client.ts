import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('culturo_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('culturo_token');
      localStorage.removeItem('culturo_user');

      // Ne pas rediriger si on est déjà sur une page publique (login, reset, etc.)
      const publicPaths = ['/login', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe'];
      const isPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));

      if (!isPublicPage) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
