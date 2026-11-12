import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
  ],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['@jsquash/jpeg', '@jsquash/png', '@jsquash/oxipng', '@jsquash/webp', '@jsquash/avif']
  },
  build: {
    minify: 'esbuild', // Minifies JS using esbuild (Vite's default and fastest option)
    cssMinify: 'esbuild', // Minifies CSS
    sourcemap: false // Ensure sourcemaps are false if you don't want them in production
  }
})
