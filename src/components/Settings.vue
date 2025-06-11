<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from '../composables/useToast.js';
import ArrowLeft from '../icons/ArrowLeft.vue';
import cloneDeep from 'lodash/cloneDeep';

const emit = defineEmits(['back']);
const { success, error, warning } = useToast();

// 词典管理相关状态
const dictionaries = ref([]); // 改为数组结构，支持顺序和状态
const newDictName = ref('');
const newDictPath = ref('');
const showAddForm = ref(false);
const draggedIndex = ref(null);
const dragOverIndex = ref(null);
const dragInsertPosition = ref(null); // 'before' | 'after'
const isDragActive = ref(false);
const dragImageEl = ref(null);

watch(
  () => newDictPath.value,
  (newPath, oldPath) => {
    if (oldPath.trim() !== newPath.trim() && pathValidation.value.valid) {
      // 如果路径变化且之前没有输入过路径，则自动填充词典名称
      const fileName = window.services.getBaseName(newPath);
      const dictName = fileName.substring(0, fileName.lastIndexOf('.'));
      newDictName.value = dictName;
    }
  }
);

// 计算路径验证状态
const pathValidation = computed(() => {
  if (!newDictPath.value.trim()) {
    return { valid: null, message: '' };
  }
  return validateDictPath(newDictPath.value.trim());
});

const onBackClick = () => {
  emit('back');
};

// 加载词典配置
const loadDictionaries = () => {
  try {
    const stored = utools.dbStorage.getItem('dictionaries');
    if (stored) {
      dictionaries.value = stored;
    }
  } catch (error) {
    console.error('加载词典配置失败:', error);
    error('加载词典配置失败');
  }
};

// 保存词典配置
const saveDictionaries = () => {
  try {
    utools.dbStorage.setItem('dictionaries', cloneDeep(dictionaries.value));
  } catch (e) {
    console.error('保存词典配置失败:', e);
    error('保存词典配置失败');
  }
};

// 验证文件路径和存在性
const validateDictPath = (path) => {
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
};

// 添加词典
const addDictionary = () => {
  if (!newDictName.value.trim() || !newDictPath.value.trim()) {
    warning('请填写词典名称和路径');
    return;
  }

  // 验证词典名称是否已存在
  if (
    dictionaries.value.some((dict) => dict.name === newDictName.value.trim())
  ) {
    error('词典已存在，请使用不同的名称');
    return;
  }

  // 验证文件路径
  const validation = validateDictPath(newDictPath.value.trim());
  if (!validation.valid) {
    error(validation.message);
    return;
  }

  // 验证通过，添加词典
  const newDict = {
    id: Date.now(),
    name: newDictName.value.trim(),
    path: newDictPath.value.trim(),
    enabled: true,
    order: dictionaries.value.length,
  };

  dictionaries.value.push(newDict);
  saveDictionaries();
  success('词典添加成功');

  // 重置表单
  newDictName.value = '';
  newDictPath.value = '';
  showAddForm.value = false;
};

// 删除词典
const removeDictionary = (dictId) => {
  const dict = dictionaries.value.find((d) => d.id === dictId);
  // TODO window.confirm会utools窗口
  if (dict && window.confirm(`确定要删除词典 "${dict.name}" 吗？`)) {
    dictionaries.value = dictionaries.value.filter((d) => d.id !== dictId);
    saveDictionaries();
    success('词典删除成功');
  }
};

// 切换词典启用状态
const toggleDictionary = (dictId) => {
  const dict = dictionaries.value.find((d) => d.id === dictId);
  if (dict) {
    dict.enabled = !dict.enabled;
    saveDictionaries();
    success(dict.enabled ? '词典已启用' : '词典已禁用');
  }
};

