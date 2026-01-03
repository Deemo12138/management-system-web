import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  root: __dirname,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    modules: ['node_modules'],
    preserveSymlinks: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1884',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    fs: {
      allow: ['..']
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus', 'axios', 'crypto-js'],
    esbuildOptions: {
      target: 'es2020'
    }
  }
})
