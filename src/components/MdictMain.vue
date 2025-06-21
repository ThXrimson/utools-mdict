<script lang="ts" setup>
import { reactive, ref, watch } from 'vue'
import Settings from './SettingsPanel.vue'
import { useDictStore } from '../stores/dictStore.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  searchTerm: {
    type: String,
    default: '',
  },
})
const searchTerm = ref(props.searchTerm)
const prefixSearchLimit = 50
const showSettings = ref(false)
const dictStore = useDictStore()
const candidateWords = ref<string[]>([])
const totalResults = ref(0)
const isWordSelected = ref<boolean>(false)
const collapseShowDict = ref<string>(dictStore.enabledDicts[0]?.id || '')
const dictResults = reactive<Map<string, string[]>>(new Map())
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// 输入框变化时进行搜索
watch(
  () => searchTerm.value,
  (newValue) => {
    if (newValue.trim() !== '') {
      debouncedPrefixSearch()
    } else {
      clearSearch()
    }
  }
)

function clearSearch() {
  searchTerm.value = ''
  candidateWords.value = []
  totalResults.value = 0
  isWordSelected.value = false
  collapseShowDict.value = dictStore.enabledDicts[0]?.name || ''
  dictResults.clear()
}

function debouncedPrefixSearch() {
  // 300ms 防抖延迟
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    performPrefixSearch()
  }, 300)
}

function performPrefixSearch() {
  window.services.trie
    .searchPrefix(searchTerm.value, prefixSearchLimit)
    .then((words) => {
      candidateWords.value = words
    })
    .catch((err) => {
      console.error('Prefix search error:', err)
      ElMessage.error('查询失败，请稍后再试')
    })
}

function handleSelectWord(word: string) {
  dictStore.enabledDicts.forEach((dict) => {
    window.services.dicts
      .searchDict(dict.id, word)
      .then((results) => {
        dictResults.set(
          dict.id,
          results
            .filter((r) => r.definition !== null)
            .map((r) => r.definition as string)
        )
      })
      .catch((err) => {
        console.error(`Error searching in dict ${dict.name}:`, err)
        ElMessage.error(`查询词典 ${dict.name} 失败`)
      })
  })
}

// function searchWord() {
//   if (props.searchTerm.trim() === '') {
//     searchResults.value = []
//     activeDict.value = 'DeepLX翻译'
//     totalResults.value = 0
//     selectedWord.value = null
//     return
//   }
//   if (dictStore.enabledDicts.length === 0) {
//     ElMessage.error('请先在设置中启用至少一个词典')
//     return
//   }
//   const loadingMask = ElLoading.service({
//     lock: true,
//     text: '正在查询...',
//     background: 'rgba(0, 0, 0, 0.5)',
//   })
//   searchResults.value = [
//     {
//       id: 'deeplx',
//       name: 'DeepLX翻译',
//       results: [
//         {
//           word: searchTerm.value,
//           definition: `<p>翻译中...</p>`,
//         },
//       ],
//     },
//   ]
//   activeDict.value = 'DeepLX翻译'
//   selectedWord.value = searchResults.value[0].results[0]
//   const dictResults = dictStore.enabledDicts.map((dict) => {
//     const defaultResult = {
//       id: dict.id,
//       name: dict.name,
//       results: [],
//       visibleCount: 0,
//     }
//     const path = dict.path
//     if (!path) {
//       ElMessage.error(`词典 ${dict.name} 的路径未配置`)
//       return defaultResult
//     }
//     const ext = window.services.getExt(path)
//     if (ext !== '.mdx') {
//       ElMessage.error(`词典 ${dict.name} 的文件格式不正确`)
//       return defaultResult
//     }
//     const definitions = window.services.searchDict(
//       path,
//       ext,
//       searchTerm.value
//     )
//     return {
//       ...defaultResult,
//       results: definitions.map((def) => {
//         return {
//           word: def.word,
//           definition: def.definition,
//         }
//       }),
//       visibleCount: Math.min(10, definitions.length), // 默认显示10条结果
//     }
//   })
//   searchResults.value.push(...dictResults)
//   window.services
//     .searchDeeplx(searchTerm.value)
//     .then((resp) => {
//       const deeplxResult = resp.data.data
//       if (deeplxResult && deeplxResult.length > 0) {
//         const translation = deeplxResult
//         searchResults.value[0].results[0].definition = `<p>${translation}</p>`
//       } else {
//         searchResults.value[0].results[0].definition = `<p>未找到翻译结果</p>`
//       }
//     })
//     .catch((err) => {
//       searchResults.value[0].results[0].definition = `<p>翻译失败，请稍后再试</p>`
//     })
//   loadingMask.close()
//   totalResults.value = searchResults.value.reduce(
//     (sum, dict) => sum + dict.results.length,
//     0
//   )
//   if (totalResults.value > 0) {
//     // ElMessage.success(
//     //   `在 ${dictStore.enabledDicts.length} 个词典中找到 ${totalResults.value} 个结果`
//     // );
//   } else {
//     ElMessage.info('未找到相关词汇')
//   }
// }
</script>

<template>
  <div class="mdict-container">
    <!-- 主界面 -->
    <el-splitter class="main-panel">
      <!-- 左侧候选词栏 -->
      <el-splitter-panel
        size="30%"
        :collapsible="true"
        class="words-panel-splitter"
      >
        <div class="left-panel-wrapper">
          <el-input
            v-model="searchTerm"
            class="search-input"
            placeholder="请输入查询内容"
          />
          <div class="words-panel">
            <div v-if="candidateWords.length > 0">
              <div
                class="word-item"
                v-for="(result, index) in candidateWords"
                :key="index"
              >
                <el-text
                  class="word"
                  truncated
                  @click="handleSelectWord(result)"
                >
                  <code>{{ index + 1 }}</code> {{ result }}
                </el-text>
              </div>
            </div>
            <el-empty v-else description="请输入查询" />
          </div>
        </div>
      </el-splitter-panel>
      <!-- 右侧详细信息面板 -->
      <el-splitter-panel min="40%" style="background-color: white">
        <div class="detail-panel">
          <el-skeleton v-if="isWordSelected" :rows="2" />
          <div v-else-if="dictStore.enabledDicts.length == 0">
            <el-empty description="请在设置中启用至少一个词典" />
          </div>
          <div v-else class="title-wrapper">
            <el-collapse v-model="collapseShowDict" accordion>
              <el-collapse-item
                v-for="(dict, index) in dictStore.enabledDicts"
                v-bind:key="index"
                :title="dict.name"
                :name="dict.id"
              >
                <div
                  v-for="(result, index) in dictResults.get(dict.id) || []"
                  v-bind:key="index"
                  class="dict-word-definitions-wrapper"
                >
                  <div v-html="result"></div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          <!-- <div v-else v-html="selectedWord.definition"></div> -->
        </div>
      </el-splitter-panel>
    </el-splitter>
    <div class="status-bar">
      <el-button class="settings-button" @click="showSettings = true">
        <el-icon size="1.2em"><Setting /></el-icon>
      </el-button>
      <!-- 底部状态栏 -->
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
.left-panel-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.left-panel-wrapper .search-input {
  width: 100%;
  padding: 10px;
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
