<template>
  <div class="captcha-container">
    <canvas
      ref="captchaCanvas"
      :width="width"
      :height="height"
      @click="refreshCaptcha"
      class="captcha-canvas"
    ></canvas>
    <button @click="refreshCaptcha" class="refresh-btn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  width: {
    type: Number,
    default: 120
  },
  height: {
    type: Number,
    default: 40
  },
  length: {
    type: Number,
    default: 4
  }
})

const emit = defineEmits(['update:code'])
const captchaCanvas = ref(null)
let captchaCode = ''

// 生成验证码
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < props.length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode = code
  emit('update:code', code)
  drawCaptcha()
}

// 绘制验证码
const drawCaptcha = () => {
  const canvas = captchaCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  // 清空画布
  ctx.clearRect(0, 0, props.width, props.height)
  
  // 绘制背景
  ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.1)`
  ctx.fillRect(0, 0, props.width, props.height)
  
  // 绘制验证码文字
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 每个字符不同颜色和倾斜角度
  for (let i = 0; i < captchaCode.length; i++) {
    const char = captchaCode[i]
    const x = (props.width / captchaCode.length) * i + props.width / (captchaCode.length * 2)
    const y = props.height / 2
    
    // 随机颜色
    const r = Math.floor(Math.random() * 100) + 50
    const g = Math.floor(Math.random() * 100) + 50
    const b = Math.floor(Math.random() * 100) + 50
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    
    // 随机倾斜角度
    const angle = (Math.random() - 0.5) * 0.4
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  }
  
  // 绘制干扰线
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.3)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * props.width, Math.random() * props.height)
    ctx.lineTo(Math.random() * props.width, Math.random() * props.height)
    ctx.stroke()
  }
  
  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`
    ctx.beginPath()
    ctx.arc(Math.random() * props.width, Math.random() * props.height, 1, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  generateCaptcha()
}

onMounted(() => {
  generateCaptcha()
})

// 暴露验证方法
const validate = (inputCode) => {
  return inputCode.toLowerCase() === captchaCode.toLowerCase()
}

defineExpose({
  validate,
  refreshCaptcha
})
</script>

<style scoped>
.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-canvas {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
}

.captcha-canvas:hover {
  border-color: #3b82f6;
}

.refresh-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6b7280;
}

.refresh-btn:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
  color: #3b82f6;
}

.refresh-btn svg {
  width: 20px;
  height: 20px;
}
</style>
