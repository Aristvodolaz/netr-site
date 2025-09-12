import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3012,
    host: true, // Allow external connections
    proxy: {
      '/api': {
        target: 'http://10.171.12.36:3005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
