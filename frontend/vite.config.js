import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': 'http://localhost:2345'
    }
  },
  build: {
    outDir: 'build',
  }
})