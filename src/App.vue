<script setup>
import { onMounted, ref } from 'vue';
import Mdict from '@/components/Mdict.vue';
import ToastContainer from '@/components/ToastContainer.vue';

const route = ref('');
const enterAction = ref({});

onMounted(() => {
  window.utools.onPluginEnter((action) => {
    route.value = action.code;
    enterAction.value = action;
  });
  window.utools.onPluginOut((isKill) => {
    route.value = '';
  });
});
</script>

<template>
  <template v-if="route === 'mdict'">
    <Mdict :enterAction="enterAction"></Mdict>
  </template>
  <!-- Toast 容器 -->
  <ToastContainer />
</template>