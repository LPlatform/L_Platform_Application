import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Local dev reads the single workspace-level .env (one folder up). CI uses real env vars.
  envDir: '..',
  server: {
    port: 1420,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
    exclude: ['tests/foundation.test.mjs', '**/node_modules/**', '**/dist/**'],
  },
});
