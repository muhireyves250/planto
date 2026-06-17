import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'wheat-stalk.png', 'farm_bg.png'],
      manifest: {
        name: 'Planto – AI Crop Recommendation',
        short_name: 'Planto',
        description: 'AI-powered soil testing and crop recommendation for smart farming.',
        theme_color: '#1e362a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        categories: ['agriculture', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: 'Soil Test',
            short_name: 'Test Soil',
            description: 'Run a new soil test',
            url: '/soil-test',
            icons: [{ src: 'icon.svg', sizes: 'any' }],
          },
          {
            name: 'Monitoring',
            short_name: 'Monitor',
            description: 'Check crop health',
            url: '/monitoring',
            icons: [{ src: 'icon.svg', sizes: 'any' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // API-only paths — use regex to avoid matching React Router paths like /admin
      '/admin/overview': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/admin/pending':  { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/admin/users':    { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/admin/farms':    { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/login': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        bypass: (req) =>
          req.method === 'GET' && (req.headers.accept || '').includes('text/html') ? req.url : undefined,
      },
      '/register': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/logout': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/verify-otp': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/forgot-password': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/reset-password': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/settings': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/farms': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/predict': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/monitoring': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/alerts': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/weather': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/agronomist': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/reports': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/notifications': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/auth': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/users': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/sensor': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/fertilizer': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/planted-crops': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/plant-crop': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/soil-monitoring': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
