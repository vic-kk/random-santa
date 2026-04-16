// https://vite.dev/config/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true, 
  },
  base: './',
  build: {
    outDir: 'docs',
    target: 'es2025',

    rolldownOptions: {
      output: {
        comments: false,
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true, 
          },
        },

        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        
        // Функциональный manualChunks — лучший способ в Vite 8
        manualChunks(id: string) {
          // Выносим react, react-dom и сопутствующие пакеты в отдельный чанк 'vendor-react'
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // Опционально: все остальные тяжелые библиотеки в 'vendor-others'
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }
        },
      }
    },
    
    chunkSizeWarningLimit: 1000,
  },
});