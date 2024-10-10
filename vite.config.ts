import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: 'build',
      sourcemap: true,
      rollupOptions: {
        output: {
          sourcemapExcludeSources: true // Ignore sources in node_modules
        }
      }
    },
    server: {
      port: 3000,
      open: true
    },
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: mode === 'production'
        }
      })
    ],
    define:
      mode === 'development'
        ? {
            global: {}
          }
        : undefined,
    resolve: {
      alias: {
        '~app': path.resolve('./src/app'),
        '~lib': path.resolve('./src/lib'),
        '~root': path.resolve('./src'),
        '~images': path.resolve('./src/images'),
        '~redux': path.resolve('./src/redux/*'),
        jsbi: path.resolve(__dirname, '.', 'node_modules', 'jsbi', 'dist', 'jsbi-cjs.js')
      }
    }
  };
});
