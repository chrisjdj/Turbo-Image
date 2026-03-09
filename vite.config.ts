import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Turbo-Image/',
  plugins: [react()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['@jsquash/jpeg', '@jsquash/png', '@jsquash/webp', '@jsquash/avif']
  }
})
