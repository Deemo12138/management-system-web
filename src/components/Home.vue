<template>
  <div class="home-container">
    <div class="home-header">
      <div class="header-left">
        <h1 class="app-title">管理系统</h1>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="welcome-text">欢迎，{{ realName || username }} ({{ role }})</span>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>
    
    <div class="home-main">
      <div class="content-section">
        <h2 class="section-title">快捷入口</h2>
        <div class="quick-links">
          <div class="quick-link-card ai-chat" @click="goToAiChat">
            <div class="link-icon">🤖</div>
            <div class="link-content">
              <div class="link-title">AI 助手</div>
              <div class="link-desc">智能对话助手</div>
            </div>
            <div class="link-arrow">→</div>
          </div>
          <div class="quick-link-card poker-game" @click="goToPoker">
            <div class="link-icon">🃏</div>
            <div class="link-content">
              <div class="link-title">德州扑克</div>
              <div class="link-desc">与AI玩家一决高下</div>
            </div>
            <div class="link-arrow">→</div>
          </div>
          <div class="quick-link-card doudizhu-game" @click="goToDouDiZhu">
            <div class="link-icon">🃏</div>
            <div class="link-content">
              <div class="link-title">斗地主</div>
              <div class="link-desc">经典三人斗地主</div>
            </div>
            <div class="link-arrow">→</div>
          </div>
          <div class="quick-link-card map-marker" @click="goToMap">
            <div class="link-icon">📍</div>
            <div class="link-content">
              <div class="link-title">地图标注</div>
              <div class="link-desc">在地图上标记和管理地点</div>
            </div>
            <div class="link-arrow">→</div>
          </div>
        </div>
      </div>

      <div class="content-section">
        <h2 class="section-title">系统概览</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">1,234</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">56</div>
              <div class="stat-label">今日活跃</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-number">234</div>
              <div class="stat-label">待处理任务</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-number">98%</div>
              <div class="stat-label">完成率</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h2 class="section-title">最近活动</h2>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-time">2026-01-05 14:30</div>
            <div class="activity-content">用户admin登录系统</div>
          </div>
          <div class="activity-item">
            <div class="activity-time">2026-01-05 13:15</div>
            <div class="activity-content">创建了新用户test123</div>
          </div>
          <div class="activity-item">
            <div class="activity-time">2026-01-05 11:20</div>
            <div class="activity-content">修改了系统配置</div>
          </div>
          <div class="activity-item">
            <div class="activity-time">2026-01-05 10:05</div>
            <div class="activity-content">导出了用户数据</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { checkToken } from '@/api/login'

const router = useRouter()
const username = ref('')
const realName = ref('')
const role = ref('')

// 组件挂载时验证token
onMounted(async () => {
  const token = localStorage.getItem('token')
  const storedUsername = localStorage.getItem('username')
  
  if (!token || !storedUsername) {
    clearUserData()
    router.push('/login')
    return
  }

  try {
    const response = await checkToken(token)
    if (response.code === 200 || response.success) {
      username.value = storedUsername
      realName.value = localStorage.getItem('realName') || ''
      role.value = localStorage.getItem('role') || ''
    } else {
      clearUserData()
      router.push('/login')
    }
  } catch (err) {
    clearUserData()
    router.push('/login')
  }
})

const clearUserData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('userId')
  localStorage.removeItem('realName')
  localStorage.removeItem('role')
}

// 退出登录
const handleLogout = () => {
  clearUserData()
  router.push('/login')
}

// 进入AI聊天
const goToAiChat = () => {
  router.push('/ai-chat')
}

// 进入德州扑克游戏
const goToPoker = () => {
  router.push('/poker')
}

// 进入斗地主游戏
const goToDouDiZhu = () => {
  router.push('/doudizhu')
}

// 进入地图标注
const goToMap = () => {
  router.push('/map')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.home-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-text {
  font-size: 14px;
  color: #606266;
}

.logout-btn {
  background-color: #f56c6c;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #f78989;
}

.home-main {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.content-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 20px 0;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  color: white;
}

.quick-link-card.poker-game {
  background: linear-gradient(135deg, #1a5f3c 0%, #2d7a4a 100%);
}

.quick-link-card.ai-chat {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.quick-link-card.map-marker {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.quick-link-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.link-icon {
  font-size: 40px;
}

.link-content {
  flex: 1;
}

.link-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.link-desc {
  font-size: 14px;
  opacity: 0.9;
}

.link-arrow {
  font-size: 24px;
  opacity: 0.8;
  transition: transform 0.3s;
}

.quick-link-card:hover .link-arrow {
  transform: translateX(5px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 40px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.activity-item:hover {
  background-color: #f5f7fa;
}

.activity-time {
  font-size: 14px;
  color: #909399;
  min-width: 150px;
}

.activity-content {
  font-size: 14px;
  color: #303133;
  flex: 1;
  margin-left: 20px;
}

/* PC 端样式 - 平板及以上 */
@media (min-width: 768px) {
  .home-main {
    max-width: 1400px !important;
    padding: 30px 40px;
  }

  .home-header {
    height: 70px !important;
    padding: 0 40px !important;
  }

  .app-title {
    font-size: 24px !important;
  }

  .content-section {
    padding: 30px !important;
    margin-bottom: 30px !important;
  }

  .section-title {
    font-size: 20px !important;
  }

  .quick-links {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (min-width: 1024px) {
  .quick-links {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

@media (min-width: 1440px) {
  .home-main {
    max-width: 1600px !important;
  }
}
</style>