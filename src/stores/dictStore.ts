import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage } from 'element-plus'
import cloneDeep from 'lodash/cloneDeep'

const localStorageKey = 'dicts'

// 定义字典类型接口
export interface Dict {
  id: string
  name: string
  checksum: string
  enabled: boolean
}

export const useDictStore = defineStore('dictStore', {
  state: () => ({
    dictItems: [] as Dict[],
  }),
  getters: {
    // 获取激活的词典
    enabledDicts: (state): Dict[] =>
      state.dictItems.filter((dict) => dict.enabled),
    // 获取词典总数目
    dictCount: (state): number => state.dictItems.length,
  },
  actions: {
    // 添加新词典
    async addDict(name: string, path: string): Promise<boolean> {
      if (!name || !path) {
        throw new Error('字典名称和路径不能为空')
      }
      const checksum = await window.services.files.checksumFile(path)
      if (this.dictItems.some((dict) => dict.checksum === checksum)) {
        ElMessage.error('该词典已存在')
        return false
      }
      const dictItem: Dict = {
        id: uuidv4(),
        name,
        checksum,
        enabled: true, // 默认启用
      }
      await window.services.dicts.addDict(dictItem.id, path)
      this.dictItems.push(dictItem)
      return await this.saveDictItems()
    },
    async deleteDict(id: string) {
      const index = this.dictItems.findIndex((dict) => dict.id === id)
      if (index !== -1) {
        const name = this.dictItems[index].name
        this.dictItems.splice(index, 1)
        window.services.dicts.removeDict(id)
        await this.saveDictItems()
        ElMessage.success(`已删除词典: ${name}`)
      } else {
        ElMessage.error('字典不存在')
      }
    },
    async saveDictItems(): Promise<boolean> {
      window.utools.dbStorage.setItem(
        localStorageKey,
        cloneDeep(this.dictItems)
      )
      return true
    },
    loadDictItems() {
      try {
        const stored = window.utools.dbStorage.getItem(localStorageKey)
        if (stored) {
          // 注意这里断言 stored 为 Dict[] 类型
          this.dictItems = stored as Dict[]
        }
      } catch (error) {
        ElMessage.error('加载词典配置失败: ' + error)
      }
    },
    moveDictBefore(id: string, beforeId: string) {
      const index = this.dictItems.findIndex((dict) => dict.id === id)
      const beforeIndex = this.dictItems.findIndex(
        (dict) => dict.id === beforeId
      )
      if (index === -1 || beforeIndex === -1) {
        ElMessage.error('字典不存在')
        return
      }
      const [dict] = this.dictItems.splice(index, 1)
      this.dictItems.splice(beforeIndex, 0, dict)
      this.saveDictItems()
    },
    moveDictAfter(id: string, afterId: string) {
      const index = this.dictItems.findIndex((dict) => dict.id === id)
      const afterIndex = this.dictItems.findIndex(
        (dict) => dict.id === afterId
      )
      if (index === -1 || afterIndex === -1) {
        ElMessage.error('字典不存在')
        return
      }
      const [dict] = this.dictItems.splice(index, 1)
      this.dictItems.splice(afterIndex + 1, 0, dict)
      this.saveDictItems()
    },
    updateDictEnabled(id: string, enabled: boolean) {
      const dict = this.dictItems.find((dict) => dict.id === id)
      if (dict) {
        dict.enabled = enabled
        this.saveDictItems()
        ElMessage.success(
          `已${enabled ? '启用' : '禁用'}词典: ${dict.name}`
        )
      } else {
        ElMessage.error('字典不存在')
      }
    },
  },
})
