<template>
  <div class="texas-poker-container">
    <!-- 游戏创建面板 -->
    <div v-if="!gameId" class="game-setup">
      <h2>德州扑克</h2>
      <el-form :model="setupForm" label-width="120px">
        <el-form-item label="AI玩家数量">
          <el-slider v-model="setupForm.aiPlayerCount" :min="1" :max="5" show-input />
        </el-form-item>
        <el-form-item label="初始筹码">
          <el-input-number v-model="setupForm.initialChips" :min="100" :step="100" />
        </el-form-item>
        <el-form-item label="小盲注">
          <el-input-number v-model="setupForm.smallBlind" :min="1" />
        </el-form-item>
        <el-form-item label="大盲注">
          <el-input-number v-model="setupForm.bigBlind" :min="2" />
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
        <el-tag>阶段: {{ gameState?.phaseDescription || '等待中' }}</el-tag>
        <el-tag type="success">底池: ${{ formatNumber(gameState?.potAmount) }}</el-tag>
        <el-tag type="warning">当前注: ${{ formatNumber(gameState?.currentBet) }}</el-tag>
        <el-tag type="info">回合: {{ gameState?.currentRound || 0 }}</el-tag>
        <el-button v-if="gameState?.currentPhase === 'finished'" type="primary" size="small" @click="startNewRound">
          新一局
        </el-button>
      </div>

      <!-- 牌桌区域 -->
      <div class="poker-table">
        <!-- 公共牌 -->
        <div class="community-cards">
          <span class="label">公共牌:</span>
          <div class="cards">
            <poker-card
              v-for="(card, index) in gameState?.communityCards || []"
              :key="index"
              :card="card"
            />
            <span v-if="!gameState?.communityCards?.length" class="placeholder">等待发牌...</span>
          </div>
        </div>

        <!-- 玩家座位 -->
        <div class="players-grid">
          <div
            v-for="player in sortedPlayers"
            :key="player.position"
            :class="[
              'player-seat',
              { active: player.position === gameState?.currentPlayerPosition },
              { folded: player.isFolded },
              { winner: isWinner(player) }
            ]"
          >
            <player-seat
              :player="player"
              :showCards="shouldShowCards(player)"
              :isDealer="player.position === gameState?.dealerPosition"
              :isCurrent="player.position === gameState?.currentPlayerPosition"
            />
          </div>
        </div>
      </div>

      <!-- 操作面板 -->
      <div class="action-panel" v-if="isHumanTurn && gameState?.currentPhase !== 'finished'">
        <action-panel
          :player="humanPlayer"
          :currentBet="gameState?.currentBet || 0"
          :potAmount="gameState?.potAmount || 0"
          @fold="handleFold"
          @check="handleCheck"
          @call="handleCall"
          @raise="handleRaise"
          @all-in="handleAllIn"
        />
      </div>

      <!-- 游戏开始按钮 -->
      <div class="start-panel" v-if="gameState?.currentPhase === 'waiting'">
        <el-button type="primary" size="large" @click="startGame">开始游戏</el-button>
      </div>

      <!-- AI操作提示 -->
      <div class="ai-thinking" v-if="aiThinking">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI思考中...</span>
      </div>

      <!-- 获胜信息 -->
      <div class="winner-info" v-if="gameState?.winnerInfo && gameState?.currentPhase === 'finished'">
        <el-alert type="success" :closable="false">
          <template #title>
            <div v-html="formatWinnerInfo(gameState.winnerInfo)"></div>
          </template>
        </el-alert>
      </div>

      <!-- 游戏日志 -->
      <div class="game-logs" v-if="gameId">
        <div class="logs-header">
          <span>游戏日志</span>
          <el-button type="text" size="small" @click="clearLogs">清空</el-button>
        </div>
        <div class="logs-content" ref="logsContainer">
          <div
            v-for="(log, index) in displayLogs"
            :key="index"
            :class="['log-item', `log-${log.logType}`]"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-phase">{{ log.phase }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="displayLogs.length === 0" class="log-empty">暂无日志</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import * as pokerApi from '@/api/poker';
import PokerCard from './PokerCard.vue';
import PlayerSeat from './PlayerSeat.vue';
import ActionPanel from './ActionPanel.vue';

// 游戏设置表单
const setupForm = ref({
  aiPlayerCount: 3,
  initialChips: 1000,
  smallBlind: 10,
  bigBlind: 20,
});

// 游戏状态
const gameId = ref(null);
const gameState = ref(null);
const loading = ref(false);
const aiThinking = ref(false);

// 日志相关
const logs = ref([]);
const logsContainer = ref(null);

// 轮询定时器
let statusTimer = null;

