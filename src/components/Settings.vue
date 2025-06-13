<script setup>
import { h, ref, computed } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import DragHandle from '@/icons/DragHandle.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useDictStore } from '@/stores/dictStore.js';
const dictStore = useDictStore();
const dictShowData = computed(() => {
  return dictStore.dicts.map((dict, index) => ({
    id: dict.id,
    label: dict.name,
    path: dict.path,
    enabled: dict.enabled,
    enabledChangeCallback(val) {
      dictStore.updateDictEnabled(dict.id, val);
    },
  }));
});
const newDictName = ref('');
const newDictPath = ref('');
function selectFileInput() {
  try {
    const path = window.utools.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '词典文件', extensions: ['mdx'] }],
      title: '选择词典文件',
    });

    if (path && path.length > 0) {
      // 实时验证选择的文件
      const validation = validateDictPath(path[0]);
      if (!validation.valid) {
        ElMessage.warning(validation.message);
      } else {
        newDictPath.value = path[0];
        newDictName.value = window.services.getBasenameWithoutExt(path[0]);
        // ElMessage.success('文件路径验证通过');
      }
    }
  } catch (error) {
    ElMessage.error('文件选择失败: ' + error.message);
  }
}
function validateDictPath(path) {
  if (!path || !path.trim()) {
    return { valid: false, message: '路径不能为空' };
  }

  // 检查路径格式 (Windows路径)
  const windowsPathPattern = /^[a-zA-Z]:\\.*$/;
  const unixPathPattern = /^\/.*$/;

  if (!windowsPathPattern.test(path) && !unixPathPattern.test(path)) {
    return { valid: false, message: '路径格式不正确' };
  }

  // 检查文件扩展名
  const validExtensions = ['.mdx'];
  const fileExtension = path.toLowerCase().substring(path.lastIndexOf('.'));

  if (!validExtensions.includes(fileExtension)) {
    return {
      valid: false,
      message: `不支持的文件格式，支持的格式: ${validExtensions.join(', ')}`,
    };
  }

  try {
    // 使用utools API检查文件是否存在
    if (!window.services.existsSync(path)) {
      return { valid: false, message: '文件不存在，请检查路径是否正确' };
    }

    // 检查是否为文件而非目录
    if (!window.services.isFile(path)) {
      return { valid: false, message: '指定路径不是文件' };
    }

    return { valid: true, message: '路径验证通过' };
  } catch (error) {
    return { valid: false, message: `路径验证失败: ${error.message}` };
  }
}
const isPathValid = computed(() => {
  return validateDictPath(newDictPath.value.trim()).valid;
});
function confirmAddDict() {
  try {
    dictStore.addDict({
      name: newDictName.value.trim(),
      path: newDictPath.value.trim(),
    });
    newDictName.value = '';
    newDictPath.value = '';
  } catch (error) {
    ElMessage.error('添加词典失败: ' + error.message);
  }
}
function deleteDict(id) {
  dictStore.deleteDict(id);
}
function handleDrop(node, targetNode, type, evnt) {
  if (type === 'before') {
    // 在目标节点之前插入
    dictStore.moveDictBefore(node.data.id, targetNode.data.id);
  } else if (type === 'after') {
    // 在目标节点之后插入
    dictStore.moveDictAfter(node.data.id, targetNode.data.id);
  } else if (type === 'inner') {
    // 不允许拖拽到当前节点内部
    ElMessage.warning('不允许拖拽到当前节点内部');
  }
}
function handleClick(id, label, path) {
  ElMessageBox.alert(
    h('p', null, [
      h('span', null, [h('strong', null, '词典 ID: '), h('span', null, id)]),
      h('br', null, null),
      h('span', null, [
        h('strong', null, '词典名称: '),
        h('span', null, label),
      ]),
      h('br', null, null),
      h('span', null, [h('strong', null, '词典路径: '), h('span', null, path)]),
    ]),
    '详细信息',
    {
      closeOnClickModal: true,
    }
  );
}
function allowDrop(draggingNode, dropNode, type) {
  if (type === 'inner') {
    return false; // 不允许允许拖拽到当前节点内部
  }
  return true;
}
</script>

<template>
  <div class="dict-settings">
    <el-button type="primary" @click="selectFileInput">
      选择 MDX 文件
    </el-button>
    <div class="label-input">
      <el-text size="small">词典名称</el-text>
      <el-input
        v-model="newDictName"
        aria-label="label"
        placeholder="词典名称"
      />
    </div>
    <div class="label-input">
      <el-text size="small">词典文件路径</el-text>
      <el-input
        v-model="newDictPath"
        aria-label="label"
        placeholder="词典文件路径"
      />
    </div>
    <el-button type="primary" :disabled="!isPathValid" @click="confirmAddDict">
      添加
    </el-button>
    <el-tree
      class="dict-list"
      :allow-drop="allowDrop"
      :allow-drag="true"
      :data="dictShowData"
      :icon="DragHandle"
      :props="{
        class: 'dict-list-item',
      }"
      draggable
      node-key="id"
      @node-drop="handleDrop"
    >
      <template #default="{ node, data }">
        <div class="dict-item">
          <el-switch
            v-model="data.enabled"
            size="small"
            @change="data.enabledChangeCallback"
          />
          <el-text
            size="small"
            truncated
            @click="handleClick(data.id, data.label, data.path)"
            style="margin-left: 4px"
          >
            {{ data.label }}
          </el-text>
          <el-button
            type="danger"
            :icon="Delete"
            text
            size="small"
            @click="deleteDict(data.id)"
          />
        </div>
      </template>
    </el-tree>
  </div>
</template>

<style scoped>
.dict-settings {
  display: flex;
  gap: 20px;
  flex-direction: column;
}
.dict-list {
  border-radius: 3px;
  border: 1px solid #dcdfe6;
}
/* settings list divider */
.dict-list .el-tree-node:not(:nth-last-child(2)) {
  border-bottom: 1px solid #dcdfe6;
}
.dict-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1 0;
  min-width: 0;
}
.label-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

<style>
/* settings draggable handle */
.dict-list-item .el-tree-node__content .el-tree-node__expand-icon.is-leaf {
  pointer-events: none;
  visibility: visible;
}
.drawer-header {
  padding: 10px 20px 0;
  margin-bottom: 10px;
}
.label-input .el-text {
  align-self: flex-start;
}
</style>
