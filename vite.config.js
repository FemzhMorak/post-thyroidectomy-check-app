import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The backend (server/) runs separately on port 3001 in dev — proxy
    // /api so the frontend can call relative paths in both dev and prod.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
