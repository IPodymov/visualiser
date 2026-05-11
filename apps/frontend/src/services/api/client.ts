import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduplan-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
