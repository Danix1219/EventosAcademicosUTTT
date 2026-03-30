import axios from 'axios';

// 👇 AQUÍ ESTÁ EL DETALLE (debe decir "export const clienteApi")
export const clienteApi = axios.create({
  baseURL: 'https://eventosacademicosuttt.bsite.net/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// El Interceptor...
clienteApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);