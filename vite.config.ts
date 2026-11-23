import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* `npm run build:single` emits one self-contained HTML file that opens straight from disk;
   `npm run build:dream` and `npm run build:neon` do the same for the two reels (their skies,
   models and score stay alongside, in dream-assets/) */
const reels: Record<string, string> = { dream: 'dream.html', neon: 'neon.html' }

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' || mode in reels ? [react(), viteSingleFile()] : [react()],
  build:
    mode === 'single'
      ? { outDir: 'dist-single' }
      : mode in reels
        ? { outDir: `dist-${mode}`, rollupOptions: { input: reels[mode] } }
        : { rollupOptions: { input: { main: 'index.html', dream: 'dream.html', neon: 'neon.html' } } },
}))
