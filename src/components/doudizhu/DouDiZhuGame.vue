<template>
  <div class="doudizhu-container">
    <!-- 游戏创建面板 -->
    <div v-if="!gameId" class="game-setup">
      <h2>斗地主</h2>
      <el-form :model="setupForm" label-width="120px">
        <el-form-item label="玩家名称">
          <el-input v-model="setupForm.playerName" placeholder="请输入您的名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createGame" :loading="loading">创建游戏</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 游戏主界面 -->
    <div v-else class="game-area">
      <!-- 游戏信息栏 -->
      <div class="game-info">
        <el-tag>房间号: {{ roomNumber }}</el-tag>
        <el-tag type="info">状态: {{ statusText }}</el-tag>
        <el-tag v-if="gameState?.landlordPosition !== null" type="warning">
          地主: {{ getPlayerName(gameState.landlordPosition ?? -1) }}
        </el-tag>
        <el-tag v-if="gameState?.baseScore > 0" type="success">
          倍数: {{ gameState?.finalMultiplier || 1 }}
        </el-tag>
        <el-button v-if="gameState?.status === 3" type="primary" size="small" @click="createGame">
          新游戏
        </el-button>
      </div>

      <!-- 牌桌区域 -->
      <div class="doudizhu-table">
        <!-- 地主底牌 -->
        <div v-if="gameState?.landlordCards?.length > 0" class="landlord-cards">
          <span class="label">地主底牌:</span>
          <div class="cards">
            <doudizhu-card
              v-for="(card, index) in gameState.landlordCards"
              :key="`landlord-${index}`"
              :card="card"
            />
          </div>
        </div>

        <!-- 上一手牌 -->
        <div v-if="lastPlayedCards && lastPlayedCards.length > 0" class="last-played">
          <span class="label">{{ getPlayerName(lastPlayerPosition) }} 出牌:</span>
          <div class="cards">
            <doudizhu-card
              v-for="(card, index) in lastPlayedCards"
              :key="`last-${index}`"
              :card="card"
            />
          </div>
          <span class="card-type">{{ lastCardType }}</span>
        </div>

        <!-- 玩家座位 -->
        <div class="players-wrapper">
          <div
            v-for="player in sortedPlayers"
            :key="player.position"
            :class="[
              'player-seat',
              { active: player.position === gameState?.currentPlayerPosition },
              { landlord: player.isLandlord }
            ]"
          >
            <doudizhu-player-seat
              :player="player"
              :showCards="shouldShowCards(player)"
              :isCurrent="player.position === gameState?.currentPlayerPosition"
            />
          </div>
        </div>
      </div>

      <!-- 叫地主面板 -->
      <div class="bid-panel" v-if="canBid">
        <div class="bid-title">请选择叫分</div>
        <div class="bid-buttons">
          <el-button
            v-for="score in availableBids"
            :key="score"
            :type="score === 3 ? 'danger' : 'primary'"
            :disabled="!canBidScore(score)"
            @click="handleBid(score)"
          >
            {{ score === 0 ? '不叫' : score + '分' }}
          </el-button>
        </div>
        <div v-if="mustBid" class="must-bid-notify">
          <el-icon color="#f56c6c"><Warning /></el-icon>
          您的手牌含有大小王或四张2，必须叫分！
        </div>
      </div>

      <!-- 出牌面板 -->
      <div class="play-panel" v-if="canPlay">
        <div class="selected-cards" v-if="selectedCards.length > 0">
          <span class="label">已选择:</span>
          <div class="cards">
            <doudizhu-card
              v-for="(card, index) in selectedCards"
              :key="`selected-${index}`"
              :card="card"
              :selected="true"
              @click="toggleCardSelection(card)"
            />
          </div>
        </div>
        <div class="play-buttons">
          <el-button @click="handlePass" :disabled="cannotPass">不出</el-button>
          <el-button
            type="primary"
            @click="handlePlay"
            :disabled="selectedCards.length === 0"
          >
            出牌
          </el-button>
          <el-button @click="clearSelection">清空</el-button>
        </div>
      </div>

      <!-- 游戏开始按钮 -->
      <div class="start-panel" v-if="gameState?.status === 0">
        <el-button type="primary" size="large" @click="startGame">开始游戏</el-button>
      </div>

      <!-- AI操作提示 -->
      <div class="ai-thinking" v-if="isAiTurn">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 思考中...</span>
      </div>

      <!-- 游戏结束提示 -->
      <div v-if="gameState?.status === 3" class="game-over-modal">
        <el-dialog v-model="showGameOver" title="游戏结束" width="400px" :close-on-click-modal="false">
          <div class="result-content">
            <h3>{{ winnerText }}</h3>
            <div v-for="player in sortedPlayers" :key="player.position" class="player-result">
              <span>{{ player.playerName }}:</span>
              <span :class="{ positive: player.scoreChange > 0, negative: player.scoreChange < 0 }">
                {{ player.scoreChange > 0 ? '+' : '' }}{{ player.scoreChange }}
              </span>
            </div>
          </div>
          <template #footer>
            <el-button type="primary" @click="createGame">再来一局</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import DouDiZhuCard from './DouDiZhuCard.vue'
