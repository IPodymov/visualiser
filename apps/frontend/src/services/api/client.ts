import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  return trimmed.replace(/\/+$/, '').replace(/\/api$/, '');
};

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

if (import.meta.env.PROD && !apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required in production');
}

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
