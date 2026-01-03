<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">管理系统</h2>
        <p class="login-subtitle">欢迎登录</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            type="text"
            id="username"
            v-model="loginForm.username"
            class="form-input"
            placeholder="请输入用户名"
            required
            autofocus
          />
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            type="password"
            id="password"
            v-model="loginForm.password"
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="captcha" class="form-label">验证码</label>
          <div class="captcha-group">
            <input
              type="text"
              id="captcha"
              v-model="loginForm.captcha"
              class="form-input captcha-input"
              placeholder="请输入验证码"
              required
              maxlength="4"
              minlength="4"
            />
            <Captcha
              ref="captchaRef"
              @update:code="handleCaptchaUpdate"
              class="captcha-component"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="loginForm.remember" class="checkbox-input" />
            <span class="checkbox-text">记住我</span>
          </label>
        </div>
        
        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
      
      <div class="login-footer">
        <a href="#" class="forgot-password">忘记密码？</a>
        <span class="divider">|</span>
        <router-link to="/register" class="register-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Captcha from './Captcha.vue'
import { login } from '@/api/login'
import { encryptPassword, generateRandomSalt } from '@/utils/crypto'

const captchaRef = ref(null)
const loading = ref(false)
const error = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false
})

const handleCaptchaUpdate = (code) => {
  console.log('验证码更新:', code)
}

const handleLogin = async () => {
  // 重置错误信息
  error.value = ''
  
  // 验证验证码
  if (!captchaRef.value?.validate(loginForm.captcha)) {
    error.value = '验证码错误，请重新输入'
    captchaRef.value?.refreshCaptcha()
    loginForm.captcha = ''
    return
  }
  
  loading.value = true
  
  try {
    // 步骤1: 生成随机盐（每次登录生成新的）
    const random_salt = generateRandomSalt()
    
    // 步骤2-4: 使用与注册相同的加密方法
    const front_pwd_hash = encryptPassword(loginForm.password, random_salt)
    
    // 调用登录接口
    const response = await login({
      username: loginForm.username,
      front_pwd_hash: front_pwd_hash,
      random_salt: random_salt,
      captcha: loginForm.captcha
    })
    
    // 登录成功后的处理
    console.log('登录成功:', response)
    
    // 保存 token 到本地存储
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token)
    }
    
    // 记住密码（可选）
    if (loginForm.remember) {
      localStorage.setItem('username', loginForm.username)
    } else {
      localStorage.removeItem('username')
    }
    
    // 这里可以添加路由跳转逻辑
    console.log('跳转到首页')
    
  } catch (err) {
    error.value = err.message || '登录失败，请稍后重试'
    captchaRef.value?.refreshCaptcha()
    loginForm.captcha = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.login-form {
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

.captcha-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-component {
  flex-shrink: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
}

.login-button {
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

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
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

.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.forgot-password,
.register-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.forgot-password:hover,
.register-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.divider {
  color: #d1d5db;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .captcha-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .captcha-input {
    width: 100%;
  }
  
  .captcha-component {
    align-self: flex-start;
  }
}
</style>
