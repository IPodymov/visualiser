import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const sourceRoot = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ mode }) => {
  const environmentMode = mode === 'production' ? 'prod' : mode;
  const env = loadEnv(environmentMode, workspaceRoot, 'VITE_');
  const apiBaseUrl = env.VITE_API_BASE_URL ?? process.env.VITE_API_BASE_URL;

  if (process.env.VERCEL && !apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required for Vercel deployments');
  }

  return {
    envDir: workspaceRoot,
    define:
      mode === 'production'
        ? { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl ?? '') }
        : undefined,
    plugins: [react()],
    resolve: {
      alias: {
        '@app': `${sourceRoot}/app`,
        '@entities': `${sourceRoot}/entities`,
        '@features': `${sourceRoot}/features`,
        '@shared': `${sourceRoot}/shared`,
        '@widgets': `${sourceRoot}/widgets`,
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      include: ['src/tests/**/*.test.{ts,tsx}'],
      clearMocks: true,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        reportsDirectory: 'coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/tests/**', 'src/vite-env.d.ts'],
        thresholds: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)
            ) {
              return 'react';
            }
            if (id.includes('/recharts/')) return 'charts';
            if (id.includes('/framer-motion/')) return 'animation';
            if (id.includes('/lucide-react/')) return 'icons';
            if (/[\\/]node_modules[\\/](axios|zustand)[\\/]/.test(id)) return 'api';
            return undefined;
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
