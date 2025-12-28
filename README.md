# RPOS - RPG Operating System

A web-based operating system for managing tabletop role-playing games. RPOS provides a graphical desktop environment where RPG management applications run as applets within a single window system.

## Features

- **Window Management**: Full windowing system with drag, resize, minimize, maximize, and close
- **Application Framework**: Separate applications from the underlying OS kernel
- **Kernel API**: Web APIs for applications to access system services (storage, notifications, etc.)
- **Settings Application**: Global preferences management
- **Modern UI**: Built with Vue 3 and PrimeVue for a slick, responsive experience
- **Drag & Drop**: Point-and-click interface with drag-and-drop support

## Project Structure

```
src/
├── kernel/           # OS kernel layer - core APIs and services
│   └── index.js      # Kernel singleton with service registry
├── os/               # Operating system UI components
│   ├── Desktop.vue   # Desktop environment
│   ├── WindowManager.vue  # Manages all application windows
│   ├── Window.vue     # Individual window component
│   └── Taskbar.vue   # System taskbar with start menu
├── apps/             # Applications
│   ├── AppRegistry.js  # Application registration
│   └── SettingsApp.vue # Settings application
├── stores/           # Pinia state management
│   └── os.js         # OS state store
├── App.vue           # Root component
└── main.js           # Application entry point
```

## Architecture

### Kernel Layer
The kernel provides system-level services that applications can use:
- **Storage Service**: Persistent storage for application data
- **Notification Service**: System-wide notifications
- **Event Bus**: Inter-application communication

### Application Framework
Applications are registered in `AppRegistry.js` and can be launched through the OS. Each application:
- Has a unique ID, name, and icon
- Defines its default window size and constraints
- Provides a Vue component that renders inside a window

### Window System
Windows are managed by the `WindowManager` and support:
- Dragging by header
- Resizing (coming soon)
- Minimize/Maximize/Close
- Z-index management for focus
- Multiple windows

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Adding New Applications

1. Create your application component in `src/apps/`
2. Register it in `src/apps/AppRegistry.js`:

```javascript
{
  id: 'my-app',
  name: 'My Application',
  icon: 'pi pi-star',
  component: MyAppComponent,
  defaultWidth: 800,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 300
}
```

3. Launch it programmatically:
```javascript
import { useOSStore } from './stores/os'
const osStore = useOSStore()
osStore.launchApplication('my-app')
```

## Using Kernel Services

Applications can access kernel services:

```javascript
import { kernel } from '../kernel'

// Storage
const storage = kernel.getService('storage')
storage.set('my-app', 'key', value)
const value = storage.get('my-app', 'key')

// Notifications
const notifications = kernel.getService('notifications')
notifications.show('Title', 'Message', 'info', 5000)
```

## Technologies

- **Vue 3**: Progressive JavaScript framework
- **Pinia**: State management
- **PrimeVue**: Modern UI component library
- **Vite**: Build tool and dev server

## License

MIT
