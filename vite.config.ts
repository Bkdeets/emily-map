import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // mapbox-gl alone is ~1.8 MB; it's cached after the first load.
  build: { chunkSizeWarningLimit: 2500 },
})
