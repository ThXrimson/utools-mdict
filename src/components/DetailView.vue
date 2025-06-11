<script setup>
import { ref, onMounted } from 'vue';
import ArrowLeft from '../icons/ArrowLeft.vue';

const props = defineProps({
  word: {
    type: String,
    required: true,
  },
  definition: {
    type: String,
    required: true,
  },
  dictionaryName: {
    type: String,
    required: true,
  },
  pronunciation: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['back']);

const onBackClick = () => {
  emit('back');
};
</script>

<template>
  <div class="detail-view">
    <!-- 头部区域 -->
    <div class="detail-header">
      <button class="back-btn" @click="onBackClick" aria-label="返回">
        <ArrowLeft />
      </button>
      <h1>{{ props.word }}</h1>
    </div>

    <!-- 内容区域 -->
    <div class="detail-content">
      <div class="content-card">
        <div class="source-value">{{ dictionaryName }}</div>
        <div class="definition-html" v-html="definition"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-view {
  min-height: 100vh;
  padding: 20px;
  overflow-y: auto;
}

/* 头部导航 */
.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.detail-header h1 {
  margin: 0;
  font-size: 24px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.back-text {
  font-size: 14px;
}

.header-spacer {
  flex: 1;
}

.dictionary-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

/* 词汇信息卡片 */
.word-card {
  margin: 24px;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.word-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
  background-size: 300% 100%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.word-main {
  display: flex;
  align-items: baseline;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.word-title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #2c3e50 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.pronunciation {
  color: #667eea;
  font-style: italic;
  font-size: 18px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.word-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.source-label {
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 500;
}

.source-value {
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* 内容区域 */
.detail-content {
  align-items: center;
  margin-bottom: 30px;
  gap: 15px;
}

.content-card {
  background: white;
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 8px 8px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.definition-html {
  line-height: 1.8;
  font-size: 16px;
  color: #2c3e50;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* HTML 内容样式优化 */
.definition-html :deep(h1),
.definition-html :deep(h2),
.definition-html :deep(h3),
.definition-html :deep(h4),
.definition-html :deep(h5),
.definition-html :deep(h6) {
  color: #2c3e50;
  margin: 28px 0 16px 0;
  font-weight: 600;
  line-height: 1.4;
}

.definition-html :deep(h1) {
  font-size: 28px;
}
.definition-html :deep(h2) {
  font-size: 24px;
}
.definition-html :deep(h3) {
  font-size: 20px;
}
.definition-html :deep(h4) {
  font-size: 18px;
}
.definition-html :deep(h5) {
  font-size: 16px;
}
.definition-html :deep(h6) {
  font-size: 14px;
}

.definition-html :deep(p) {
  margin: 16px 0;
  line-height: 1.8;
  text-align: justify;
}

.definition-html :deep(ul),
.definition-html :deep(ol) {
  margin: 20px 0;
  padding-left: 32px;
}

.definition-html :deep(li) {
  margin: 10px 0;
  line-height: 1.7;
}

.definition-html :deep(strong),
.definition-html :deep(b) {
  color: #2c3e50;
  font-weight: 700;
}

.definition-html :deep(em),
.definition-html :deep(i) {
  color: #667eea;
  font-style: italic;
  font-weight: 500;
}

.definition-html :deep(code) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 14px;
  color: #e74c3c;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.definition-html :deep(pre) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 24px 0;
  border-left: 4px solid #667eea;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.definition-html :deep(blockquote) {
  border-left: 4px solid #667eea;
  margin: 24px 0;
  padding: 20px 24px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  border-radius: 0 12px 12px 0;
  font-style: italic;
  position: relative;
}

.definition-html :deep(blockquote::before) {
  content: '"';
  position: absolute;
  top: 0;
  left: 0;
  font-size: 60px;
  color: rgba(102, 126, 234, 0.3);
  line-height: 1;
  transform: translate(-50%, -25%);
}

.definition-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.definition-html :deep(th),
.definition-html :deep(td) {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.definition-html :deep(th) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.definition-html :deep(tr:hover) {
  background: rgba(102, 126, 234, 0.05);
}

.definition-html :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 20px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.definition-html :deep(img:hover) {
  transform: scale(1.02);
}

.definition-html :deep(a) {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  padding: 2px 0;
}

.definition-html :deep(a:hover) {
  color: #764ba2;
  border-bottom-color: #764ba2;
  background: rgba(118, 75, 162, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
}

.definition-html :deep(hr) {
  border: none;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2, transparent);
  margin: 32px 0;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-view {
    background: #f8f9fa;
  }

  .detail-header {
    padding: 12px 16px;
  }

  .back-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .back-text {
    display: none;
  }

  .word-card,
  .content-card {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .word-title {
    font-size: 28px;
  }

  .word-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .pronunciation {
    font-size: 16px;
    padding: 6px 12px;
  }

  .definition-html {
    font-size: 15px;
  }

  .definition-html :deep(h1) {
    font-size: 24px;
  }
  .definition-html :deep(h2) {
    font-size: 22px;
  }
  .definition-html :deep(h3) {
    font-size: 20px;
  }
  .definition-html :deep(h4) {
    font-size: 18px;
  }

  .definition-html :deep(pre) {
    padding: 16px;
    font-size: 13px;
  }

  .definition-html :deep(th),
  .definition-html :deep(td) {
    padding: 12px 16px;
    font-size: 14px;
  }
}

/* 平板设备优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .word-card,
  .content-card {
    padding: 28px;
  }

  .word-title {
    font-size: 32px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .detail-view {
    max-width: 1000px;
    margin: 0 auto;
  }

  .word-card,
  .content-card {
    margin: 32px auto;
    max-width: 900px;
  }
}
</style>
