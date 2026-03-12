<template>
  <div :class="['player-seat-item', { current: isCurrent }]">
    <div class="player-avatar">
      <div class="avatar-circle">{{ playerName.charAt(0) }}</div>
      <div v-if="player.isLandlord" class="landlord-badge">地主</div>
    </div>
    <div class="player-info">
      <div class="player-name">{{ playerName }}</div>
      <div v-if="player.isAi" class="ai-tag">AI</div>
    </div>
    <div v-if="showCards && player.handCards" class="player-cards">
      <div class="cards-count">{{ player.handCards.length }} 张</div>
      <div class="cards">
        <doudizhu-card
          v-for="(card, index) in displayCards"
          :key="`card-${index}`"
          :card-code="card"
        />
      </div>
    </div>
    <div v-else-if="!showCards" class="cards-back">
      <div class="card-back">?</div>
      <div class="cards-count">{{ player.handCards?.length || 0 }} 张</div>
    </div>
    <div v-if="player.bidScore !== undefined && player.bidScore > 0" class="bid-score">
      叫分: {{ player.bidScore }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DouDiZhuCard from './DouDiZhuCard.vue'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  showCards: {
    type: Boolean,
    default: false
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
})

const playerName = computed(() => props.player.playerName || '玩家')

const displayCards = computed(() => {
  if (!props.showCards || !props.player.handCards) return []
  return props.player.handCards.slice(0, 5) // 只显示前5张作为预览
})
</script>

<style scoped>
.player-seat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.3s;
}

.player-seat-item.current {
  background: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.player-avatar {
  position: relative;
  margin-bottom: 10px;
}

.avatar-circle {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.landlord-badge {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffd700;
  color: #8b4513;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.player-info {
  text-align: center;
  margin-bottom: 10px;
}

.player-name {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.ai-tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin-top: 5px;
}

.player-cards,
.cards-back {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.cards {
  display: flex;
  gap: 2px;
}

.cards-count {
  color: #ffd700;
  font-size: 12px;
}

.card-back {
  width: 40px;
  height: 56px;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.bid-score {
  color: #ffd700;
  font-size: 12px;
  margin-top: 5px;
}
</style>
