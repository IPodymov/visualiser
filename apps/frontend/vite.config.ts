import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL ?? process.env.VITE_API_BASE_URL;

  if (process.env.VERCEL && !apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required for Vercel deployments');
  }

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            animation: ['framer-motion'],
            icons: ['lucide-react'],
            api: ['axios', 'zustand'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:4000',
        '/health': 'http://localhost:4000',
      },
    },
  };
});
