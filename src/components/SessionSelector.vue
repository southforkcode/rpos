<template>
  <div class="session-selector-overlay" @click.self="handleOverlayClick">
    <div class="session-selector">
      <div class="session-selector-header">
        <h2>Select Game Session</h2>
        <p>Choose an existing session or create a new one to get started</p>
      </div>

      <div class="session-selector-content">
        <!-- Create New Session -->
        <div class="create-session-section">
          <button 
            @click="showCreateForm = !showCreateForm"
            class="create-session-button"
            :class="{ 'active': showCreateForm }"
          >
            <i class="pi pi-plus"></i>
            <span>Create New Session</span>
          </button>
          
          <div v-if="showCreateForm" class="create-session-form">
            <input
              v-model="newSessionName"
              @keyup.enter="createNewSession"
              @keyup.escape="cancelCreate"
              type="text"
              placeholder="Enter session name (e.g., 'Campaign 1', 'One-Shot Adventure')"
              class="session-name-input"
              ref="sessionNameInputRef"
            />
            <div class="create-session-actions">
              <button @click="createNewSession" class="create-button" :disabled="!newSessionName.trim()">
                Create
              </button>
              <button @click="cancelCreate" class="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Close Current Session -->
        <div v-if="currentSessionId && currentSession" class="close-session-section">
          <button 
            @click="closeCurrentSession"
            class="close-session-button"
          >
            <i class="pi pi-sign-out"></i>
            <span>Close Current Session</span>
          </button>
          <p class="close-session-description">Close all application windows and return to session selection</p>
        </div>

        <!-- Existing Sessions -->
        <div v-if="sessions.length > 0" class="sessions-section">
          <div class="sessions-header">
            <h3>Existing Sessions</h3>
            <span class="sessions-count">{{ sessions.length }} session{{ sessions.length !== 1 ? 's' : '' }}</span>
          </div>
          
          <div class="sessions-list">
            <div
              v-for="session in sortedSessions"
              :key="session.id"
              class="session-item"
              :class="{ 'current': session.id === currentSessionId }"
              @click="selectSession(session.id)"
            >
              <div class="session-info">
                <div class="session-name">{{ session.name }}</div>
                <div class="session-meta">
                  <span class="session-date">
                    Created: {{ formatDate(session.createdAt) }}
                  </span>
                  <span v-if="session.lastAccessed !== session.createdAt" class="session-date">
                    Last accessed: {{ formatDate(session.lastAccessed) }}
                  </span>
                </div>
              </div>
              <div class="session-actions">
                <button
                  @click.stop="confirmDeleteSession(session)"
                  class="delete-button"
                  title="Delete session"
                >
                  <i class="pi pi-trash"></i>
                </button>
                <i class="pi pi-chevron-right session-arrow"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <p>No sessions yet. Create your first session to get started!</p>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useOSStore } from '../stores/os'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  allowCancel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['session-selected', 'cancel'])

const osStore = useOSStore()
const showCreateForm = ref(false)
const newSessionName = ref('')
const sessionNameInputRef = ref(null)
const deleteConfirmSession = ref(null)
const showDeleteDialog = ref(false)

const sessions = computed(() => osStore.sessions)
const currentSessionId = computed(() => osStore.currentSessionId)
const currentSession = computed(() => osStore.getCurrentSession())

const sortedSessions = computed(() => {
  return [...sessions.value].sort((a, b) => {
    return new Date(b.lastAccessed) - new Date(a.lastAccessed)
  })
})

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

async function createNewSession() {
  if (!newSessionName.value.trim()) return
  
  const session = osStore.createSession(newSessionName.value.trim())
  osStore.switchSession(session.id)
  
  showCreateForm.value = false
  newSessionName.value = ''
  
  emit('session-selected', session.id)
}

function cancelCreate() {
  showCreateForm.value = false
  newSessionName.value = ''
}

function selectSession(sessionId) {
  osStore.switchSession(sessionId)
  emit('session-selected', sessionId)
}

function handleOverlayClick() {
  if (props.allowCancel) {
    emit('cancel')
  }
}

function confirmDeleteSession(session) {
  deleteConfirmSession.value = session
  showDeleteDialog.value = true
}

function deleteSession() {
  if (deleteConfirmSession.value) {
    const result = osStore.deleteSession(deleteConfirmSession.value.id)
    if (result && result.success) {
      // If the current session was deleted, emit event to show session selector
      if (result.wasCurrentSession) {
        // Session selector is already shown, just refresh
        // The store will have already closed all windows and cleared current session
      }
    }
    cancelDelete()
  }
}

function cancelDelete() {
  deleteConfirmSession.value = null
  showDeleteDialog.value = false
}

function closeCurrentSession() {
  osStore.closeSession()
  // Session selector will remain visible since currentSessionId is now null
  // App.vue will handle keeping it visible
}

onMounted(async () => {
  // Focus input when create form is shown
  if (showCreateForm.value) {
    await nextTick()
    sessionNameInputRef.value?.focus()
  }
})
</script>

<style scoped>
.session-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
}

.session-selector {
  background: var(--surface-ground);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.session-selector-header {
  padding: 24px;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-section);
}

.session-selector-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 24px;
  font-weight: 600;
}

.session-selector-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.session-selector-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.create-session-section {
  margin-bottom: 32px;
}

.close-session-section {
  margin-bottom: 32px;
  padding: 16px;
  background: var(--surface-section);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.close-session-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--surface-hover);
  color: var(--text-color);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.close-session-button:hover {
  background: var(--surface-border);
  border-color: var(--text-color-secondary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.close-session-description {
  margin: 8px 0 0 0;
  color: var(--text-color-secondary);
  font-size: 12px;
  text-align: center;
}

.create-session-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-session-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.create-session-button.active {
  background: var(--surface-hover);
  color: var(--text-color);
}

.create-session-form {
  margin-top: 16px;
  padding: 16px;
  background: var(--surface-section);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.session-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface-ground);
  color: var(--text-color);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.session-name-input:focus {
  border-color: var(--primary-color);
}

.create-session-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.create-button,
.cancel-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-button {
  background: var(--primary-color);
  color: white;
}

.create-button:hover:not(:disabled) {
  opacity: 0.9;
}

.create-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-button {
  background: var(--surface-hover);
  color: var(--text-color);
}

.cancel-button:hover {
  background: var(--surface-border);
}

.sessions-section {
  margin-top: 24px;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sessions-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.sessions-count {
  color: var(--text-color-secondary);
  font-size: 13px;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--surface-section);
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
  transform: translateX(4px);
}

.session-item.current {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 102, 126, 234), 0.1);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.session-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-date {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.session-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.delete-button {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.session-arrow {
  color: var(--text-color-secondary);
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
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

