import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, __dirname, 'VITE_');
  
  console.log('当前环境:', mode);
  console.log('加载的环境变量:');
  console.log('VITE_API_BASE_URL:', env.VITE_API_BASE_URL);
  console.log('VITE_FRONT_FIXED_SALT:', env.VITE_FRONT_FIXED_SALT);
  
  return {
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
          target: env.VITE_API_BASE_URL || 'http://localhost:1884',
          changeOrigin: true
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
  }
})
