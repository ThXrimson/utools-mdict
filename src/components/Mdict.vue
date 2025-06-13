<template>
  <div class="mdict-container">
    <el-splitter class="main-panel">
      <el-splitter-panel
        size="30%"
        :collapsible="true"
        class="words-panel-splitter"
      >
        <div class="words-panel">
          <el-collapse
            v-if="searchResults.length !== 0"
            v-model="activeDict"
            accordion
          >
            <el-collapse-item
              :name="dictResults.name"
              v-for="dictResults in searchResults"
              :key="dictResults.id"
              class="dict-item"
            >
              <template #title="{ isActive }">
                <div class="title-wrapper">
                  <el-text truncated :type="isActive ? 'primary' : ''">
                    📘 {{ dictResults.name }}
                  </el-text>
                  <el-text class="title-word-count">
                    <code>{{ dictResults.results.length }}</code>
                  </el-text>
                </div>
              </template>
              <el-divider style="margin: 0" />
              <div v-if="dictResults.results.length > 0">
                <div
                  v-for="(result, index) in dictResults.results.slice(
                    0,
                    dictResults.visibleCount
                  )"
                  :key="result.word"
                >
                  <div class="word-item" @click="selectedWord = result">
                    <el-text class="word" truncated>
                      <code>{{ index + 1 }}</code> {{ result.word }}
                    </el-text>
                  </div>
                  <el-divider
                    style="margin: 0"
                    v-if="index !== dictResults.results.length - 1"
                  />
                </div>
                <el-button
                  v-if="dictResults.results.length > dictResults.visibleCount"
                  size="mini"
                  class="load-more"
                  @click="
                    dictResults.visibleCount = Math.min(
                      dictResults.results.length,
                      dictResults.visibleCount + 10
                    )
                  "
                >
                  <el-text type="primary" size="small"> 显示更多 </el-text>
                </el-button>
              </div>
              <div v-else>
                <div class="word-item">
                  <el-text>未找到相关词汇</el-text>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
          <el-empty v-else description="请输入查询" />
        </div>
      </el-splitter-panel>
      <el-splitter-panel min="40%" style="background-color: white">
        <div class="detail-panel">
          <el-skeleton v-if="selectedWord === null" :rows="2" />
          <div v-html="selectedWord.definition" v-else></div>
        </div>
      </el-splitter-panel>
    </el-splitter>
    <div class="status-bar">
      <el-button class="settings-button" @click="showSettings = true">
        <el-icon size="1.2em"><Setting /></el-icon>
      </el-button>
      <div class="statuses">
        <div>启用词典：{{ dictStore.enabledDicts.length }}</div>
        <el-divider direction="vertical" style="height: 1.2em" />
        <div>共查询到 {{ totalResults }} 条结果</div>
      </div>
    </div>
  </div>

  <el-drawer
    v-model="showSettings"
    title="设置"
    direction="ltr"
    header-class="drawer-header"
  >
    <Settings />
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Settings from '@/components/Settings.vue';
import { useDictStore } from '@/stores/dictStore.js';
import { ElMessage, ElLoading } from 'element-plus';

const { initialSearch } = defineProps({
  initialSearch: {
    type: String,
    default: '',
  },
});
const showSettings = ref(false);
const dictStore = useDictStore();
const activeDict = ref('deeplx');
const searchTerm = ref('');
const searchResults = ref([]);
const totalResults = ref(0);
const selectedWord = ref(null);
let searchTimeout = null;

onMounted(() => {
  dictStore.loadDicts();
  setTimeout(() => {
    // 延迟设置 SubInput，确保 utools 已经准备好
    const success = window.utools.setSubInput(
      ({ text }) => {
        searchTerm.value = text;
        debouncedSearch();
      },
      '请输入查询',
      true
    );
    window.utools.setSubInputValue(initialSearch);
    searchTerm.value = initialSearch;
    debouncedSearch();
  }, 100);
});

watch(
  () => searchTerm,
  (newValue) => {
    if (newValue.trim() !== '') {
      debouncedSearch();
    }
  }
);

