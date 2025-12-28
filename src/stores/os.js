import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import HelpWindow from '../components/HelpWindow.vue'

export const useOSStore = defineStore('os', () => {
  // OS State
  const windows = ref([])
  const activeWindowId = ref(null)
  const settings = ref({
    theme: 'modern',
    wallpaper: null,
    soundEnabled: true,
    animationsEnabled: true
  })
  const applications = ref([])
  const nextWindowId = ref(1)
  
  // Z-index management - start menu is at 10000, so windows must stay below
  const MAX_WINDOW_Z_INDEX = 9999
  
  // Session Management
  const currentSessionId = ref(null)
  const sessions = ref([])

  // Computed
  const activeWindow = computed(() => {
    return windows.value.find(w => w.id === activeWindowId.value)
  })

  const windowStack = computed(() => {
    return [...windows.value].sort((a, b) => b.zIndex - a.zIndex)
  })

  // Actions
  function registerApplication(app) {
    if (!applications.value.find(a => a.id === app.id)) {
      applications.value.push(app)
    }
  }

  function launchApplication(appId, options = {}) {
    const app = applications.value.find(a => a.id === appId)
    if (!app) {
      console.error(`Application ${appId} not found`)
      return null
    }

    // Get help content from component if available, or from app registry entry as fallback
    let helpContent = null
    if (app.component && app.component.helpContent) {
      helpContent = app.component.helpContent
    } else if (app.helpContent) {
      helpContent = app.helpContent
    }

    const window = {
      id: `window-${nextWindowId.value++}`,
      appId: app.id,
      title: app.name,
      component: app.component,
      icon: app.icon,
      helpContent: helpContent,
      x: options.x ?? 100 + (windows.value.length * 30),
      y: options.y ?? 100 + (windows.value.length * 30),
      width: options.width ?? app.defaultWidth ?? 800,
      height: options.height ?? app.defaultHeight ?? 600,
      minWidth: app.minWidth ?? 400,
      minHeight: app.minHeight ?? 300,
      maximized: false,
      minimized: false,
      zIndex: Math.min(Math.max(...windows.value.map(w => w.zIndex), 0) + 1, MAX_WINDOW_Z_INDEX),
      ...options
    }

    windows.value.push(window)
    activeWindowId.value = window.id
    return window
  }

  function closeWindow(windowId) {
    const index = windows.value.findIndex(w => w.id === windowId)
    if (index !== -1) {
      windows.value.splice(index, 1)
      if (activeWindowId.value === windowId) {
        activeWindowId.value = windows.value.length > 0 
          ? windows.value[windows.value.length - 1].id 
          : null
      }
    }
  }

  function focusWindow(windowId) {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      const maxZ = Math.max(...windows.value.map(w => w.zIndex))
      const newZ = Math.min(maxZ + 1, MAX_WINDOW_Z_INDEX)
      // If we've hit the max, normalize all z-indexes to make room
      if (newZ >= MAX_WINDOW_Z_INDEX && maxZ >= MAX_WINDOW_Z_INDEX) {
        windows.value.forEach((w, index) => {
          w.zIndex = index + 1
        })
        window.zIndex = windows.value.length
      } else {
        window.zIndex = newZ
      }
      activeWindowId.value = windowId
    }
  }

  function updateWindow(windowId, updates) {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      Object.assign(window, updates)
    }
  }

  function toggleMaximize(windowId) {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      if (!window.maximized) {
        // Save the current state before maximizing
        window.previousX = window.x
        window.previousY = window.y
        window.previousWidth = window.width
        window.previousHeight = window.height
        window.maximized = true
      } else {
        // Restore the previous state when unmaximizing
        window.maximized = false
        if (window.previousX !== undefined) {
          window.x = window.previousX
          window.y = window.previousY
          window.width = window.previousWidth
          window.height = window.previousHeight
        }
      }
    }
  }

  function toggleMinimize(windowId) {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.minimized = !window.minimized
      if (!window.minimized) {
        focusWindow(windowId)
      }
    }
  }

  function updateSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    // Persist to localStorage
    localStorage.setItem('rpos-settings', JSON.stringify(settings.value))
  }

  function loadSettings() {
    const saved = localStorage.getItem('rpos-settings')
    if (saved) {
      try {
        settings.value = { ...settings.value, ...JSON.parse(saved) }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }

  function openHelpWindow(windowId) {
    const window = windows.value.find(w => w.id === windowId)
    if (!window || !window.helpContent) {
      return null
    }

    // Check if help window already exists for this app
    const existingHelpWindow = windows.value.find(
      w => w.appId === `${window.appId}-help`
    )
    if (existingHelpWindow) {
      focusWindow(existingHelpWindow.id)
      return existingHelpWindow
    }

    // Create a new help window (non-modal)
    const helpWindow = {
      id: `window-${nextWindowId.value++}`,
      appId: `${window.appId}-help`,
      title: `${window.title} - Help`,
      component: HelpWindow,
      helpContent: window.helpContent,
      x: window.x + 50,
      y: window.y + 50,
      width: 500,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      maximized: false,
      minimized: false,
      zIndex: Math.min(Math.max(...windows.value.map(w => w.zIndex), 0) + 1, MAX_WINDOW_Z_INDEX)
    }

    windows.value.push(helpWindow)
    activeWindowId.value = helpWindow.id
    return helpWindow
  }

  // Titlebar buttons management API
  function setTitlebarButtons(windowId, buttons) {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      window.titlebarButtons = buttons || []
    }
  }

  function addTitlebarButton(windowId, button) {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      if (!window.titlebarButtons) {
        window.titlebarButtons = []
      }
      // Check if button with same id already exists
      const existingIndex = window.titlebarButtons.findIndex(b => b.id === button.id)
      if (existingIndex !== -1) {
        // Update existing button
        window.titlebarButtons[existingIndex] = { ...window.titlebarButtons[existingIndex], ...button }
      } else {
        // Add new button
        window.titlebarButtons.push(button)
      }
    }
  }

  function removeTitlebarButton(windowId, buttonId) {
    const window = windows.value.find(w => w.id === windowId)
    if (window && window.titlebarButtons) {
      const index = window.titlebarButtons.findIndex(b => b.id === buttonId)
      if (index !== -1) {
        window.titlebarButtons.splice(index, 1)
      }
    }
  }

  function updateTitlebarButton(windowId, buttonId, updates) {
    const window = windows.value.find(w => w.id === windowId)
    if (window && window.titlebarButtons) {
      const button = window.titlebarButtons.find(b => b.id === buttonId)
      if (button) {
        Object.assign(button, updates)
      }
    }
  }

  // Session Management Functions
  function createSession(name) {
    const session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Session ${sessions.value.length + 1}`,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }
    sessions.value.push(session)
    saveSessions()
    return session
  }

  function switchSession(sessionId) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) {
      console.error(`Session ${sessionId} not found`)
      return false
    }
    
    // Update last accessed
    session.lastAccessed = new Date().toISOString()
    saveSessions()
    
    // Set current session
    currentSessionId.value = sessionId
    localStorage.setItem('rpos-current-session', sessionId)
    
    // Close all windows when switching sessions
    windows.value = []
    activeWindowId.value = null
    
    return true
  }

  function closeSession() {
    if (!currentSessionId.value) {
      return false
    }
    
    // Close all windows
    windows.value = []
    activeWindowId.value = null
    
    // Clear current session (but don't delete it)
    currentSessionId.value = null
    localStorage.removeItem('rpos-current-session')
    
    return true
  }

  function deleteSession(sessionId) {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index === -1) {
      return { success: false, wasCurrentSession: false }
    }
    
    const isCurrentSession = currentSessionId.value === sessionId
    
    // Delete session data from localStorage
    const session = sessions.value[index]
    const keysToDelete = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`session-${sessionId}-`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key))
    
    // Remove session from list
    sessions.value.splice(index, 1)
    saveSessions()
    
    // If deleting current session, close all windows and clear current session
    // User will be brought back to session selection screen
    if (isCurrentSession) {
      windows.value = []
      activeWindowId.value = null
      currentSessionId.value = null
      localStorage.removeItem('rpos-current-session')
      // Don't auto-switch to another session - let user choose from session selector
    }
    
    return { success: true, wasCurrentSession: isCurrentSession }
  }

  function renameSession(sessionId, newName) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) {
      return false
    }
    session.name = newName.trim() || session.name
    saveSessions()
    return true
  }

  function loadSessions() {
    try {
      const saved = localStorage.getItem('rpos-sessions')
      if (saved) {
        sessions.value = JSON.parse(saved)
      }
      
      // Load current session
      const currentSession = localStorage.getItem('rpos-current-session')
      if (currentSession && sessions.value.find(s => s.id === currentSession)) {
        currentSessionId.value = currentSession
      } else if (sessions.value.length > 0) {
        // If no valid current session, use the first one
        currentSessionId.value = sessions.value[0].id
        localStorage.setItem('rpos-current-session', currentSessionId.value)
      }
    } catch (e) {
      console.error('Failed to load sessions:', e)
      sessions.value = []
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem('rpos-sessions', JSON.stringify(sessions.value))
    } catch (e) {
      console.error('Failed to save sessions:', e)
    }
  }

  function getCurrentSession() {
    return sessions.value.find(s => s.id === currentSessionId.value)
  }

  function getSessionStorageKey(key) {
    if (!currentSessionId.value) {
      return key
    }
    return `session-${currentSessionId.value}-${key}`
  }

  // Initialize
  loadSettings()
  loadSessions()

  return {
    // State
    windows,
    activeWindowId,
    settings,
    applications,
    currentSessionId,
    sessions,
    // Computed
    activeWindow,
    windowStack,
    // Actions
    registerApplication,
    launchApplication,
    closeWindow,
    focusWindow,
    updateWindow,
    toggleMaximize,
    toggleMinimize,
    updateSettings,
    loadSettings,
    openHelpWindow,
    // Titlebar buttons API
    setTitlebarButtons,
    addTitlebarButton,
    removeTitlebarButton,
    updateTitlebarButton,
    // Session Management
    createSession,
    switchSession,
    closeSession,
    deleteSession,
    renameSession,
    loadSessions,
    getCurrentSession,
    getSessionStorageKey
  }
})

