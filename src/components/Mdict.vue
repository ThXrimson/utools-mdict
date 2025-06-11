<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import Settings from './Settings.vue';
import DetailView from './DetailView.vue';
import { useToast } from '../composables/useToast.js';
import SettingsIcon from '../icons/SettingsIcon.vue';
import axios from 'axios';

// TODO: 开发查询词典逻辑
defineProps({
  enterAction: {
    type: Object,
    required: true,
  },
});

const { success, error, warning, info } = useToast();

const currentPage = ref('main'); // 'main', 'settings', 或 'detail'
const selectedDetail = ref(null); // 存储选中的详情数据
const searchTerm = ref('');
const dictionaries = ref([]);
const enabledDictionaries = ref([]);
const searchResults = ref([]);
const isSearching = ref(false);
let searchTimeout = null; // 搜索防抖定时器

const onSettingsClick = () => {
  currentPage.value = 'settings';
};

const onBackToMain = () => {
  currentPage.value = 'main';
  selectedDetail.value = null;
  // 重新加载词典列表
  loadDictionaries();
};

// 点击结果进入详情页
const onResultClick = (item, dictResult) => {
  selectedDetail.value = {
    word: item.word,
    definition: item.definition,
    pronunciation: item.pronunciation,
    dictionaryName: dictResult.dictionaryName,
  };
  currentPage.value = 'detail';
};

// 加载词典配置
const loadDictionaries = () => {
  try {
    const stored = utools.dbStorage.getItem('dictionaries');
    if (stored) {
      // 兼容旧格式和新格式
      dictionaries.value = stored;
      // 筛选启用的词典并按顺序排序
      enabledDictionaries.value = stored
        .filter((dict) => dict.enabled)
        .sort((a, b) => a.order - b.order);
    }
  } catch (e) {
    console.error('加载词典配置失败:', e);
    error('加载词典配置失败');
  }
};

// 搜索功能
const performSearch = () => {
  if (!searchTerm.value.trim()) {
    // warning('请输入搜索词');
    return;
  }

  if (enabledDictionaries.value.length === 0) {
    warning('请先在设置中启用至少一个词典');
    return;
  }

  isSearching.value = true;

  searchResults.value = [
    {
      dictionaryName: 'DeepLX翻译',
      dictionaryId: 'deeplx',
      order: -1,
      results: [
        {
          word: searchTerm.value,
          definition: `<p>翻译中...</p>`,
        },
      ],
    },
    ...enabledDictionaries.value.map((dict, index) => {
      const defaultResult = {
        dictionaryName: dict.name,
        dictionaryId: dict.id,
        order: dict.order,
        results: [],
      };
      const path = dict.path;
      if (!path) {
        error(`词典 ${dict.name} 的路径未配置`);
        return defaultResult;
      }
      const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
      if (ext !== '.mdx') {
        error(`词典 ${dict.name} 的文件格式不正确`);
        return defaultResult;
      }
      const definitions = window.services.searchDict(
        path,
        ext,
        searchTerm.value
      );
      return {
        ...defaultResult,
        results: definitions
          .map((def) => {
            return {
              word: def.word,
              definition: def.definition,
              pronunciation: def.pronunciation || '',
            };
          })
          .slice(0, 10), // TODO: 限制最多返回10个词典的结果
      };
    }),
  ];

  isSearching.value = false;
  axios
    .post('https://deepl.deno.dev/translate', {
      text: searchTerm.value,
      target_lang: 'ZH',
      source_lang: 'auto',
    })
    .then((resp) => {
      const deeplxResult = resp.data.data;
      if (deeplxResult && deeplxResult.length > 0) {
        const translation = deeplxResult;
        searchResults.value[0].results[0].definition = `<p>${translation}</p>`;
      } else {
        searchResults.value[0].results[0].definition = `<p>未找到翻译结果</p>`;
      }
    })
    .catch((err) => {
      console.error('DeepLX翻译失败:', err);
      searchResults.value[0].results[0].definition = `<p>翻译失败，请稍后再试</p>`;
    });

  const totalResults = searchResults.value.reduce(
    (sum, dict) => sum + dict.results.length,
    0
  );
  if (totalResults > 0) {
    success(
      `在 ${enabledDictionaries.value.length} 个词典中找到 ${totalResults} 个结果`
    );
  } else {
    info('未找到相关词汇');
  }
};

// 防抖搜索函数
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300); // 300ms 防抖延迟
};

onMounted(() => {
  loadDictionaries();
  window.utools.setSubInput(({ text }) => {
    searchTerm.value = text;
    debouncedSearch();
  });
});
</script>

