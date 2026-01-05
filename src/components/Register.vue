<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2 class="register-title">用户注册</h2>
        <p class="register-subtitle">欢迎注册管理系统</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            type="text"
            id="username"
            v-model="registerForm.username"
            class="form-input"
            placeholder="请输入用户名"
            required
            autofocus
          />
        </div>
        
        <div class="form-group">
          <label for="real_name" class="form-label">真实姓名</label>
          <input
            type="text"
            id="real_name"
            v-model="registerForm.real_name"
            class="form-input"
            placeholder="请输入真实姓名"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="phone" class="form-label">手机号码</label>
          <input
            type="tel"
            id="phone"
            v-model="registerForm.phone"
            class="form-input"
            placeholder="请输入手机号码"
            required
            maxlength="11"
            minlength="11"
          />
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            type="password"
            id="password"
            v-model="registerForm.password"
            class="form-input"
            placeholder="请输入密码"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label for="confirm_password" class="form-label">确认密码</label>
          <input
            type="password"
            id="confirm_password"
            v-model="registerForm.confirm_password"
            class="form-input"
            placeholder="请再次输入密码"
            required
            minlength="6"
          />
        </div>
        
        <button type="submit" class="register-button" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
      
      <div class="register-footer">
        <span class="login-link">已有账号？</span>
        <router-link to="/login" class="login-button-text">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { registerUser } from '@/api/register'
import { encryptPassword, generateRandomSalt } from '@/utils/crypto'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const registerForm = reactive({
  username: '',
  real_name: '',
  phone: '',
  password: '',
  confirm_password: ''
})

const handleRegister = async () => {
  // 重置错误信息
  error.value = ''
  
  // 验证密码一致性
  if (registerForm.password !== registerForm.confirm_password) {
    error.value = '两次输入的密码不一致，请重新输入'
    return
  }
  
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(registerForm.phone)) {
    error.value = '请输入有效的手机号码'
    return
  }
  
  loading.value = true
  
  try {
    // 直接使用密码进行加密，不生成随机盐
    const front_pwd_hash = encryptPassword(registerForm.password, '')
    
    // 发送注册请求
    const response = await registerUser({
      username: registerForm.username,
      real_name: registerForm.real_name,
      phone: registerForm.phone,
      front_pwd_hash: front_pwd_hash
    })
    
    // 注册成功后的处理
    console.log('注册成功:', response)
    
    // 显示成功提示
    ElMessage({
      message: '注册成功，即将跳转到登录页面',
      type: 'success',
      duration: 3 * 1000,
    })
    
    // 跳转到登录页面
    setTimeout(() => {
      router.push('/login')
    }, 1500)
    
  } catch (err) {
    error.value = err.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(10px);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.register-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.register-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background-color: #fff;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.register-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 16px;
  border: 1px solid #fecaca;
}

.register-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.login-link {
  font-weight: 400;
}

.login-button-text {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.login-button-text:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .register-card {
    padding: 32px 24px;
  }
  
  .register-title {
    font-size: 24px;
  }
}
</style>