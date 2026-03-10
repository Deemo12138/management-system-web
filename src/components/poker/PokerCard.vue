<template>
  <div :class="['poker-card', suitClass]" v-if="card">
    <div class="card-top">
      <span class="rank">{{ rank }}</span>
      <span class="suit">{{ suit }}</span>
    </div>
    <div class="card-center">
      <span class="suit-large">{{ suit }}</span>
    </div>
    <div class="card-bottom">
      <span class="rank">{{ rank }}</span>
      <span class="suit">{{ suit }}</span>
    </div>
  </div>
  <div v-else class="poker-card back">
    <div class="card-back-pattern"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: {
    type: String,
    default: null,
  },
});

const rank = computed(() => {
  if (!props.card) return '';
  // 牌的格式是 "♠A" 或 "♥10"
  const match = props.card.match(/[A-Z0-9]+$/);
  return match ? match[0] : '';
});

const suit = computed(() => {
  if (!props.card) return '';
  const match = props.card.match(/^[♠♥♦♣]/);
  return match ? match[0] : '';
});

const suitClass = computed(() => {
  if (!props.card) return '';
  if (suit.value === '♥' || suit.value === '♦') return 'red';
  return 'black';
});
</script>

<style scoped>
.poker-card {
  width: 60px;
  height: 84px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  position: relative;
  font-family: 'Georgia', serif;
  transition: transform 0.2s, box-shadow 0.2s;
}

.poker-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.poker-card.red {
  color: #d32f2f;
}

.poker-card.black {
  color: #212121;
}

.poker-card .card-top,
.poker-card .card-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.poker-card .card-top {
  align-items: flex-start;
}

.poker-card .card-bottom {
  align-items: flex-end;
  transform: rotate(180deg);
}

.poker-card .rank {
  font-size: 14px;
  font-weight: bold;
}

.poker-card .suit {
  font-size: 12px;
}

.poker-card .card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.poker-card .suit-large {
  font-size: 28px;
}

.poker-card.back {
  background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
  border: 2px solid #4a6fa5;
}

.poker-card.back .card-back-pattern {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255, 255, 255, 0.1) 5px,
    rgba(255, 255, 255, 0.1) 10px
  );
  border-radius: 4px;
}
</style>
