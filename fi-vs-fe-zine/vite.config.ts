import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* The Fi vs Fe zine shares the repo's node_modules. Scripts run from the repo root.
   `npm run build:zine:single` emits one self-contained HTML file. */
export default defineConfig(({ mode }) => ({
  root: 'fi-vs-fe-zine',
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: mode === 'single' ? '../dist-zine-single' : '../dist-zine',
    emptyOutDir: true,
  },
}))
