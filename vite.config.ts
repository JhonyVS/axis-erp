import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Served from https://<user>.github.io/axis-erp/ — every asset URL needs the repo
  // name prefixed, or the page loads with no CSS/JS on GitHub Pages.
  base: '/axis-erp/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // Recharts and framer-motion are large and change rarely; splitting them keeps
        // the app chunk small enough that an edit does not invalidate the whole cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: { port: 5180, open: false },
});