// 拖拽开始
const onDragStart = (event, index) => {
  draggedIndex.value = index;
  isDragActive.value = true;
  event.dataTransfer.effectAllowed = 'move';

  // 获取拖拽项和拖拽手柄的位置信息
  const dragItem = event.currentTarget; // 使用currentTarget获取整个词典项
  const dragHandle = dragItem.querySelector('.drag-handle');
  const itemRect = dragItem.getBoundingClientRect();
  const handleRect = dragHandle ? dragHandle.getBoundingClientRect() : null;

  // 计算拖拽手柄相对于词典项的位置
  const handleOffsetX = handleRect ? handleRect.left - itemRect.left + handleRect.width / 2 : 20;
  const handleOffsetY = handleRect ? handleRect.top - itemRect.top + handleRect.height / 2 : itemRect.height / 2;

  // 创建拖拽镜像
  const clone = dragItem.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.top = '-1000px';
  clone.style.left = '0px';
  clone.style.width = itemRect.width + 'px';
  clone.style.opacity = '0.8';
  clone.style.transform = 'rotate(3deg)';
  clone.style.backgroundColor = 'white';
  clone.style.border = '2px solid #2ed573';
  clone.style.borderRadius = '8px';
  clone.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = '9999';

  // 高亮拖拽手柄
  const cloneHandle = clone.querySelector('.drag-handle');
  if (cloneHandle) {
    cloneHandle.style.color = '#2ed573';
    cloneHandle.style.backgroundColor = 'rgba(46, 213, 115, 0.2)';
    cloneHandle.style.transform = 'scale(1.2)';
    cloneHandle.style.borderRadius = '4px';
  }

  document.body.appendChild(clone);
  dragImageEl.value = clone;

  // 设置拖拽预览，鼠标指针指向拖拽手柄位置
  event.dataTransfer.setDragImage(clone, handleOffsetX, handleOffsetY);

  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', index.toString());

  // 添加拖拽开始动画类
  setTimeout(() => {
    if (dragImageEl.value) {
      dragImageEl.value.style.transform = 'rotate(5deg) scale(1.05)';
    }
  }, 10);
};

// 拖拽结束
const onDragEnd = () => {
  isDragActive.value = false;
  draggedIndex.value = null;
  dragOverIndex.value = null;
  dragInsertPosition.value = null;

  // 清理拖拽镜像
  if (dragImageEl.value) {
    document.body.removeChild(dragImageEl.value);
    dragImageEl.value = null;
  }
};

// 拖拽进入
const onDragEnter = (event, index) => {
  event.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index;

    // 计算插入位置
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseY = event.clientY;
    const itemCenter = rect.top + rect.height / 2;

    const newPosition = mouseY < itemCenter ? 'before' : 'after';

    // 如果位置改变，添加轻微的震动效果
    if (dragInsertPosition.value !== newPosition) {
      event.currentTarget.style.transform = 'scale(1.01)';
      setTimeout(() => {
        if (event.currentTarget) {
          event.currentTarget.style.transform = '';
        }
      }, 100);
    }

    dragInsertPosition.value = newPosition;
  }
};

// 拖拽悬停
const onDragOver = (event) => {
  event.preventDefault();

  if (draggedIndex.value !== null) {
    // 更新插入位置
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseY = event.clientY;
    const itemCenter = rect.top + rect.height / 2;

    dragInsertPosition.value = mouseY < itemCenter ? 'before' : 'after';

    // 动态更新拖拽效果
    event.dataTransfer.dropEffect = 'move';
  }
};

// 拖拽离开
const onDragLeave = (event) => {
  // 只有当鼠标真正离开当前元素时才清除状态
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  // 检查鼠标是否真的离开了元素区域
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dragOverIndex.value = null;
    dragInsertPosition.value = null;

    // 移除悬停效果
    if (event.currentTarget) {
      event.currentTarget.style.transform = '';
    }
  }
};

// 放置
const onDrop = (event, dropIndex) => {
  event.preventDefault();

  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    const draggedItem = dictionaries.value[draggedIndex.value];

    // 添加放置动画效果
    const targetElement = event.currentTarget;
    targetElement.style.transform = 'scale(1.05)';
    targetElement.style.transition = 'transform 0.2s ease';

    // 移除拖拽的项目
    dictionaries.value.splice(draggedIndex.value, 1);

    // 根据插入位置计算最终索引
    let insertIndex = dropIndex;
    if (dragInsertPosition.value === 'after') {
      insertIndex = draggedIndex.value < dropIndex ? dropIndex : dropIndex + 1;
    } else {
      insertIndex = draggedIndex.value < dropIndex ? dropIndex - 1 : dropIndex;
    }

    // 确保索引在有效范围内
    insertIndex = Math.max(0, Math.min(insertIndex, dictionaries.value.length));

    // 插入到新位置
    dictionaries.value.splice(insertIndex, 0, draggedItem);

    // 更新order字段
    dictionaries.value.forEach((dict, index) => {
      dict.order = index;
    });

    saveDictionaries();
    success('词典顺序已更新');

    // 恢复元素状态
    setTimeout(() => {
      if (targetElement) {
        targetElement.style.transform = '';
        targetElement.style.transition = '';
      }
    }, 200);
  }

  // 清除拖拽状态
  isDragActive.value = false;
  draggedIndex.value = null;
  dragOverIndex.value = null;
  dragInsertPosition.value = null;
};