// 排序后的玩家列表（按位置排列，真人在底部）
const sortedPlayers = computed(() => {
  if (!gameState.value?.players) return [];
  const players = [...gameState.value.players];
  // 将真玩家（位置0）移到末尾
  const humanIndex = players.findIndex(p => p.position === 0);
  if (humanIndex > -1) {
    const human = players.splice(humanIndex, 1)[0];
    players.push(human);
  }
  return players;
});

// 真玩家
const humanPlayer = computed(() => {
  return gameState.value?.players?.find(p => p.position === 0);
});

// 是否轮到真玩家
const isHumanTurn = computed(() => {
  return gameState.value?.currentPlayerPosition === 0 &&
         gameState.value?.currentPhase !== 'finished' &&
         gameState.value?.currentPhase !== 'waiting';
});

// 显示的日志列表（倒序排列，最新的在上面）
const displayLogs = computed(() => {
  // 优先显示后端返回的日志
  if (gameState.value?.gameLogs && gameState.value.gameLogs.length > 0) {
    return [...gameState.value.gameLogs].reverse();
  }
  // 否则显示本地日志
  return [...logs.value].reverse();
});

// 更新日志（从后端状态同步）
const updateLogs = () => {
  if (gameState.value?.gameLogs) {
    const newLogs = gameState.value.gameLogs;
    // 只添加新的日志
    if (newLogs.length > logs.value.length) {
      logs.value = newLogs;
      scrollToBottom();
    }
  }
};

// 滚动到日志底部
const scrollToBottom = () => {
  setTimeout(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }, 50);
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 格式化日志时间
const formatLogTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// 创建游戏
const createGame = async () => {
  loading.value = true;
  try {
    const res = await pokerApi.createGame(setupForm.value);
    gameId.value = res.data;
    ElMessage.success('游戏创建成功！');
    startPolling();
  } catch (error) {
    ElMessage.error('创建游戏失败');
  } finally {
    loading.value = false;
  }
};

// 开始游戏
const startGame = async () => {
  loading.value = true;
  try {
    await pokerApi.startGame(gameId.value);
    await refreshGameState();
    ElMessage.success('游戏开始！');
  } catch (error) {
    ElMessage.error('开始游戏失败');
  } finally {
    loading.value = false;
  }
};

// 开始新一局
const startNewRound = async () => {
  loading.value = true;
  try {
    await pokerApi.startNewRound(gameId.value);
    await refreshGameState();
    ElMessage.success('新一局开始！');
  } catch (error) {
    ElMessage.error('开始新一局失败');
  } finally {
    loading.value = false;
  }
};

// 刷新游戏状态
const refreshGameState = async () => {
  if (!gameId.value) return;
  try {
    const res = await pokerApi.getGameStatus(gameId.value);
    gameState.value = res.data;

    // 更新日志
    updateLogs();

    // 如果轮到AI，自动执行AI操作
    if (res.data.currentPlayerPosition !== 0 &&
        res.data.currentPhase !== 'finished' &&
        res.data.currentPhase !== 'waiting') {
      await executeAiActions();
    }
  } catch (error) {
    console.error('获取游戏状态失败', error);
  }
};

// 执行AI操作
const executeAiActions = async () => {
  aiThinking.value = true;
  try {
    const res = await pokerApi.performAiActions(gameId.value);
    gameState.value = res.data;

    // 检查是否需要进入下一阶段
    if (res.data.currentPhase !== 'finished' && res.data.currentPhase !== 'waiting') {
      // 继续检查是否还有AI需要行动
      await new Promise(resolve => setTimeout(resolve, 500));
      if (gameState.value.currentPlayerPosition !== 0) {
        await executeAiActions();
      }
    }
  } catch (error) {
    console.error('AI操作失败', error);
  } finally {
    aiThinking.value = false;
  }
};

// 弃牌
const handleFold = async () => {
  try {
    const res = await pokerApi.performAction({
      gameId: gameId.value,
      position: 0,
      actionType: 'fold',
    });
    gameState.value = res.data;
    await executeAiActions();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
  }
};

// 过牌
const handleCheck = async () => {
  try {
    const res = await pokerApi.performAction({
      gameId: gameId.value,
      position: 0,
      actionType: 'check',
    });
    gameState.value = res.data;
    await executeAiActions();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
  }
};

// 跟注
const handleCall = async () => {
  try {
    const toCall = (gameState.value.currentBet || 0) - (humanPlayer.value?.currentBet || 0);
    const res = await pokerApi.performAction({
      gameId: gameId.value,
      position: 0,
      actionType: 'call',
      betAmount: toCall,
    });
    gameState.value = res.data;
    await executeAiActions();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
  }
};

