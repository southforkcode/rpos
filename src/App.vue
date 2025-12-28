<template>
  <Desktop>
    <WindowManager />
    <SessionSelector
      v-if="showSessionSelector"
      :allow-cancel="hasExistingSessions"
      @session-selected="handleSessionSelected"
      @cancel="handleSessionCancel"
    />
    <button
      v-if="!showSessionSelector && currentSession"
      @click="showSessionSelector = true"
      class="session-switcher-button"
      :title="`Current: ${currentSession.name}`"
    >
      <i class="pi pi-refresh"></i>
      <span>{{ currentSession.name }}</span>
    </button>
  </Desktop>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useOSStore } from './stores/os'
import Desktop from './os/Desktop.vue'
import WindowManager from './os/WindowManager.vue'
import SessionSelector from './components/SessionSelector.vue'
import { registerApplications } from './apps/AppRegistry'

const osStore = useOSStore()
const showSessionSelector = ref(false)

const currentSession = computed(() => osStore.getCurrentSession())
const hasExistingSessions = computed(() => osStore.sessions.length > 0)

onMounted(() => {
  // Register all applications
  registerApplications(osStore)
  
  // Show session selector if no current session or no sessions exist
  if (!osStore.currentSessionId || osStore.sessions.length === 0) {
    showSessionSelector.value = true
  }
})

// Watch for when current session is deleted (becomes null)
watch(() => osStore.currentSessionId, (newSessionId) => {
  if (!newSessionId) {
    // Current session was deleted, show session selector
    showSessionSelector.value = true
  }
})

function handleSessionSelected() {
  showSessionSelector.value = false
}

function handleSessionCancel() {
  showSessionSelector.value = false
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.session-switcher-button {
  position: fixed;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.session-switcher-button:hover {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.session-switcher-button i {
  font-size: 14px;
}
</style>
