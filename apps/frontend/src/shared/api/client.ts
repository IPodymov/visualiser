import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  return trimmed.replace(/\/+$/, '').replace(/\/api$/i, '');
};

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

if (import.meta.env.PROD && !apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required in production');
}

const getFinalRequestUrl = (baseURL?: string, url?: string) => {
  if (!url) return baseURL || '';

  try {
    return new URL(url, baseURL || window.location.origin).toString();
  } catch {
    return `${baseURL ?? ''}${url}`;
  }
};

const getSafeResponseBody = (data: unknown) => {
  if (typeof data === 'string') return data.slice(0, 2000);
  return data ?? null;
};

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const finalUrl = getFinalRequestUrl(error.config?.baseURL, error.config?.url);
      const status = error.response?.status ?? 'network-error';
      const responseBody = getSafeResponseBody(error.response?.data);

      console.error('[api] request failed', {
        method: error.config?.method?.toUpperCase(),
        url: finalUrl,
        status,
        responseBody,
        code: error.code,
      });
    } else {
      console.error('[api] unexpected request failure', error);
    }

    return Promise.reject(error);
  },
);
