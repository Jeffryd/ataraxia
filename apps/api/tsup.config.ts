import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  noExternal: ['@ataraxia/shared'],
  sourcemap: true,
});
