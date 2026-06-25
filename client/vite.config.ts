import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the backend in dev when not using the mock layer.
      '/api': { target: 'http://localhost:4002', changeOrigin: true },
    },
  },
});