<template>
  <!-- 主页面 -->
  <div v-if="currentPage === 'main'">
    <div class="mdict">
      <!-- 搜索结果 -->
      <div class="search-results" v-if="searchResults.length > 0">
        <h3>搜索结果</h3>
        <div class="dictionary-columns">
          <div
            v-for="dictResult in searchResults"
            :key="dictResult.order"
            class="dictionary-column"
          >
            <div class="dictionary-header">
              <h4>{{ dictResult.dictionaryName }}</h4>
              <span class="result-count"
                >{{ dictResult.results.length }} 个结果</span
              >
            </div>
            <div class="dictionary-content">
              <div
                v-for="(item, idx) in dictResult.results"
                :key="idx"
                class="result-item"
                @click="onResultClick(item, dictResult)"
              >
                <div class="word-header">
                  <strong>{{ item.word }}</strong>
                </div>
                <div class="definition-preview" v-html="item.definition"></div>
                <div class="click-hint">点击查看详情 →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 空状态 -->
      <div v-else-if="dictionaries.length === 0" class="empty-state">
        <p>📚 还没有配置词典</p>
        <p>请点击右下角的设置按钮添加词典</p>
      </div>

      <div v-else-if="enabledDictionaries.length === 0" class="empty-state">
        <p>🔍 没有启用的词典</p>
        <p>请在设置中启用至少一个词典</p>
      </div>

      <div
        v-else-if="enabledDictionaries.length > 0 && searchResults.length === 0"
        class="empty-state"
      >
        <p>💡 在上方输入要查询的单词</p>
        <p>当前启用 {{ enabledDictionaries.length }} 个词典</p>
      </div>
    </div>
    <div class="status-bar">
      <div class="status-bar-content">
        <span v-if="enabledDictionaries.length > 0">
          启用词典: {{ enabledDictionaries.length }} 个
        </span>
        <span v-else-if="dictionaries.length > 0"> 请在设置中启用词典 </span>
        <span v-else>未配置词典</span>
      </div>
      <button class="settings-btn" @click="onSettingsClick">
        <SettingsIcon />
      </button>
    </div>
  </div>
  <!-- 设置页面 -->
  <Settings v-else-if="currentPage === 'settings'" @back="onBackToMain" />

  <!-- 详情页面 -->
  <DetailView
    v-else-if="currentPage === 'detail' && selectedDetail"
    :word="selectedDetail.word"
    :definition="selectedDetail.definition"
    :pronunciation="selectedDetail.pronunciation"
    :dictionary-name="selectedDetail.dictionaryName"
    @back="onBackToMain"
  />
</template>

<style scoped>
.mdict {
  padding: 20px; /* 内容区域内边距 */
  margin-bottom: 60px; /* 留出空间给底部状态栏 */
}

.dictionary-selector {
  margin-bottom: 15px;
}

.dictionary-selector label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.dictionary-selector select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-bar input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-bar button:hover:not(:disabled) {
  background: #0056b3;
}

.search-bar button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.items-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.items-section ul {
  list-style: none;
  padding: 0;
}

.items-section .item {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f9f9f9;
  transition: box-shadow 0.2s ease;
}

.items-section .item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.word-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.word-header strong {
  font-size: 18px;
  color: #333;
}

.pronunciation {
  color: #666;
  font-style: italic;
  font-size: 14px;
}

.definition {
  color: #555;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  margin-top: 20px;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  padding: 0 20px;
  z-index: 100;
}

.status-bar-content {
  flex: 1;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  outline: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.settings-btn:hover {
  background-color: #e0e0e0;
}

/* 多词典搜索结果样式 */
.search-results h3 {
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.dictionary-columns {
  display: flex;
  /* grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); */
  gap: 20px;
  margin-top: 20px;
  flex-direction: column;
}

.dictionary-column {
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dictionary-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dictionary-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.result-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.dictionary-content {
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  padding: 15px 20px;
  border-bottom: 4px solid #f0f0f0;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-item .word-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.result-item .word-header strong {
  font-size: 16px;
  color: #2c3e50;
}

.result-item .pronunciation {
  color: #7f8c8d;
  font-style: italic;
  font-size: 13px;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 4px;
}

.result-item .definition {
  color: #34495e;
  line-height: 1.6;
  font-size: 14px;
}

/* 预览样式 */
.definition-preview {
  color: #34495e;
  line-height: 1.6;
  font-size: 14px;
  max-height: 120px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
}

/* .definition-preview::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(transparent, #f8f9fa);
  pointer-events: none;
} */

.result-item:hover .definition-preview::after {
  background: linear-gradient(transparent, #f1f3f4);
}

/* 预览中的HTML样式简化 */
.definition-preview :deep(h1),
.definition-preview :deep(h2),
.definition-preview :deep(h3),
.definition-preview :deep(h4),
.definition-preview :deep(h5),
.definition-preview :deep(h6) {
  font-size: 14px;
  font-weight: 600;
  margin: 5px 0;
  color: #2c3e50;
}

.definition-preview :deep(p) {
  margin: 3px 0;
  font-size: 14px;
}

.definition-preview :deep(strong),
.definition-preview :deep(b) {
  font-weight: 600;
  color: #2c3e50;
}

.definition-preview :deep(em),
.definition-preview :deep(i) {
  font-style: italic;
  color: #7f8c8d;
}

.definition-preview :deep(ul),
.definition-preview :deep(ol) {
  margin: 5px 0;
  padding-left: 20px;
}

.definition-preview :deep(li) {
  margin: 2px 0;
  font-size: 14px;
}

.definition-preview :deep(img) {
  max-width: 60px;
  max-height: 40px;
  object-fit: cover;
  border-radius: 4px;
  vertical-align: middle;
}

.definition-preview :deep(table) {
  font-size: 12px;
  max-width: 100%;
}

.definition-preview :deep(th),
.definition-preview :deep(td) {
  padding: 4px 8px;
  font-size: 12px;
}

.click-hint {
  color: #667eea;
  font-size: 12px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;
  text-align: right;
  margin-top: 5px;
}

.result-item:hover .click-hint {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dictionary-columns {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .dictionary-header {
    padding: 12px 15px;
  }

  .result-item {
    padding: 12px 15px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .mdict {
    max-width: 1000px;
    margin: 0 auto;
  }
}
</style>
