import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Register from '@/components/Register.vue'
import Home from '@/components/Home.vue'
import TexasPoker from '@/components/poker/TexasPoker.vue'
import DouDiZhuGame from '@/components/doudizhu/DouDiZhuGame.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router