import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/src/**/*.test.{ts,tsx}'],
    setupFiles: ['./test-setup.ts'],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@ataraxia/shared': new URL(
        './packages/shared/src/index.ts',
        import.meta.url,
      ).pathname.replace(/^\/(\w:)/, '$1'),
    },
  },
});
