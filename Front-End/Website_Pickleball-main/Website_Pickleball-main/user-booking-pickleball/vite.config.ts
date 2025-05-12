import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import viteSvgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @import "./src/assets/styles/variable";
        @import "./src/assets/styles/mixin";
        `
      }
    }
  },
  plugins: [react(), eslintPlugin(), viteSvgr(), tsconfigPaths(), EnvironmentPlugin('all', { prefix: '' })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3001
  }
});
