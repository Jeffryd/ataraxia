import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/ataraxia/' : '/',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 650 },
}));
