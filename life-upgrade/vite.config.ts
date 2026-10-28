/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* `npm run build:single` emits one self-contained HTML file that opens straight from disk */
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), tailwindcss(), viteSingleFile()] : [react(), tailwindcss()],
  build: mode === 'single' ? { outDir: 'dist-single' } : undefined,
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
}))
