import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'

// 高德地图安全密钥配置
window._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_KEY
}

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
