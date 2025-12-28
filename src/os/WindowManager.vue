<template>
  <div class="window-manager">
    <Window
      v-for="window in windowStack"
      :key="window.id"
      :window="window"
      :is-active="window.id === activeWindowId"
      @focus="handleFocus"
      @close="handleClose"
      @maximize="handleMaximize"
      @minimize="handleMinimize"
      @update="handleUpdate"
      @help="handleHelp"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOSStore } from '../stores/os'
import Window from './Window.vue'

const osStore = useOSStore()

const windowStack = computed(() => osStore.windowStack)
const activeWindowId = computed(() => osStore.activeWindowId)

function handleFocus(windowId) {
  osStore.focusWindow(windowId)
}

function handleClose(windowId) {
  osStore.closeWindow(windowId)
}

function handleMaximize(windowId) {
  osStore.toggleMaximize(windowId)
}

function handleMinimize(windowId) {
  osStore.toggleMinimize(windowId)
}

function handleUpdate(windowId, updates) {
  osStore.updateWindow(windowId, updates)
}

function handleHelp(windowId) {
  osStore.openHelpWindow(windowId)
}
</script>

<style scoped>
.window-manager {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>

