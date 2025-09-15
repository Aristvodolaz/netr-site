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
      },
      '/downloadData': {
        target: 'http://10.171.12.36:3005',
        changeOrigin: true
      },
      '/uploadWPS': {
        target: 'http://10.171.12.36:3005',
        changeOrigin: true
      },
      '/hideTask': {
        target: 'http://10.171.12.36:3005',
        changeOrigin: true
      }
      
    }
  }
});
