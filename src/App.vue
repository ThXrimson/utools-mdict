<script lang="ts" setup>
import { ref } from 'vue'
import Mdict from './components/MdictMain.vue'
import { useDictStore } from './stores/dictStore.js'

const searchTerm = ref('')

const dictStore = useDictStore()
dictStore.loadDictItems()

window.utools.onPluginEnter((action) => {
  window.services.trie.init()
  searchTerm.value = action.payload || ''
})

window.utools.onPluginOut((isKill) => {
  if (isKill) {
    dictStore.dictItems
      .map((item) => item.id)
      .forEach((id) => dictStore.deleteDict(id))
  }
})
</script>

<template>
  <Mdict :searchTerm="searchTerm" />
</template>
