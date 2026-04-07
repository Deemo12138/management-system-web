import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Register from '@/components/Register.vue'
import Home from '@/components/Home.vue'
import TexasPoker from '@/components/poker/TexasPoker.vue'
import DouDiZhuGame from '@/components/doudizhu/DouDiZhuGame.vue'
import AiChat from '@/components/ai-chat/AiChat.vue'
import MapMarker from '@/components/map/MapMarker.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/poker',
    name: 'TexasPoker',
    component: TexasPoker
  },
  {
    path: '/doudizhu',
    name: 'DouDiZhu',
    component: DouDiZhuGame
  },
  {
    path: '/ai-chat',
    name: 'AiChat',
    component: AiChat
  },
  {
    path: '/map',
    name: 'MapMarker',
    component: MapMarker
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 白名单：不需要登录即可访问的路径
const whiteList = ['/login', '/register']

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (token) {
    next()
  } else if (whiteList.includes(to.path)) {
    next()
  } else {
    next('/login')
  }
})

export default router