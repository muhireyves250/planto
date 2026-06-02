import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3001
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
});
