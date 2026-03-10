<template>
  <div class="action-panel-component">
    <!-- 玩家信息 -->
    <div class="panel-info">
      <span class="chips">你的筹码: ${{ formatNumber(player?.chips) }}</span>
      <span class="to-call" v-if="toCall > 0">
        需跟注: ${{ formatNumber(toCall) }}
      </span>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-buttons">
      <el-button
        type="danger"
        @click="$emit('fold')"
        :disabled="disabled"
      >
        弃牌
      </el-button>

      <el-button
        type="warning"
        @click="$emit('check')"
        :disabled="disabled || toCall > 0"
      >
        过牌
      </el-button>

      <el-button
        type="primary"
        @click="$emit('call')"
        :disabled="disabled || toCall <= 0"
      >
        跟注 ${{ formatNumber(toCall) }}
      </el-button>

      <div class="raise-group">
        <el-input-number
          v-model="raiseAmount"
          :min="minRaise"
          :max="player?.chips || 0"
          :step="bigBlind"
          size="small"
          :disabled="disabled"
        />
        <el-button
          type="success"
          @click="handleRaise"
          :disabled="disabled || raiseAmount < minRaise"
        >
          加注
        </el-button>
      </div>

      <el-button
        type="danger"
        plain
        @click="$emit('all-in')"
        :disabled="disabled"
      >
        全押 ${{ formatNumber(player?.chips) }}
      </el-button>
    </div>

    <!-- 快捷加注按钮 -->
    <div class="quick-raise" v-if="!disabled">
      <span>快捷加注:</span>
      <el-button
        v-for="multiple in [2, 3, 4]"
        :key="multiple"
        size="small"
        @click="quickRaise(multiple)"
      >
        {{ multiple }}倍大盲
      </el-button>
      <el-button
        size="small"
        @click="potRaise"
      >
        底池下注
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  player: {
    type: Object,
    required: true,
  },
  currentBet: {
    type: Number,
    default: 0,
  },
  potAmount: {
    type: Number,
    default: 0,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['fold', 'check', 'call', 'raise', 'all-in']);

// 加注金额
const raiseAmount = ref(0);

// 大盲注（假设为当前下注额的一半，或使用固定值）
const bigBlind = computed(() => {
  return Math.max(props.currentBet / 2, 20);
});

// 需要跟注的金额
const toCall = computed(() => {
  return props.currentBet - (props.player?.currentBet || 0);
});

// 最小加注额
const minRaise = computed(() => {
  if (toCall.value <= 0) {
    return bigBlind.value * 2;
  }
  return props.currentBet + bigBlind.value;
});

// 初始化加注金额
if (raiseAmount.value === 0) {
  raiseAmount.value = minRaise.value;
}

// 执行加注
const handleRaise = () => {
  emit('raise', raiseAmount.value);
};

// 快捷加注
const quickRaise = (multiple) => {
  const amount = multiple * bigBlind.value;
  emit('raise', amount);
};

// 底池下注（加注到底池大小）
const potRaise = () => {
  emit('raise', props.potAmount);
};

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
.action-panel-component {
  background: white;
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 500px;
}

.panel-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.panel-info .chips {
  font-weight: bold;
  color: #4caf50;
}

.panel-info .to-call {
  color: #f57c00;
  font-weight: bold;
}

.panel-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.raise-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.quick-raise {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.quick-raise span {
  color: #666;
  font-size: 14px;
}
</style>
