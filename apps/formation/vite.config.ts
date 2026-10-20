import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Racine du dépôt : les cours (docs/**/*.md) sont embarqués au build via import.meta.glob
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    fs: { allow: [repoRoot] },
    watch: { usePolling: true },
    proxy: {
      // En dev, le serveur Node (auth formateur) tourne sur le port 3001
      '/api/formateur': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
