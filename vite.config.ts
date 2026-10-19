import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssMinify: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('/node_modules/firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('jspdf') || id.includes('xlsx') || id.includes('pptxgenjs') || id.includes('html2canvas')) {
              return 'vendor-pdf-excel';
            }
            if (id.includes('lucide-react') || id.includes('sweetalert2') || id.includes('canvas-confetti') || id.includes('motion') || id.includes('recharts')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
});
