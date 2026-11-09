import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base relative : le site marche sur https://<user>.github.io/<repo>/ quel que soit le nom du repo.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
