<template>
  <div class="settings-app">
    <div class="settings-header">
      <h2>Settings</h2>
      <p>Configure your RPG OS preferences</p>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h3>Appearance</h3>
        
        <div class="setting-item">
          <label>Theme</label>
          <Dropdown
            v-model="localSettings.theme"
            :options="themeOptions"
            optionLabel="label"
            optionValue="value"
            @change="updateSettings"
            class="w-full"
          />
        </div>

        <div class="setting-item">
          <label>Animations</label>
          <div class="toggle-wrapper">
            <InputSwitch v-model="localSettings.animationsEnabled" @change="updateSettings" />
            <span class="toggle-label">{{ localSettings.animationsEnabled ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>

        <div class="setting-item">
          <label>Sound Effects</label>
          <div class="toggle-wrapper">
            <InputSwitch v-model="localSettings.soundEnabled" @change="updateSettings" />
            <span class="toggle-label">{{ localSettings.soundEnabled ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Game Sessions</h3>
        <p class="section-description">Manage your game sessions. Each session has its own dice rolls and journal entries.</p>
        
        <div class="sessions-management">
          <div class="current-session-info" v-if="currentSession">
            <div class="current-session-header">
              <i class="pi pi-circle-fill current-session-indicator"></i>
              <span class="current-session-label">Current Session</span>
            </div>
            <div class="current-session-name">{{ currentSession.name }}</div>
            <div class="current-session-meta">
              Created: {{ formatDate(currentSession.createdAt) }}
            </div>
          </div>

          <div class="sessions-list-section">
            <div class="sessions-list-header">
              <h4>All Sessions</h4>
              <button @click="showCreateForm = !showCreateForm" class="create-session-btn">
                <i class="pi pi-plus"></i>
                New Session
              </button>
            </div>

            <div v-if="showCreateForm" class="create-session-form">
              <input
                v-model="newSessionName"
                @keyup.enter="createSession"
                @keyup.escape="cancelCreate"
                type="text"
                placeholder="Enter session name"
                class="session-name-input"
                ref="sessionNameInputRef"
              />
              <div class="create-actions">
                <button @click="createSession" class="create-btn" :disabled="!newSessionName.trim()">
                  Create
                </button>
                <button @click="cancelCreate" class="cancel-btn">Cancel</button>
              </div>
            </div>

            <div class="sessions-list">
              <div
                v-for="session in sortedSessions"
                :key="session.id"
                class="session-item"
                :class="{ 'current': session.id === currentSessionId }"
              >
                <div class="session-item-content">
                  <div class="session-item-info">
                    <div class="session-item-name">
                      {{ session.name }}
                      <span v-if="session.id === currentSessionId" class="current-badge">Current</span>
                    </div>
                    <div class="session-item-meta">
                      Created: {{ formatDate(session.createdAt) }} • 
                      Last accessed: {{ formatDate(session.lastAccessed) }}
                    </div>
                  </div>
                  <div class="session-item-actions">
                    <button
                      v-if="session.id !== currentSessionId"
                      @click="switchToSession(session.id)"
                      class="action-button switch-button"
                      title="Switch to this session"
                    >
                      <i class="pi pi-sign-in"></i>
                      Switch
                    </button>
                    <button
                      @click="startRenameSession(session)"
                      class="action-button rename-button"
                      title="Rename session"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      @click="confirmDeleteSession(session)"
                      class="action-button delete-button"
                      title="Delete session"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
                <div v-if="editingSessionId === session.id" class="rename-form">
                  <input
                    v-model="editingSessionName"
                    @keyup.enter="saveRename"
                    @keyup.escape="cancelRename"
                    type="text"
                    class="session-name-input"
                    ref="renameInputRef"
                  />
                  <div class="rename-actions">
                    <button @click="saveRename" class="save-btn">Save</button>
                    <button @click="cancelRename" class="cancel-btn">Cancel</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="sessions.length === 0" class="empty-sessions">
              <i class="pi pi-inbox"></i>
              <p>No sessions yet. Create your first session to get started!</p>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>System</h3>
        <div class="setting-item">
          <label>OS Version</label>
          <div class="setting-value">RPOS v1.0.0</div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Delete Session"
      :style="{ width: '400px' }"
    >
      <div class="delete-dialog-content">
        <p>Are you sure you want to delete the session <strong>"{{ deleteConfirmSession?.name }}"</strong>?</p>
        <p class="delete-warning">This will permanently delete all dice rolls and journal entries for this session. This action cannot be undone.</p>
        <p v-if="deleteConfirmSession?.id === currentSessionId" class="delete-warning">
          <strong>Warning:</strong> This is your current session. All application windows will be closed and you will be returned to the session selection screen.
        </p>
      </div>
      <template #footer>
        <Button label="Cancel" @click="cancelDelete" text />
        <Button label="Delete" @click="deleteSession" severity="danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useOSStore } from '../stores/os'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  windowId: String
})

const osStore = useOSStore()
const localSettings = ref({ ...osStore.settings })

const themeOptions = [
  { label: 'Modern', value: 'modern' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' }
]

const showCreateForm = ref(false)
const newSessionName = ref('')
const sessionNameInputRef = ref(null)
const editingSessionId = ref(null)
const editingSessionName = ref('')
const renameInputRef = ref(null)
const deleteConfirmSession = ref(null)
const showDeleteDialog = ref(false)

const sessions = computed(() => osStore.sessions)
const currentSessionId = computed(() => osStore.currentSessionId)
const currentSession = computed(() => osStore.getCurrentSession())

const sortedSessions = computed(() => {
  return [...sessions.value].sort((a, b) => {
    // Current session first
    if (a.id === currentSessionId.value) return -1
    if (b.id === currentSessionId.value) return 1
    // Then by last accessed
    return new Date(b.lastAccessed) - new Date(a.lastAccessed)
  })
})

function updateSettings() {
  osStore.updateSettings(localSettings.value)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  })
}

async function createSession() {
  if (!newSessionName.value.trim()) return
  
  const session = osStore.createSession(newSessionName.value.trim())
  osStore.switchSession(session.id)
  
  showCreateForm.value = false
  newSessionName.value = ''
}

function cancelCreate() {
  showCreateForm.value = false
  newSessionName.value = ''
}

function switchToSession(sessionId) {
  osStore.switchSession(sessionId)
}

function startRenameSession(session) {
  editingSessionId.value = session.id
  editingSessionName.value = session.name
  nextTick(() => {
    renameInputRef.value?.focus()
  })
}

function saveRename() {
  if (editingSessionName.value.trim()) {
    osStore.renameSession(editingSessionId.value, editingSessionName.value.trim())
  }
  cancelRename()
}

function cancelRename() {
  editingSessionId.value = null
  editingSessionName.value = ''
}

function confirmDeleteSession(session) {
  deleteConfirmSession.value = session
  showDeleteDialog.value = true
}

function deleteSession() {
  if (deleteConfirmSession.value) {
    const result = osStore.deleteSession(deleteConfirmSession.value.id)
    if (result && result.success && result.wasCurrentSession) {
      // If current session was deleted, close this settings window
      // The store will have already closed all windows and cleared current session
      // App.vue will handle showing the session selector
      cancelDelete()
      // Emit event to parent to show session selector
      // Since we're in a window, we'll rely on App.vue watching the store
    } else {
      cancelDelete()
    }
  }
}

function cancelDelete() {
  deleteConfirmSession.value = null
  showDeleteDialog.value = false
}

watch(() => osStore.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

watch(showCreateForm, async (show) => {
  if (show) {
    await nextTick()
    sessionNameInputRef.value?.focus()
  }
})
</script>

<style scoped>
.settings-app {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 24px;
}

.settings-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  background: var(--surface-section);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--surface-border);
}