import DouDiZhuPlayerSeat from './DouDiZhuPlayerSeat.vue'
import { createGame as apiCreateGame, getGameStatus } from '@/api/doudizhu'

const setupForm = ref({
  playerName: localStorage.getItem('username') || '玩家'
})

const loading = ref(false)
const gameId = ref(null)
const roomNumber = ref('')
const gameState = ref(null)
const ws = ref(null)
const selectedCards = ref([])
const showGameOver = ref(false)

// 可用叫分
const availableBids = computed(() => {
  const currentBid = gameState.value?.currentBid || 0
  const bids = [0]
  for (let i = currentBid + 1; i <= 3; i++) {
    bids.push(i)
  }
  return bids
})

// 排序后的玩家列表
const sortedPlayers = computed(() => {
  if (!gameState.value?.players) return []
  return [...gameState.value.players].sort((a, b) => a.position - b.position)
})

// 状态文本
const statusText = computed(() => {
  const statusMap = ['等待中', '叫地主中', '进行中', '已结束']
  return statusMap[gameState.value?.status] || '未知'
})

// 获胜文本
const winnerText = computed(() => {
  if (gameState.value?.winnerCamp === 0) {
    return '地主获胜！'
  } else if (gameState.value?.winnerCamp === 1) {
    return '农民获胜！'
  }
  return '游戏结束'
})

// 上一手牌
const lastPlayedCards = computed(() => gameState.value?.lastPlayedCards || [])
const lastCardType = computed(() => gameState.value?.lastCardType || '')
const lastPlayerPosition = computed(() => gameState.value?.lastPlayerPosition)

// 真实玩家
const humanPlayer = computed(() => sortedPlayers.value.find(p => !p.isAi))

// 是否可以叫分
const canBid = computed(() => {
  return gameState.value?.status === 1 &&
         humanPlayer.value?.position === gameState.value?.currentPlayerPosition
})

// 是否必须叫分
const mustBid = computed(() => {
  if (!canBid.value || !humanPlayer.value?.handCards) return false
  const handCards = humanPlayer.value.handCards
  // 检查是否有大小王
  const hasJoker = handCards.some(c => c === 'joker_big' || c === 'joker_small')
  // 检查是否有四张2
  const twoCount = handCards.filter(c => c.endsWith('_2')).length
  return hasJoker || twoCount >= 4
})

// 是否可以出牌
const canPlay = computed(() => {
  return gameState.value?.status === 2 &&
         humanPlayer.value?.position === gameState.value?.currentPlayerPosition
})

// 是否不能出牌（必须出牌）
const cannotPass = computed(() => {
  return lastPlayerPosition.value === -1 ||
         lastPlayerPosition.value === humanPlayer.value?.position
})

// 是否AI回合
const isAiTurn = computed(() => {
  const currentPlayerPos = gameState.value?.currentPlayerPosition
  return currentPlayerPos !== null &&
         sortedPlayers.value.find(p => p.position === currentPlayerPos)?.isAi
})

// 获取玩家名称
const getPlayerName = (position) => {
  const player = sortedPlayers.value.find(p => p.position === position)
  return player?.playerName || ''
}

// 是否显示手牌
const shouldShowCards = (player) => {
  // 总是显示自己的手牌
  if (!player.isAi) return true
  // 地主显示所有牌
  if (gameState.value?.status === 3) return true
  return false
}

// 是否可以叫某个分
const canBidScore = (score) => {
  if (mustBid.value && score === 0) return false
  return true
}

// 创建游戏
const createGame = async () => {
  try {
    loading.value = true
    const response = await apiCreateGame({
      userId: 1, // 从token获取
      playerName: setupForm.value.playerName
    })
    console.log('创建游戏完整响应:', JSON.stringify(response))
    console.log('响应类型:', typeof response)
    console.log('response.data:', response.data)
    console.log('response.data?.gameId:', response.data?.gameId)

    // 尝试从响应中提取 gameId 和 roomNumber
    let gid = null
    let rnum = ''

    if (response && typeof response === 'object') {
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // 响应格式: { data: { gameId: xxx, roomNumber: xxx } }
        const dataGameId = response.data.gameId
        if (typeof dataGameId === 'number') {
          gid = dataGameId
          rnum = response.data.roomNumber || ''
          console.log('从 response.data.gameId 提取')
        } else {
          console.warn('response.data.gameId 不是数字:', dataGameId, '类型:', typeof dataGameId)
        }
      } else if (typeof response.gameId === 'number') {
        // 响应格式: { gameId: xxx, roomNumber: xxx }
        gid = response.gameId
        rnum = response.roomNumber || ''
        console.log('从 response.gameId 提取')
      } else if (typeof response.data === 'number') {
        // 响应格式: { data: 123 } (德州扑克格式)
        gid = response.data
        console.log('从 response.data (number) 提取')
      }
    }

    console.log('最终提取的 gameId:', gid, '类型:', typeof gid)
    console.log('最终提取的 roomNumber:', rnum)

    // 确保 gid 是数字
    if (typeof gid === 'number' && gid > 0) {
      gameId.value = gid
      roomNumber.value = rnum
      console.log('设置 gameId.value =', gameId.value, '类型:', typeof gameId.value)
      connectWebSocket()
    } else {
      throw new Error('无法从响应中获取游戏ID，gid = ' + JSON.stringify(gid))
    }
  } catch (error) {
    console.error('创建游戏失败:', error)
    ElMessage.error(error.message || '创建游戏失败')
  } finally {
    loading.value = false
  }
}

