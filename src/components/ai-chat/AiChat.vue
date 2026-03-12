<template>
  <div class="ai-chat-container">
    <!-- 头部 -->
    <div class="chat-header">
      <h1>AI 助手</h1>
      <div class="header-actions">
        <el-button size="small" @click="clearChat" :icon="Delete">清空对话</el-button>
        <el-button size="small" @click="showSettings = true" :icon="Setting">设置</el-button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesContainer" class="messages-container">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-avatar">
          <el-icon v-if="message.role === 'user'" :size="24"><User /></el-icon>
          <el-icon v-else :size="24" color="#409EFF"><ChatDotRound /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="renderMarkdown(message.content)"></div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <!-- AI 思考中 -->
      <div v-if="isAiThinking" class="message assistant">
        <div class="message-avatar">
          <el-icon :size="24" color="#409EFF"><ChatDotRound /></el-icon>
        </div>
        <div class="message-content">
          <div class="thinking-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <el-input
          ref="messageInput"
          v-model="inputMessage"
          type="textarea"
          :rows="1"
          :autosize="{ minRows: 1, maxRows: 6 }"
          placeholder="输入消息... (Enter 发送，Shift + Enter 换行)"
          @keydown="handleKeydown"
          :disabled="isAiThinking"
        />
        <el-button
          type="primary"
          :icon="Promotion"
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isAiThinking"
          class="send-button"
        >
          发送
        </el-button>
      </div>
      <div class="input-hint">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="聊天设置" width="400px">
      <el-form label-width="100px">
        <el-form-item label="模型">
          <el-select v-model="settings.model" placeholder="选择模型">
            <el-option label="GLM-4" value="glm-4" />
            <el-option label="GLM-4.7" value="glm-4.7" />
            <el-option label="GLM-5" value="glm-5" />
          </el-select>
        </el-form-item>
        <el-form-item label="温度">
          <el-slider v-model="settings.temperature" :min="0" :max="1" :step="0.1" show-input />
        </el-form-item>
        <el-form-item label="最大Token">
          <el-input-number v-model="settings.maxTokens" :min="100" :max="8000" :step="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, ChatDotRound, Delete, Setting, Promotion } from '@element-plus/icons-vue'
import { marked } from 'marked'

const messages = ref([])
const inputMessage = ref('')
const isAiThinking = ref(false)
const showSettings = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

// 设置
const settings = ref({
  model: 'glm-4.7',
  temperature: 0.7,
  maxTokens: 2000
})

// EventSource 用于流式接收
let eventSource = null

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isAiThinking.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  inputMessage.value = ''
  isAiThinking.value = true

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // 创建AI消息占位
    const aiMessageIndex = messages.value.push({
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }) - 1

    // 使用流式聊天
    await streamChat(message, aiMessageIndex)
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请重试')
    isAiThinking.value = false
  }
}

// 流式聊天
const streamChat = async (message, messageIndex) => {
  const url = `http://192.168.126.134:18888/api/llm/chat/stream?message=${encodeURIComponent(message)}`

  return new Promise((resolve, reject) => {
    eventSource = new EventSource(url)

    let fullContent = ''

    eventSource.onmessage = (event) => {
      try {
        const data = event.data

        // 检查是否是结束标记
        if (data === '[DONE]') {
          eventSource.close()
          isAiThinking.value = false
          resolve()
          return
        }

        // 解析 OpenAI SSE 格式
        if (data && data.startsWith('data: ')) {
          const jsonStr = data.substring(6).trim() // 移除 "data: " 前缀
          const jsonData = JSON.parse(jsonStr)

          // 提取 content
          if (jsonData.choices && jsonData.choices[0] && jsonData.choices[0].delta) {
            const delta = jsonData.choices[0].delta
            if (delta.content) {
              fullContent += delta.content
              messages.value[messageIndex].content = fullContent
              nextTick(() => scrollToBottom())
            }
          }
        }
      } catch (e) {
        console.error('解析 SSE 数据失败:', e, event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
      isAiThinking.value = false

      // 如果有内容就认为成功，否则报错
      if (fullContent) {
        resolve()
      } else {
        reject(error)
      }
    }

    eventSource.addEventListener('done', () => {
      eventSource.close()
      isAiThinking.value = false
      resolve()
    })
  })
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 处理键盘事件
const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 渲染 Markdown
const renderMarkdown = (text) => {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch (e) {
    return text
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 清空对话
const clearChat = () => {
  messages.value = []
  ElMessage.success('对话已清空')
}

// 保存设置
const saveSettings = () => {
  localStorage.setItem('ai-chat-settings', JSON.stringify(settings.value))
  showSettings.value = false
  ElMessage.success('设置已保存')
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('ai-chat-settings')
  if (saved) {
    try {
      Object.assign(settings.value, JSON.parse(saved))
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  }
}

// 清理资源
onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
})

onMounted(() => {
  loadSettings()
  // 欢迎消息
  messages.value.push({
    role: 'assistant',
    content: '你好！我是AI助手，有什么可以帮助你的吗？',
    timestamp: new Date()
  })
})
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  flex-shrink: 0;
}

.message.assistant .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message.assistant .message-avatar .el-icon {
  color: white;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-text {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.message-text :deep(p) {
  margin: 0 0 8px 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  padding: 0 4px;
}

.thinking-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  width: fit-content;
}

.thinking-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409EFF;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.input-container {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper :deep(.el-textarea) {
  flex: 1;
}

.input-wrapper :deep(.el-textarea__inner) {
  border-radius: 20px;
  padding: 10px 16px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
}

.send-button {
  border-radius: 20px;
  padding: 10px 24px;
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}
</style>
