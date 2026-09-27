import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* `npm run build:single` emits one self-contained HTML file that opens straight from disk;
   `npm run build:dream` does the same for the Blue Hour reel */
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' || mode === 'dream' ? [react(), viteSingleFile()] : [react()],
  build:
    mode === 'single'
      ? { outDir: 'dist-single' }
      : mode === 'dream'
        ? { outDir: 'dist-dream', rollupOptions: { input: 'dream.html' } }
        : { rollupOptions: { input: { main: 'index.html', dream: 'dream.html' } } },
}))
