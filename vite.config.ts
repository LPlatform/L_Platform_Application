import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tauriConf from './src-tauri/tauri.conf.json' with { type: 'json' };

export default defineConfig({
  plugins: [react()],
  // Local dev reads the single workspace-level .env (one folder up). CI uses real env vars.
  envDir: '..',
  // `pnpm preview` enforces the same Content-Security-Policy as the desktop app.
  preview: {
    port: 1420,
    headers: { 'Content-Security-Policy': tauriConf.app.security.csp },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
    exclude: ['tests/foundation.test.mjs', '**/node_modules/**', '**/dist/**'],
  },
});
