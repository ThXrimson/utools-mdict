<script setup>
import { onMounted, ref, watch, computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'info', // info, success, warning, error
    validator: (value) =>
      ['info', 'success', 'warning', 'error'].includes(value),
  },
  duration: {
    type: Number,
    default: 3000,
  },
});

const emit = defineEmits(['close']);
const visible = ref(props.show);
const timer = ref(null);

onMounted(() => {
  // 如果组件初始状态为显示，则调用 showToast
  if (props.show) {
    showToast();
  }
});

const showToast = () => {
  // 清除之前的定时器
  if (timer.value) {
    clearTimeout(timer.value);
  }

  // 自动隐藏
  timer.value = setTimeout(() => {
    hideToast();
  }, props.duration);
};

const hideToast = () => {
  visible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300); // 等待过渡动画完成后再触发 close 事件
  // 清除定时器
  if (timer.value) {
    clearTimeout(timer.value);
    timer.value = null;
  }
};

// 获取图标
const getIcon = () => {
  switch (props.type) {
    case 'success':
      return '✓';
    case 'warning':
      return '⚠';
    case 'error':
      return '✕';
    default:
      return 'ℹ';
  }
};
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', `toast-${type}`]">
      <div class="toast-icon">{{ getIcon() }}</div>
      <div class="toast-message">{{ message }}</div>
      <button class="toast-close" @click="hideToast">×</button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.4;
}

.toast-info {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  color: #1976d2;
}

.toast-success {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
  color: #2e7d32;
}

.toast-warning {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  color: #f57c00;
}

.toast-error {
  background: #ffebee;
  border-left: 4px solid #f44336;
  color: #c62828;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

/* 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
