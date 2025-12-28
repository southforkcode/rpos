<template>
  <div class="taskbar">
    <div class="taskbar-start">
      <button class="start-button" @click="toggleStartMenu" title="Start Menu">
        <i class="pi pi-th-large"></i>
        <span>Start</span>
      </button>
    </div>
    
    <div class="taskbar-center">
      <button
        v-for="window in openWindows"
        :key="window.id"
        :class="['taskbar-item', { active: window.id === activeWindowId }]"
        @click="focusWindow(window.id)"
        :title="window.title"
      >
        <i :class="window.icon || 'pi pi-file'" class="taskbar-icon"></i>
        <span class="taskbar-title">{{ window.title }}</span>
        <button 
          v-if="window.minimized"
          class="taskbar-minimize-indicator"
          @click.stop="toggleMinimize(window.id)"
        ></button>
      </button>
    </div>

    <div class="taskbar-end">
      <div class="taskbar-time">
        {{ currentTime }}
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showStartMenu" class="start-menu" ref="startMenuRef">
        <div class="start-menu-section">
          <div class="start-menu-header">Applications</div>
          <div
            v-for="app in applications"
            :key="app.id"
            class="start-menu-item"
            @click="launchApp(app.id)"
          >
            <i :class="app.icon || 'pi pi-file'" class="start-menu-icon"></i>
            <span>{{ app.name }}</span>
          </div>
        </div>
        <div class="start-menu-divider"></div>
        <div
          class="start-menu-item"
          @click="launchApp('settings')"
        >
          <i class="pi pi-cog start-menu-icon"></i>
          <span>Settings</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOSStore } from '../stores/os'

const osStore = useOSStore()
const showStartMenu = ref(false)
const startMenuRef = ref(null)

const openWindows = computed(() => osStore.windows)
const activeWindowId = computed(() => osStore.activeWindowId)
const applications = computed(() => osStore.applications)

const currentTime = ref('')

function toggleStartMenu(e) {
  showStartMenu.value = !showStartMenu.value
}

function launchApp(appId) {
  osStore.launchApplication(appId)
  showStartMenu.value = false
}

function focusWindow(windowId) {
  const window = osStore.windows.find(w => w.id === windowId)
  if (window && window.minimized) {
    osStore.toggleMinimize(windowId)
  } else {
    osStore.focusWindow(windowId)
  }
}

function toggleMinimize(windowId) {
  osStore.toggleMinimize(windowId)
}

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

let timeInterval = null

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  // Close start menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.start-button') && !e.target.closest('.start-menu')) {
      showStartMenu.value = false
    }
  })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

.taskbar-start {
  display: flex;
  align-items: center;
}

.start-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.start-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.taskbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  padding: 0 12px;
}

.taskbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  position: relative;
  min-width: 120px;
  max-width: 200px;
}

.taskbar-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.taskbar-item.active {
  background: rgba(255, 255, 255, 0.15);
  border-bottom: 2px solid #667eea;
}

.taskbar-icon {
  font-size: 14px;
}

.taskbar-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taskbar-minimize-indicator {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  border: none;
  padding: 0;
}

.taskbar-end {
  display: flex;
  align-items: center;
}

.taskbar-time {
  color: white;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.start-menu {
  position: fixed;
  bottom: 52px;
  left: 12px;
  width: 280px;
  background: rgba(30, 30, 30, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px;
  z-index: 10000;
  max-height: 400px;
  overflow-y: auto;
}

.start-menu-section {
  margin-bottom: 8px;
}

.start-menu-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.start-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
  font-size: 14px;
}

.start-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.start-menu-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.start-menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}
</style>

