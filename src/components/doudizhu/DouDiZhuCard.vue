<template>
  <div
    :class="['doudizhu-card', { selected }]"
    @click="$emit('click', cardCode)"
  >
    <div v-if="cardCode === 'joker_big'" class="card joker big-joker">
      <div class="rank">大王</div>
    </div>
    <div v-else-if="cardCode === 'joker_small'" class="card joker small-joker">
      <div class="rank">小王</div>
    </div>
    <div v-else class="card" :class="suitClass">
      <div class="corner top-left">
        <span class="rank">{{ displayRank }}</span>
        <span class="suit">{{ suitSymbol }}</span>
      </div>
      <div class="center-suit">{{ suitSymbol }}</div>
      <div class="corner bottom-right">
        <span class="rank">{{ displayRank }}</span>
        <span class="suit">{{ suitSymbol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cardCode: {
    type: String,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const displayRank = computed(() => {
  if (props.cardCode === 'joker_big') return '大王'
  if (props.cardCode === 'joker_small') return '小王'
  const parts = props.cardCode.split('_')
  return parts[1]?.toUpperCase() || ''
})

const suitSymbol = computed(() => {
  const suitMap = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
  }
  const parts = props.cardCode.split('_')
  return suitMap[parts[0]] || ''
})

const suitClass = computed(() => {
  const parts = props.cardCode.split('_')
  const suit = parts[0]
  if (suit === 'hearts' || suit === 'diamonds') {
    return 'red'
  }
  return 'black'
})
</script>

<style scoped>
.doudizhu-card {
  width: 60px;
  height: 84px;
  cursor: pointer;
  transition: all 0.2s;
}

.doudizhu-card:hover {
  transform: translateY(-5px);
}

.doudizhu-card.selected {
  transform: translateY(-15px);
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.6);
}

.card {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
  position: relative;
}

.card.red {
  color: #d32f2f;
}

.card.black {
  color: #212121;
}

.card.joker {
  background: linear-gradient(135deg, #ffd700 0%, #ffec8b 100%);
  justify-content: center;
  align-items: center;
}

.card.joker.big-joker {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
}

.card.joker .rank {
  font-size: 18px;
  font-weight: bold;
  color: #8b4513;
}

.corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  line-height: 1;
}

.corner.top-left {
  align-self: flex-start;
}

.corner.bottom-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.center-suit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
}
</style>
