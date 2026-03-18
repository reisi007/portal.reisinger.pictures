import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4321,
    proxy: {
      '/api': {
        target: 'https://portal.test', 
        changeOrigin: true,
        secure: false, // Wichtig: Akzeptiert das lokale, selbstsignierte Zertifikat von Herd
      },
      // Wir müssen lokal auch die Fotos über Herd proxyen, 
      // damit im React-Dev-Server keine CORS-Fehler auftreten.
      '/photos': {
        target: 'https://portal.test', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
