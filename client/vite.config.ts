import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    // Route pages are lazy-loaded (App.tsx), so Rollup already splits shared
    // vendors into their own chunks. Forcing react/recharts into manual chunks
    // created a circular chunk with recharts v3 — let Rollup decide instead.
    chunkSizeWarningLimit: 700,
  },
});