// 选择文件路径
const selectDictPath = () => {
  try {
    const path = window.utools.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '词典文件', extensions: ['mdx'] }],
      title: '选择词典文件',
    });

    if (path && path.length > 0) {
      newDictPath.value = path[0];
      // 实时验证选择的文件
      const validation = validateDictPath(path[0]);
      if (!validation.valid) {
        warning(validation.message);
      } else {
        success('文件路径验证通过');
      }
    }
  } catch (error) {
    error('文件选择失败: ' + error.message);
  }
};

onMounted(() => {
  loadDictionaries();
});
</script>

<template>
  <div class="settings">
    <div class="settings-header">
      <button class="back-btn" @click="onBackClick">
        <ArrowLeft />
      </button>
      <h1>设置</h1>
    </div>

    <div class="settings-content">
      <!-- 词典管理 -->
      <div class="section">
        <h3>词典管理</h3>
        <!-- 已添加的词典列表 -->
        <div class="dictionary-list" :class="{ 'drag-active': isDragActive }">
          <div v-if="dictionaries.length === 0" class="empty-state">
            暂无词典，请添加词典
          </div>
          <div
            v-for="(dict, index) in dictionaries"
            :key="dict.id"
            class="dictionary-item"
            :class="{
              dragging: draggedIndex === index,
              disabled: !dict.enabled,
              'drag-over-before':
                dragOverIndex === index && dragInsertPosition === 'before',
              'drag-over-after':
                dragOverIndex === index && dragInsertPosition === 'after',
              'drag-hover': dragOverIndex === index,
              'not-dragging': isDragActive && draggedIndex !== index,
            }"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragend="onDragEnd"
            @dragenter="onDragEnter($event, index)"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop($event, index)"
          >
            <div class="drag-handle" @mousedown="$event.stopPropagation()">⋮⋮</div>
            <div class="dict-checkbox">
              <input
                type="checkbox"
                :id="`dict-${dict.id}`"
                v-model="dict.enabled"
                @change="toggleDictionary(dict.id)"
              />
              <label :for="`dict-${dict.id}`"></label>
            </div>
            <div class="dict-info">
              <div class="dict-name">{{ dict.name }}</div>
              <div class="dict-path">{{ dict.path }}</div>
            </div>
            <div class="dict-actions">
              <span class="dict-order">{{ index + 1 }}</span>
              <button class="remove-btn" @click="removeDictionary(dict.id)">
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 添加词典按钮 -->
        <button
          v-if="!showAddForm"
          class="add-dict-btn"
          @click="showAddForm = true"
        >
          + 添加词典
        </button>

        <!-- 添加词典表单 -->
        <div v-if="showAddForm" class="add-form">
          <div class="form-row">
            <label>词典名称:</label>
            <div class="path-input">
              <input v-model="newDictName" placeholder="输入词典名称" />
            </div>
          </div>
          <div class="form-row">
            <label>词典路径:</label>
            <div class="path-input">
              <input
                v-model="newDictPath"
                placeholder="输入词典文件路径"
                :class="{
                  'path-valid': pathValidation.valid === true,
                  'path-invalid': pathValidation.valid === false,
                }"
              />
              <button @click="selectDictPath">选择文件</button>
            </div>
            <!-- 路径验证状态显示 -->
            <div
              v-if="pathValidation.message"
              class="validation-message"
              :class="{
                success: pathValidation.valid === true,
                error: pathValidation.valid === false,
              }"
            >
              {{ pathValidation.message }}
            </div>
          </div>
          <div class="form-actions">
            <button
              @click="addDictionary"
              class="confirm-btn"
              :disabled="!newDictName.trim() || pathValidation.valid !== true"
            >
              确定
            </button>
            <button @click="showAddForm = false" class="cancel-btn">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
  padding: 20px;
}

.settings-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 15px;
}

