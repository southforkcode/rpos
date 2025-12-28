<template>
  <div class="desktop" :style="desktopStyles">
    <div class="desktop-background"></div>
    <div class="desktop-content">
      <slot></slot>
    </div>
    <Taskbar />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOSStore } from '../stores/os'
import Taskbar from './Taskbar.vue'

const osStore = useOSStore()

const desktopStyles = computed(() => {
  return {
    background: osStore.settings.wallpaper 
      ? `url(${osStore.settings.wallpaper}) center/cover`
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})
</script>

<style scoped>
.desktop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.desktop-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.desktop-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 48px;
  z-index: 1;
}
</style>