.settings-section h3 {
  margin: 0 0 16px 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
  font-weight: 500;
  font-size: 14px;
}

.setting-value {
  color: var(--text-color-secondary);
  font-size: 14px;
  padding: 8px 0;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label {
  color: var(--text-color);
  font-size: 14px;
}

.section-description {
  margin: 0 0 20px 0;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.sessions-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-session-info {
  padding: 16px;
  background: rgba(var(--primary-color-rgb, 102, 126, 234), 0.1);
  border: 2px solid var(--primary-color);
  border-radius: 8px;
}

.current-session-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.current-session-indicator {
  color: var(--primary-color);
  font-size: 8px;
}

.current-session-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-session-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.current-session-meta {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.sessions-list-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sessions-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sessions-list-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.create-session-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-session-btn:hover {
  opacity: 0.9;
}

.create-session-form {
  padding: 12px;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-name-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  background: var(--surface-section);
  color: var(--text-color);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.session-name-input:focus {
  border-color: var(--primary-color);
}

.create-actions,
.rename-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.create-btn,
.save-btn,
.cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn,
.save-btn {
  background: var(--primary-color);
  color: white;
}

.create-btn:hover:not(:disabled),
.save-btn:hover {
  opacity: 0.9;
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--surface-hover);
  color: var(--text-color);
}

.cancel-btn:hover {
  background: var(--surface-border);
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  overflow: hidden;
}

.session-item.current {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 102, 126, 234), 0.05);
}

.session-item-content {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.session-item-info {
  flex: 1;
  min-width: 0;
}

.session-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 102, 126, 234), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.session-item-meta {
  font-size: 11px;
  color: var(--text-color-secondary);
}

.session-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-button {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: var(--surface-hover);
  color: var(--text-color);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-button:hover {
  background: var(--surface-border);
}

.switch-button {
  background: var(--primary-color);
  color: white;
}

.switch-button:hover {
  opacity: 0.9;
}

.delete-button:hover {
  background: #ef4444;
  color: white;
}

.rename-form {
  padding: 12px;
  background: var(--surface-ground);
  border-top: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-sessions {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color-secondary);
}

.empty-sessions i {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
  display: block;
}

.empty-sessions p {
  margin: 0;
  font-size: 13px;
}

.delete-dialog-content {
  padding: 8px 0;
}

.delete-dialog-content p {
  margin: 0 0 12px 0;
  color: var(--text-color);
  line-height: 1.5;
}

.delete-warning {
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
}
</style>

