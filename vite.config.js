import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    proxy: {
      '/api': {
        target: 'https://abdimu.iaimu.ac.id/api',
        changeOrigin: true,
        secure: true,
      },

      '/storage': {
        target: 'https://abdimu.iaimu.ac.id',
        changeOrigin: true,
        secure: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['react-hot-toast', 'axios'],
        },
      },
    },

    chunkSizeWarningLimit: 600,
  },
})