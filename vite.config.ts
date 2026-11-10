delete process.env.ELECTRON_RUN_AS_NODE;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: [
                'electron',
                'path',
                'fs',
                'fs/promises',
                'child_process',
                'crypto',
                'http',
                'https',
                'url',
                'os',
                'stream',
                'electron-updater',
              ],
            },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src/renderer/src'),
    },
  },
  build: {
    target: ['chrome66', 'es2018'],
  },
  server: {
    port: 5173,
  },
});