function debouncedSearch() {
  // 300ms 防抖延迟
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300);
}

function performSearch() {
  if (searchTerm.value.trim() === '') {
    searchResults.value = [];
    activeDict.value = 'deeplx';
    totalResults.value = 0;
    selectedWord.value = null;
    return;
  }
  if (dictStore.enabledDicts.length === 0) {
    ElMessage.error('请先在设置中启用至少一个词典');
    return;
  }
  const loadingMask = ElLoading.service({
    lock: true,
    text: '正在查询...',
    background: 'rgba(0, 0, 0, 0.5)',
  });
  searchResults.value = [
    {
      id: 'deeplx',
      name: 'DeepLX翻译',
      results: [
        {
          word: searchTerm.value,
          definition: `<p>翻译中...</p>`,
        },
      ],
    },
  ];
  activeDict.value = 'DeepLX翻译';
  const dictResults = dictStore.enabledDicts.map((dict) => {
    const defaultResult = {
      id: dict.id,
      name: dict.name,
      results: [],
      visibleCount: 0,
    };
    const path = dict.path;
    if (!path) {
      ElMessage.error(`词典 ${dict.name} 的路径未配置`);
      return defaultResult;
    }
    const ext = window.services.getExt(path);
    if (ext !== '.mdx') {
      ElMessage.error(`词典 ${dict.name} 的文件格式不正确`);
      return defaultResult;
    }
    const definitions = window.services.searchDict(path, ext, searchTerm.value);
    return {
      ...defaultResult,
      results: definitions.map((def) => {
        return {
          word: def.word,
          definition: def.definition,
        };
      }),
      visibleCount: Math.min(10, definitions.length), // 默认显示10条结果
    };
  });
  searchResults.value.push(...dictResults);
  window.services
    .searchDeeplx(searchTerm.value)
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
      searchResults.value[0].results[0].definition = `<p>翻译失败，请稍后再试</p>`;
    });
  loadingMask.close();
  totalResults.value = searchResults.value.reduce(
    (sum, dict) => sum + dict.results.length,
    0
  );
  if (totalResults.value > 0) {
    // ElMessage.success(
    //   `在 ${dictStore.enabledDicts.length} 个词典中找到 ${totalResults.value} 个结果`
    // );
  } else {
    ElMessage.info('未找到相关词汇');
  }
}
</script>

<style scoped>
.mdict-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}
.main-panel {
  flex: 1;
  overflow-y: hidden;
  height: auto;
}
.detail-panel {
  padding: 20px;
  overflow-y: auto;
  height: auto;
}
.status-bar {
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  position: sticky;
  bottom: 0;
  left: 0;
  margin-top: 1px;
  height: fit-content;
  width: 100%;
  align-items: center;
  background-color: #f5f5f5;
  padding: 8px 10px;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  color: gray;
}
.status-bar .settings-button {
  height: fit-content;
  align-items: center;
  margin: 0;
  padding: 0;
  border: none;
  background-color: inherit;
}
.status-bar * {
  user-select: none;
}
.status-bar .statuses {
  display: flex;
  justify-content: space-between;
}
.title-wrapper {
  padding-left: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title-word-count {
  margin-right: 2px;
}
.title-word-count > code {
  background-color: rgb(193, 193, 193);
  border-radius: 3px;
  padding: 1px;
}
.word-item {
  padding: 5px 5px 5px 10px;
}
.word-item:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}
.word-item:hover .word {
  color: var(--el-color-primary);
}
.word-item .word > code {
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  background-color: rgb(199.5, 201, 204);
}
.load-more {
  border: none;
  justify-self: center;
  width: 100%;
}
</style>

<style>
.words-panel-splitter {
  overflow-x: hidden;
}
.dict-item .el-collapse-item__content {
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}
.dict-item .el-collapse-item__arrow {
  padding-right: 10px;
}
.dict-item .el-collapse-item__title {
  min-width: 0;
}
</style>
