# RPOS Kernel API

The kernel provides system-level services that applications can use.

## Available Services

### Storage Service

Persistent storage for application data, namespaced by application ID.

```javascript
import { kernel } from '../kernel'

const storage = kernel.getService('storage')

// Set data
storage.set('my-app', 'user-preferences', { theme: 'dark' })

// Get data
const prefs = storage.get('my-app', 'user-preferences', {})

// Remove data
storage.remove('my-app', 'user-preferences')

// Clear all app data
storage.clear('my-app')
```

### Notification Service

Show system-wide notifications.

```javascript
import { kernel } from '../kernel'

const notifications = kernel.getService('notifications')

// Show notification
const id = notifications.show(
  'Title',
  'Message content',
  'info',  // type: 'info' | 'success' | 'warn' | 'error'
  5000     // duration in ms (0 = persistent)
)

// Dismiss notification
notifications.dismiss(id)

// Get all notifications
const all = notifications.getNotifications()
```

### Event Bus

Listen to and emit system-wide events.

```javascript
import { kernel } from '../kernel'

// Listen to events
kernel.on('notification', (event) => {
  console.log('Notification:', event.detail)
})

// Emit events
kernel.emit('my-event', { data: 'value' })

// Remove listener
const handler = (event) => { /* ... */ }
kernel.on('my-event', handler)
kernel.off('my-event', handler)
```

## Registering Custom Services

Applications can register custom kernel services:

```javascript
import { kernel } from '../kernel'

class MyService {
  doSomething() {
    return 'result'
  }
}

kernel.registerService('my-service', new MyService())
const service = kernel.getService('my-service')
```