.settings-content {
  align-items: center;
  margin-bottom: 30px;
  gap: 15px;
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

.settings h1 {
  margin: 0;
  font-size: 24px;
}

.section {
  margin-bottom: 40px;
}

.section h3 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

/* 词典管理样式 */
.dictionary-list {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.dictionary-list.drag-active {
  background: rgba(46, 213, 115, 0.02);
  border-radius: 12px;
  padding: 10px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

.dictionary-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  background: white;
  transition: all 0.3s ease;
  position: relative;
  cursor: move;
}

.dictionary-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #2ed573;
}

.dictionary-item.dragging {
  opacity: 0.3;
  transform: rotate(3deg) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border-color: #2ed573;
  background: white;
  filter: brightness(1.1);
}

.dictionary-item.not-dragging {
  opacity: 0.7;
  transform: scale(0.98);
  filter: grayscale(0.2);
}

.dictionary-item.drag-hover {
  transform: scale(1.02);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #2ed573;
  box-shadow: 0 4px 15px rgba(46, 213, 115, 0.2);
}

.dictionary-item.drag-over-before::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2ed573, #00a8ff, #2ed573);
  background-size: 200% 100%;
  border-radius: 2px;
  animation: dropIndicator 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(46, 213, 115, 0.6);
}

.dictionary-item.drag-over-after::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2ed573, #00a8ff, #2ed573);
  background-size: 200% 100%;
  border-radius: 2px;
  animation: dropIndicator 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(46, 213, 115, 0.6);
}

@keyframes dropIndicator {
  0% {
    opacity: 0.6;
    transform: scaleY(1);
    background-position: 0% 0%;
  }
  50% {
    opacity: 1;
    transform: scaleY(1.3);
    background-position: 100% 0%;
  }
  100% {
    opacity: 0.6;
    transform: scaleY(1);
    background-position: 200% 0%;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scaleY(1);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}

.dictionary-item.disabled {
  opacity: 0.6;
  background: #f8f9fa;
}

.drag-handle {
  color: #999;
  margin-right: 10px;
  cursor: grab;
  font-size: 18px;
  user-select: none;
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
  position: relative;
}

.drag-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s ease;
  z-index: -1;
}

.drag-handle:hover {
  color: #2ed573;
  background: rgba(46, 213, 115, 0.1);
  transform: scale(1.1);
}

.drag-handle:hover::before {
  background: rgba(46, 213, 115, 0.1);
  transform: translate(-50%, -50%) scale(1.2);
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(1.2);
  color: #2ed573;
  background: rgba(46, 213, 115, 0.2);
}

.dictionary-item.dragging .drag-handle {
  color: #2ed573;
  background: rgba(46, 213, 115, 0.3);
  transform: scale(1.2);
  animation: dragPulse 0.8s ease-in-out infinite alternate;
}

@keyframes dragPulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.4);
  }
  100% { 
    box-shadow: 0 0 0 8px rgba(46, 213, 115, 0);
  }
}

.dict-checkbox {
  margin-right: 15px;
}

.dict-checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2ed573;
}

.dict-info {
  flex: 1;
  margin-right: 15px;
}

.dict-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dict-order {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  min-width: 24px;
  text-align: center;
}

.dict-info {
  flex: 1;
}

.dict-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.dict-path {
  color: #666;
  font-size: 14px;
  word-break: break-all;
}

.remove-btn {
  background: #ff4757;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background: #ff3740;
}

.add-dict-btn {
  background: #2ed573;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

.add-dict-btn:hover {
  background: #26c661;
}

/* 添加表单样式 */
.add-form {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #f9f9f9;
}

.form-row {
  margin-bottom: 15px;
}

.form-row label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-row input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.path-input {
  display: flex;
  gap: 10px;
}

.path-input input {
  flex: 1;
}

.path-input input.path-valid {
  border-color: #2ed573;
}

.path-input input.path-invalid {
  border-color: #ff4757;
}

.validation-message {
  margin-top: 5px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 3px;
}

.validation-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.validation-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.path-input button {
  background: #3742fa;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.path-input button:hover {
  background: #2f32e6;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn {
  background: #2ed573;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:hover:not(:disabled) {
  background: #26c661;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #747d8c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #5f6b7a;
}

/* 设置项样式 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item label {
  font-weight: 500;
  min-width: 100px;
}

.setting-item select,
.setting-item input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.setting-item input[type='range'] {
  min-width: 120px;
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .settings {
    max-width: 1000px;
    margin: 0 auto;
  }
}
</style>
