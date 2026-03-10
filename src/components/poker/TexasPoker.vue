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
</style>
