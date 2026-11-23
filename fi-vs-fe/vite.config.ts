import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* Fi vs Fe lives beside The Two Worlds and shares its node_modules.
   `npm run build:fi:single` emits one self-contained HTML file that opens straight from disk. */
export default defineConfig(({ mode }) => ({
  root: 'fi-vs-fe', // scripts run from the repo root
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: mode === 'single' ? '../dist-fi-single' : '../dist-fi',
    emptyOutDir: true,
  },
}))
