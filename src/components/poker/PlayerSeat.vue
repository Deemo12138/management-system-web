<template>
  <div :class="['player-seat-component', { active: isCurrent, dealer: isDealer }]">
    <!-- 玩家信息 -->
    <div class="player-info">
      <div class="player-name">
        {{ player.playerName }}
        <span v-if="player.isAi" class="ai-badge">AI</span>
        <span v-if="isDealer" class="dealer-badge">庄</span>
      </div>
      <div class="player-chips">
        筹码: ${{ formatNumber(player.chips) }}
      </div>
      <div class="player-bet" v-if="player.currentBet > 0">
        下注: ${{ formatNumber(player.currentBet) }}
      </div>
      <div class="player-status" v-if="player.isFolded">
        <el-tag type="info" size="small">已弃牌</el-tag>
      </div>
      <div class="player-status" v-if="player.isAllIn">
        <el-tag type="danger" size="small">全押</el-tag>
      </div>
    </div>

    <!-- 手牌 -->
    <div class="player-cards">
      <poker-card
        v-for="(card, index) in displayCards"
        :key="index"
        :card="card"
      />
      <div v-if="!displayCards?.length" class="no-cards">
        <span v-if="player.isFolded">已弃牌</span>
        <span v-else>等待发牌</span>
      </div>
    </div>

    <!-- 当前行动指示器 -->
    <div v-if="isCurrent && !player.isFolded" class="current-indicator">
      <div class="pulse"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PokerCard from './PokerCard.vue';

const props = defineProps({
  player: {
    type: Object,
    required: true,
  },
  showCards: {
    type: Boolean,
    default: false,
  },
  isDealer: {
    type: Boolean,
    default: false,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
});

const displayCards = computed(() => {
  if (props.showCards && props.player.holeCards) {
    return props.player.holeCards;
  }
  return [];
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
.player-seat-component {
  background: white;
  border-radius: 12px;
  padding: 12px;
  min-width: 150px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  transition: all 0.3s;
}

.player-seat-component.active {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  border: 2px solid gold;
}

.player-seat-component.dealer {
  border-color: #ff9800;
}

.player-info {
  text-align: center;
  margin-bottom: 8px;
}

.player-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.ai-badge {
  background: #9c27b0;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}

.dealer-badge {
  background: #ff9800;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}

.player-chips {
  color: #4caf50;
  font-weight: bold;
  font-size: 14px;
}

.player-bet {
  color: #f57c00;
  font-size: 12px;
  margin-top: 2px;
}

.player-status {
  margin-top: 4px;
}

.player-cards {
  display: flex;
  justify-content: center;
  gap: 4px;
  min-height: 84px;
  align-items: center;
}

.no-cards {
  color: #9e9e9e;
  font-size: 12px;
}

.current-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
}

.pulse {
  width: 12px;
  height: 12px;
  background: gold;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