// 加注
const handleRaise = async (amount) => {
  try {
    const res = await pokerApi.performAction({
      gameId: gameId.value,
      position: 0,
      actionType: 'raise',
      betAmount: amount,
    });
    gameState.value = res.data;
    await executeAiActions();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
  }
};

// 全押
const handleAllIn = async () => {
  try {
    const res = await pokerApi.performAction({
      gameId: gameId.value,
      position: 0,
      actionType: 'all_in',
      betAmount: humanPlayer.value?.chips || 0,
    });
    gameState.value = res.data;
    await executeAiActions();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
  }
};

// 判断是否显示玩家的手牌
const shouldShowCards = (player) => {
  if (!player.isAi) return true;
  return gameState.value?.currentPhase === 'showdown' ||
         gameState.value?.currentPhase === 'finished';
};

// 判断是否为获胜者
const isWinner = (player) => {
  if (!gameState.value?.winnerInfo) return false;
  try {
    const info = JSON.parse(gameState.value.winnerInfo);
    if (Array.isArray(info)) {
      return info.some(w => w.playerName === player.playerName);
    }
  } catch (e) {
    return false;
  }
};

// 格式化获胜信息
const formatWinnerInfo = (info) => {
  try {
    const data = JSON.parse(info);
    if (Array.isArray(data)) {
      return data.map(w =>
        `<strong>${w.playerName}</strong> (${w.handRank}) 赢得 $${w.winnings}`
      ).join('<br>');
    }
  } catch (e) {
    return info;
  }
  return info;
};

// 开始轮询
const startPolling = () => {
  stopPolling();
  refreshGameState();
  statusTimer = setInterval(refreshGameState, 2000);
};

// 停止轮询
const stopPolling = () => {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
};

onMounted(() => {
  // 如果URL中有游戏ID，直接加载
  const urlGameId = new URLSearchParams(window.location.search).get('gameId');
  if (urlGameId) {
    gameId.value = parseInt(urlGameId);
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

// 格式化数字，处理大数和小数
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  // 如果是整数，直接返回
  if (Number.isInteger(n)) return n.toString();
  // 如果是小数，最多保留2位
  return n.toFixed(2);
};
</script>

<style scoped>
.texas-poker-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a5f3c 0%, #0d3d26 100%);
  padding: 20px;
}

.game-setup {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.game-setup h2 {
  text-align: center;
  color: #1a5f3c;
  margin-bottom: 30px;
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

.poker-table {
  background: radial-gradient(ellipse at center, #2d7a4a 0%, #1a5f3c 100%);
  border: 12px solid #8b4513;
  border-radius: 200px;
  padding: 40px;
  min-height: 400px;
  position: relative;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5);
}

.community-cards {
  text-align: center;
  margin-bottom: 30px;
}

.community-cards .label {
  color: white;
  font-size: 16px;
  margin-right: 10px;
}

.community-cards .cards {
  display: inline-flex;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 20px;
  border-radius: 8px;
}

.community-cards .placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.players-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.player-seat {
  transition: all 0.3s;
}

.player-seat.active {
  transform: scale(1.05);
}

.player-seat.folded {
  opacity: 0.5;
}

.player-seat.winner {
  animation: winner-glow 1s infinite alternate;
}

@keyframes winner-glow {
  from {
    filter: drop-shadow(0 0 5px gold);
  }
  to {
    filter: drop-shadow(0 0 20px gold);
  }
}

.action-panel {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.start-panel {
  text-align: center;
  margin-top: 40px;
}

.ai-thinking {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
}

.winner-info {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  min-width: 300px;
}

/* 游戏日志 */
.game-logs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: rgba(0, 0, 0, 0.9);
  border-top: 2px solid #8b4513;
  display: flex;
  flex-direction: column;
  z-index: 90;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(139, 69, 19, 0.8);
  color: white;
  font-size: 14px;
}

.logs-header span {
  font-weight: bold;
}

.logs-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.logs-content::-webkit-scrollbar {
  width: 6px;
}

.logs-content::-webkit-scrollbar-thumb {
  background: #8b4513;
  border-radius: 3px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  line-height: 1.4;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.log-time {
  color: #888;
  min-width: 60px;
}

.log-phase {
  color: #f39c12;
  min-width: 50px;
  font-weight: bold;
}

.log-message {
  color: #ecf0f1;
  flex: 1;
}

.log-item.log-system .log-message {
  color: #3498db;
}

.log-item.log-action .log-message {
  color: #2ecc71;
}

.log-item.log-phase .log-message {
  color: #e74c3c;
}

.log-empty {
  text-align: center;
  color: #666;
  padding: 40px 0;
}

/* 当有日志时，调整操作面板位置 */
.action-panel {
  bottom: 190px;
}
</style>
