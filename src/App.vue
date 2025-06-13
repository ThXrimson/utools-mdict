<script setup>
import { ref } from 'vue';
import Mdict from './components/Mdict.vue';

const initialSearch = ref('');
const initialized = ref(false);

window.utools.onPluginEnter((action) => {
  initialSearch.value = action.payload || '';
  initialized.value = true;
});
window.utools.onPluginOut((isKill) => {});
</script>

<template>
  <Mdict v-if="initialized" :initial-search="initialSearch" />
</template>
