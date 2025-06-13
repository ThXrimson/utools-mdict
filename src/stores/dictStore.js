import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { ElMessage } from 'element-plus';
import cloneDeep from 'lodash/cloneDeep';

const localStorageKey = 'dicts';

/* 
  字典数据结构
  {
    id: string
    name: string
    path: string
    enabled: boolean
  }
*/
export const useDictStore = defineStore('dictStore', {
  // 动作
  actions: {
    addDict({ id, name, path, enabled = true }) {
      if (!name || !path) {
        throw new Error('字典名称和路径不能为空');
      }
      const dict = {
        id: id === undefined ? uuidv4() : id,
        name,
        path,
        enabled,
      };
      this.dicts.push(dict);
      this.saveDicts();
    },
    deleteDict(id) {
      const index = this.dicts.findIndex((dict) => dict.id === id);
      if (index !== -1) {
        const name = this.dicts[index].name;
        this.dicts.splice(index, 1);
        this.saveDicts();
        ElMessage.success(`已删除词典: ${name}`);
      } else {
        ElMessage.error('字典不存在');
      }
    },
    saveDicts() {
      window.utools.dbStorage.setItem(localStorageKey, cloneDeep(this.dicts));
    },
    loadDicts() {
      try {
        const stored = window.utools.dbStorage.getItem(localStorageKey);
        if (stored) {
          this.dicts = stored;
        }
      } catch (e) {
        ElMessage.error('加载词典配置失败');
      }
    },
    moveDictBefore(id, beforeId) {
      const index = this.dicts.findIndex((dict) => dict.id === id);
      const beforeIndex = this.dicts.findIndex((dict) => dict.id === beforeId);
      if (index === -1 || beforeIndex === -1) {
        ElMessage.error('字典不存在');
        return;
      }
      const [dict] = this.dicts.splice(index, 1);
      this.dicts.splice(beforeIndex, 0, dict);
      this.saveDicts();
    },
    moveDictAfter(id, afterId) {
      const index = this.dicts.findIndex((dict) => dict.id === id);
      const afterIndex = this.dicts.findIndex((dict) => dict.id === afterId);
      if (index === -1 || afterIndex === -1) {
        ElMessage.error('字典不存在');
        return;
      }
      const [dict] = this.dicts.splice(index, 1);
      this.dicts.splice(afterIndex + 1, 0, dict);
      this.saveDicts();
    },
    updateDictEnabled(id, enabled) {
      const dict = this.dicts.find((dict) => dict.id === id);
      if (dict) {
        dict.enabled = enabled;
        this.saveDicts();
        ElMessage.success(`已${enabled ? '启用' : '禁用'}词典: ${dict.name}`);
      } else {
        ElMessage.error('字典不存在');
      }
    },
  },
  // 状态
  state() {
    return {
      dicts: [],
    };
  },
  // 计算
  getters: {
    // 获取所有启用的字典
    enabledDicts(state) {
      return state.dicts.filter((dict) => dict.enabled);
    },
    // 获取字典数量
    dictCount(state) {
      return state.dicts.length;
    },
  },
});
