import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        devOptions: {
          enabled: false,
        },
        includeAssets: ['icon-192.png', 'icon-512.png', 'favicon.ico', 'robots.txt'],
        manifest: {
          name: 'LivePad - Real-Time Collaborative Workspace',
          short_name: 'LivePad',
          description: 'A real-time collaborative online notepad with instant sync, presence indicators, anonymous auth, and document export features.',
          theme_color: '#0f172a',
          background_color: '#09090b',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'browser'],
          start_url: '/',
          scope: '/',
          orientation: 'any',
          categories: ['productivity', 'utilities', 'developer'],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'New Collaborative Workspace',
              short_name: 'New Room',
              description: 'Create a new real-time collaborative workspace',
              url: '/?action=new',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            },
            {
              name: 'Quick Scratchpad',
              short_name: 'Scratchpad',
              description: 'Open instant local notepad',
              url: '/?action=scratchpad',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2,ico,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-apis',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                },
                networkTimeoutSeconds: 5
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('@tiptap')) {
                return 'tiptap-vendor';
              }
              if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
                return 'monaco-vendor';
              }
              if (id.includes('docx') || id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfmake')) {
                return 'export-vendor';
              }
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
