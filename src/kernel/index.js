/**
 * RPOS Kernel - Core API layer for applications
 * Provides system-level services that applications can use
 */

class Kernel {
  constructor() {
    this.services = new Map()
    this.eventBus = new EventTarget()
  }

  /**
   * Register a kernel service
   */
  registerService(name, service) {
    this.services.set(name, service)
  }

  /**
   * Get a kernel service
   */
  getService(name) {
    return this.services.get(name)
  }

  /**
   * Emit a kernel event
   */
  emit(eventName, data) {
    this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }))
  }

  /**
   * Listen to kernel events
   */
  on(eventName, callback) {
    this.eventBus.addEventListener(eventName, callback)
  }

  /**
   * Remove event listener
   */
  off(eventName, callback) {
    this.eventBus.removeEventListener(eventName, callback)
  }
}

// Create singleton instance
export const kernel = new Kernel()

// Storage Service
class StorageService {
  constructor() {
    this.prefix = 'rpos-app-'
  }

  set(appId, key, value) {
    const storageKey = `${this.prefix}${appId}-${key}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set failed:', e)
      return false
    }
  }

  get(appId, key, defaultValue = null) {
    const storageKey = `${this.prefix}${appId}-${key}`
    try {
      const value = localStorage.getItem(storageKey)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('Storage get failed:', e)
      return defaultValue
    }
  }

  remove(appId, key) {
    const storageKey = `${this.prefix}${appId}-${key}`
    localStorage.removeItem(storageKey)
  }

  clear(appId) {
    const prefix = `${this.prefix}${appId}-`
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Notification Service
class NotificationService {
  constructor() {
    this.notifications = []
    this.nextId = 1
  }

  show(title, message, type = 'info', duration = 5000) {
    const notification = {
      id: this.nextId++,
      title,
      message,
      type,
      timestamp: Date.now(),
      duration
    }

    this.notifications.push(notification)
    kernel.emit('notification', notification)

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id)
      }, duration)
    }

    return notification.id
  }

  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      this.notifications.splice(index, 1)
      kernel.emit('notification-dismissed', id)
    }
  }

  getNotifications() {
    return [...this.notifications]
  }
}

// Initialize kernel services
kernel.registerService('storage', new StorageService())
kernel.registerService('notifications', new NotificationService())

export default kernel

