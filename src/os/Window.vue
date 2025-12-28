<template>
  <Teleport to="body">
    <div
      v-if="!window.minimized"
      :class="['window', { 'maximized': window.maximized, 'active': isActive }]"
      :style="windowStyles"
      @mousedown="handleMouseDown"
      @click="handleClick"
    >
      <div class="window-header" @mousedown.stop="handleHeaderMouseDown">
        <div class="window-title">
          <i :class="window.icon" v-if="window.icon" class="window-icon"></i>
          {{ window.title }}
        </div>
        <div class="window-actions">
          <!-- Custom application titlebar buttons -->
          <button
            v-for="button in window.titlebarButtons || []"
            :key="button.id"
            class="control-btn app-button"
            :class="{ 
              disabled: button.enabled === false,
              active: button.active === true
            }"
            :disabled="button.enabled === false"
            @click.stop="handleTitlebarButtonClick(button)"
            :title="button.title || ''"
          >
            <i :class="button.icon"></i>
          </button>
          <!-- System help button -->
          <button 
            v-if="window.helpContent && !isHelpWindow" 
            class="control-btn help" 
            @click.stop="handleHelp" 
            title="Help"
          >
            <i class="pi pi-question-circle"></i>
          </button>
        </div>
        <div class="window-controls">
          <button class="control-btn minimize" @click.stop="handleMinimize" title="Minimize">
            <i class="pi pi-window-minimize"></i>
          </button>
          <button 
            v-if="!window.maximized"
            class="control-btn maximize" 
            @click.stop="handleMaximize" 
            title="Maximize"
          >
            <i class="pi pi-window-maximize"></i>
          </button>
          <button 
            v-if="window.maximized"
            class="control-btn restore" 
            @click.stop="handleMaximize" 
            title="Restore"
          >
            <i class="pi pi-sort-down-fill"></i>
          </button>
          <button class="control-btn close" @click.stop="handleClose" title="Close">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
      <div class="window-content">
        <component 
          :is="window.component" 
          :window-id="window.id"
          :help-content="window.helpContent"
        />
      </div>
      <div
        v-if="!window.maximized"
        class="resize-handle"
        @mousedown.stop="handleResizeStart"
      ></div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useOSStore } from '../stores/os'

const props = defineProps({
  window: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['focus', 'close', 'maximize', 'minimize', 'update', 'help'])

const osStore = useOSStore()
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

const isHelpWindow = computed(() => {
  return props.window.appId && props.window.appId.endsWith('-help')
})

const windowStyles = computed(() => {
  if (props.window.maximized) {
    return {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: props.window.zIndex
    }
  }
  return {
    position: 'fixed',
    top: `${props.window.y}px`,
    left: `${props.window.x}px`,
    width: `${props.window.width}px`,
    height: `${props.window.height}px`,
    zIndex: props.window.zIndex
  }
})

function handleClick() {
  emit('focus', props.window.id)
}

function handleMouseDown() {
  emit('focus', props.window.id)
}

function handleHeaderMouseDown(e) {
  if (props.window.maximized) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - props.window.x,
    y: e.clientY - props.window.y
  }

  const handleMouseMove = (e) => {
    if (!isDragging.value) return
    
    const newX = e.clientX - dragStart.value.x
    const newY = e.clientY - dragStart.value.y
    
    emit('update', props.window.id, {
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    })
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  emit('focus', props.window.id)
}

function handleClose() {
  emit('close', props.window.id)
}

function handleMaximize() {
  emit('maximize', props.window.id)
}

function handleMinimize() {
  emit('minimize', props.window.id)
}

function handleHelp() {
  emit('help', props.window.id)
}

function handleTitlebarButtonClick(button) {
  if (button.enabled === false) return
  if (button.handler && typeof button.handler === 'function') {
    button.handler()
  }
}

function handleResizeStart(e) {
  if (props.window.maximized) return
  
  isResizing.value = true
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: props.window.width,
    height: props.window.height
  }

  const handleMouseMove = (e) => {
    if (!isResizing.value) return
    
    const deltaX = e.clientX - resizeStart.value.x
    const deltaY = e.clientY - resizeStart.value.y
    
    const newWidth = Math.max(
      props.window.minWidth || 300,
      resizeStart.value.width + deltaX
    )
    const newHeight = Math.max(
      props.window.minHeight || 200,
      resizeStart.value.height + deltaY
    )
    
    emit('update', props.window.id, {
      width: newWidth,
      height: newHeight
    })
  }

  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  emit('focus', props.window.id)
}
</script>

<style scoped>
.window {
  background: var(--surface-ground);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: all;
  transition: box-shadow 0.2s;
  position: relative;
}

.window.active {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
}

.window.maximized {
  border-radius: 0;
}

.window-header {
  background: var(--surface-section);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: move;
  user-select: none;
  min-height: 40px;
}

.window-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-color);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-icon {
  font-size: 14px;
}

.window-actions {
  display: flex;
  gap: 4px;
  margin-right: 8px;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
  transition: all 0.2s;
}

.control-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.control-btn.close:hover {
  background: #ef4444;
  color: white;
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.disabled:hover {
  background: transparent;
  color: var(--text-color-secondary);
}

.control-btn.app-button.active {
  background: var(--primary-color);
  color: white;
}

.control-btn.app-button.active:hover {
  background: var(--primary-color);
  opacity: 0.9;
}

.window-content {
  flex: 1;
  overflow: auto;
  background: var(--surface-ground);
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  z-index: 10;
  background: linear-gradient(
    -45deg,
    transparent 0%,
    transparent 30%,
    var(--surface-border) 30%,
    var(--surface-border) 35%,
    transparent 35%,
    transparent 65%,
    var(--surface-border) 65%,
    var(--surface-border) 70%,
    transparent 70%
  );
}

.resize-handle:hover {
  background: linear-gradient(
    -45deg,
    transparent 0%,
    transparent 30%,
    var(--primary-color) 30%,
    var(--primary-color) 35%,
    transparent 35%,
    transparent 65%,
    var(--primary-color) 65%,
    var(--primary-color) 70%,
    transparent 70%
  );
}
</style>