// 开始游戏
const startGame = async () => {
  if (ws.value) {
    ws.value.send(JSON.stringify({
      action: 'startGame',
      gameId: gameId.value
    }))
  }
}

// 叫分
const handleBid = (score) => {
  if (ws.value) {
    ws.value.send(JSON.stringify({
      action: 'callBid',
      gameId: gameId.value,
      playerPosition: humanPlayer.value.position,
      bidScore: score
    }))
    selectedCards.value = []
  }
}

// 切换牌的选择状态
const toggleCardSelection = (card) => {
  const index = selectedCards.value.findIndex(c => c === card)
  if (index >= 0) {
    selectedCards.value.splice(index, 1)
  } else {
    selectedCards.value.push(card)
  }
}

// 清空选择
const clearSelection = () => {
  selectedCards.value = []
}

// 出牌
const handlePlay = () => {
  if (ws.value && selectedCards.value.length > 0) {
    ws.value.send(JSON.stringify({
      action: 'playCards',
      gameId: gameId.value,
      playerPosition: humanPlayer.value.position,
      cards: selectedCards.value
    }))
    selectedCards.value = []
  }
}

// 不出
const handlePass = () => {
  if (ws.value) {
    ws.value.send(JSON.stringify({
      action: 'pass',
      gameId: gameId.value,
      playerPosition: humanPlayer.value.position
    }))
  }
}

// 连接WebSocket
const connectWebSocket = () => {
  console.log('准备连接 WebSocket，gameId.value:', gameId.value, '类型:', typeof gameId.value)

  if (typeof gameId.value !== 'number') {
    console.error('gameId.value 不是数字:', gameId.value)
    ElMessage.error('游戏ID格式错误，请重新创建游戏')
    return
  }

  const wsUrl = `ws://localhost:5173/ws/doudizhu/${gameId.value}`
  console.log('WebSocket URL:', wsUrl)

  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = () => {
    console.log('WebSocket连接成功')
  }

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log('收到 WebSocket 消息:', data)
      if (data.type === 'error') {
        ElMessage.error(data.message)
      } else {
        gameState.value = data
        console.log('更新 gameState:', gameState.value)
        if (data.status === 3) {
          showGameOver.value = true
        }
      }
    } catch (e) {
      console.error('解析消息失败', e)
    }
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket错误', error)
    ElMessage.error('连接失败，请刷新重试')
  }

  ws.value.onclose = () => {
    console.log('WebSocket连接关闭')
  }
}

onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
})
</script>

<style scoped>
.doudizhu-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a5f3f 0%, #0d3d2a 100%);
  padding: 20px;
}

.game-setup {
  max-width: 500px;
  margin: 100px auto;
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.game-setup h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #1a5f3f;
}

.game-area {
  max-width: 1200px;
  margin: 0 auto;
}

.game-info {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.doudizhu-table {
  position: relative;
  background: radial-gradient(ellipse at center, #2d7a50 0%, #1a5f3f 70%);
  border: 8px solid #8b4513;
  border-radius: 200px;
  min-height: 500px;
  padding: 40px;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.3);
}

.landlord-cards,
.last-played {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.last-played {
  top: 120px;
}

.label {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
}

.cards {
  display: flex;
  gap: 5px;
}

.card-type {
  color: #ffd700;
  font-size: 16px;
  font-weight: bold;
}

.players-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 150px;
  min-height: 200px;
}

.player-seat {
  transition: all 0.3s;
}

.player-seat.active {
  transform: scale(1.1);
}

.player-seat.landlord::before {
  content: '地主';
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffd700;
  color: #8b4513;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.bid-panel,
.play-panel {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.bid-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
}

.bid-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.must-bid-notify {
  margin-top: 10px;
  color: #f56c6c;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.selected-cards {
  margin-bottom: 15px;
}

.play-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.start-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ai-thinking {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 30px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-content h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
}

.player-result {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}
</style>
