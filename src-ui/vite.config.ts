import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Use fallback logic since name is deprecated
          const fileName = (assetInfo as any).name || (assetInfo as any).names?.[0] || 'asset'
          if (/\.css$/.test(fileName)) {
            return 'static/css/[name].[hash].[ext]'
          }
          return 'assets/[name].[hash].[ext]'
        },
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React and related packages
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            // UI and styling libraries
            if (
              id.includes('lucide-react') ||
              id.includes('react-photoswipe-gallery') ||
              id.includes('@headlessui') ||
              id.includes('@heroicons')
            ) {
              return 'vendor-ui'
            }
            // Utilities
            if (
              id.includes('axios') ||
              id.includes('dompurify') ||
              id.includes('web-vitals') ||
              id.includes('swagger-ui-react') ||
              id.includes('@tanstack/react-query')
            ) {
              return 'vendor-utils'
            }
            // All other vendor modules
            return 'vendors'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
