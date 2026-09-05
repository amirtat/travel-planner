import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'מתכנן טיולים',
        short_name: 'טיולים',
        description: 'תכנון טיולים אישי',
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'he',
        dir: 'rtl',
        start_url: '/travel-planner/',
        scope: '/travel-planner/',
        icons: [
          { src: 'pwa-64x64.png',              sizes: '64x64',     type: 'image/png' },
          { src: 'pwa-192x192.png',            sizes: '192x192',   type: 'image/png' },
          { src: 'pwa-512x512.png',            sizes: '512x512',   type: 'image/png' },
          { src: 'maskable-icon-512x512.png',  sizes: '512x512',   type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  base: '/travel-planner/',
})
