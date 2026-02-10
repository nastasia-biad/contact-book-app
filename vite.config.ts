import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  base: '/ToDo-Список-контактов/',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      output: {
        manualChunks: {
          imask: ['imask']
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          
          const extType = assetInfo.name.split('.').pop()?.toLowerCase();
          
          if (extType === 'css') {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(extType || '')) {
            return 'assets/img/[name]-[hash][extname]';
          }
          
          if (['woff2', 'woff', 'ttf', 'otf'].includes(extType || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    }
  },
  optimizeDeps: {
    include: ['imask'],
    exclude: []
  }
});