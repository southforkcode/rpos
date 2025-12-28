<template>
  <div class="journal-app">
    <div v-if="lastSaved" class="save-status">
      <i class="pi pi-check-circle"></i>
      <span>Saved {{ lastSaved }}</span>
    </div>

    <div class="journal-content">
      <!-- Edit Mode -->
      <div v-if="viewMode === 'edit'" class="editor-container">
        <textarea
          v-model="content"
          @input="handleInput"
          class="journal-editor"
          placeholder="Start writing your journal entry here...&#10;&#10;You can use Markdown formatting:&#10;* **Bold text**&#10;* *Italic text*&#10;* # Headings&#10;* - Lists&#10;* [Links](url)&#10;* &gt; Blockquotes&#10;* \`Code\`"
          spellcheck="true"
        ></textarea>
      </div>

      <!-- View Mode -->
      <div v-else class="view-container">
        <div class="markdown-content" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { marked } from 'marked'
import { useOSStore } from '../stores/os'

const osStore = useOSStore()

const props = defineProps({
  windowId: String
})

const content = ref('')
const viewMode = ref('edit')
const lastSaved = ref(null)
let saveTimeout = null

function getStorageKey() {
  return osStore.getSessionStorageKey('journal-content')
}

// Configure marked for GitLab-flavored markdown
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true // GitHub Flavored Markdown (similar to GitLab)
})

const renderedContent = computed(() => {
  if (!content.value.trim()) {
    return '<p class="empty-state">No content yet. Switch to Edit mode to start writing.</p>'
  }
  try {
    return marked.parse(content.value)
  } catch (e) {
    console.error('Markdown parsing error:', e)
    return '<p class="error-state">Error rendering markdown. Please check your syntax.</p>'
  }
})

function handleInput() {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // Debounce save - save after 1 second of no typing
  saveTimeout = setTimeout(() => {
    saveContent()
  }, 1000)
}

function saveContent() {
  try {
    localStorage.setItem(getStorageKey(), content.value)
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    lastSaved.value = `at ${timeStr}`
    
    // Clear the "saved" message after 3 seconds
    setTimeout(() => {
      lastSaved.value = null
    }, 3000)
  } catch (e) {
    console.error('Failed to save journal content:', e)
  }
}

function loadContent() {
  try {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) {
      content.value = saved
    } else {
      content.value = ''
    }
  } catch (e) {
    console.error('Failed to load journal content:', e)
  }
}

// Setup titlebar buttons
function setupTitlebarButtons() {
  osStore.setTitlebarButtons(props.windowId, [
    {
      id: 'edit-mode',
      icon: 'pi pi-pencil',
      title: 'Edit Mode',
      enabled: true,
      active: viewMode.value === 'edit',
      handler: () => {
        viewMode.value = 'edit'
      }
    },
    {
      id: 'view-mode',
      icon: 'pi pi-eye',
      title: 'View Mode',
      enabled: true,
      active: viewMode.value === 'view',
      handler: () => {
        viewMode.value = 'view'
      }
    }
  ])
}

// Update titlebar button states based on current mode
function updateTitlebarButtonStates() {
  osStore.updateTitlebarButton(props.windowId, 'edit-mode', {
    active: viewMode.value === 'edit'
  })
  osStore.updateTitlebarButton(props.windowId, 'view-mode', {
    active: viewMode.value === 'view'
  })
}

// Save on component unmount
onMounted(() => {
  loadContent()
  setupTitlebarButtons()
  updateTitlebarButtonStates()
})

// Clean up titlebar buttons on unmount
onUnmounted(() => {
  osStore.setTitlebarButtons(props.windowId, [])
})

// Save immediately when switching to view mode
watch(viewMode, (newMode) => {
  if (newMode === 'view') {
    // Clear any pending save and save immediately
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveContent()
  }
  // Update titlebar button states
  updateTitlebarButtonStates()
})

// Watch for session changes and reload content
watch(() => osStore.currentSessionId, () => {
  loadContent()
})
</script>

<script>
// Export help content for this application
export const journalHelpContent = `
  <h1>Journal Help</h1>
  
  <h2>Overview</h2>
  <p>The Journal application allows you to keep track of your role-playing sessions by recording text. You can write in Markdown format and switch between editing and viewing modes.</p>
  
  <h2>Modes</h2>
  <ul>
    <li><strong>Edit Mode:</strong> Write and edit your journal entries in Markdown format. This is the default mode when you open the Journal.</li>
    <li><strong>View Mode:</strong> See your journal entry rendered as formatted text. Perfect for reading your entries.</li>
  </ul>
  
  <h2>Auto-Save</h2>
  <p>Your journal content is automatically saved as you type. You'll see a "Saved" message in the toolbar when your content has been saved. No manual save action is required!</p>
  
  <h2>Markdown Formatting</h2>
  <p>The Journal supports GitLab-flavored Markdown. Here are some common formatting options:</p>
  
  <h3>Text Formatting</h3>
  <ul>
    <li><code>**bold text**</code> or <code>__bold text__</code> - Makes text <strong>bold</strong></li>
    <li><code>*italic text*</code> or <code>_italic text_</code> - Makes text <em>italic</em></li>
    <li><code>***bold and italic***</code> - Makes text <strong><em>bold and italic</em></strong></li>
    <li><code>~~strikethrough~~</code> - Makes text <del>strikethrough</del></li>
  </ul>
  
  <h3>Headings</h3>
  <ul>
    <li><code># Heading 1</code></li>
    <li><code>## Heading 2</code></li>
    <li><code>### Heading 3</code></li>
    <li><code>#### Heading 4</code></li>
    <li><code>##### Heading 5</code></li>
    <li><code>###### Heading 6</code></li>
  </ul>
  
  <h3>Lists</h3>
  <ul>
    <li><strong>Unordered lists:</strong> Use <code>-</code>, <code>*</code>, or <code>+</code> followed by a space</li>
    <li><strong>Ordered lists:</strong> Use numbers followed by a period and space (e.g., <code>1. </code>)</li>
    <li><strong>Nested lists:</strong> Indent items with spaces or tabs</li>
  </ul>
  
  <h3>Links and Images</h3>
  <ul>
    <li><code>[Link text](https://example.com)</code> - Creates a link</li>
    <li><code>![Alt text](image-url)</code> - Inserts an image</li>
  </ul>
  
  <h3>Code</h3>
  <ul>
    <li><code>\`inline code\`</code> - Inline code with backticks</li>
    <li><code>\`\`\`language</code> - Code blocks with syntax highlighting</li>
  </ul>
  
  <h3>Blockquotes</h3>
  <ul>
    <li><code>&gt; Quote text</code> - Creates a blockquote</li>
  </ul>
  
  <h3>Horizontal Rules</h3>
  <ul>
    <li><code>---</code> or <code>***</code> - Creates a horizontal line</li>
  </ul>
  
  <h3>Tables</h3>
  <p>Create tables using pipes and dashes:</p>
  <pre><code>| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |</code></pre>
  
  <h2>Tips</h2>
  <ul>
    <li>Switch to View mode to see how your Markdown will look when rendered</li>
    <li>Your content is saved automatically - you don't need to worry about losing your work</li>
    <li>Use headings to organize your journal entries by session or topic</li>
    <li>You can use the Journal to track character development, plot points, and session notes</li>
    <li>Line breaks in your Markdown will be preserved when rendered</li>
  </ul>
  
  <h2>Keyboard Shortcuts</h2>
  <ul>
    <li>Click the <strong>Edit</strong> button to switch to editing mode</li>
    <li>Click the <strong>View</strong> button to switch to reading mode</li>
  </ul>
`
</script>

<style scoped>
.journal-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-ground);
  overflow: hidden;
}

.save-status {
  display: flex;
  align-items: center;
  gap: clamp(4px, 0.8vw, 6px);
  padding: clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 16px);
  color: var(--text-color-secondary);
  font-size: clamp(11px, 1.6vw, 13px);
  background: var(--surface-section);
  border-bottom: 1px solid var(--surface-border);
  flex-shrink: 0;
}

.save-status i {
  color: #10b981;
  font-size: clamp(12px, 1.8vw, 14px);
}

.journal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-container,
.view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.journal-editor {
  flex: 1;
  width: 100%;
  padding: clamp(12px, 2vw, 20px);
  border: none;
  background: var(--surface-ground);
  color: var(--text-color);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: clamp(13px, 1.9vw, 15px);
  line-height: 1.6;
  resize: none;
  outline: none;
  box-sizing: border-box;
  overflow-y: auto;
}

.journal-editor::placeholder {
  color: var(--text-color-secondary);
  opacity: 0.6;
}

.markdown-content {
  flex: 1;
  padding: clamp(16px, 2.5vw, 24px);
  overflow-y: auto;
  color: var(--text-color);
  line-height: 1.7;
  font-size: clamp(14px, 2vw, 16px);
}

.markdown-content :deep(h1) {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  margin: clamp(16px, 2.5vw, 24px) 0 clamp(12px, 2vw, 16px) 0;
  color: var(--text-color);
  border-bottom: 2px solid var(--surface-border);
  padding-bottom: clamp(8px, 1.5vw, 12px);
}

.markdown-content :deep(h2) {
  font-size: clamp(20px, 3.5vw, 26px);
  font-weight: 600;
  margin: clamp(20px, 3vw, 28px) 0 clamp(10px, 1.5vw, 14px) 0;
  color: var(--text-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: clamp(6px, 1vw, 8px);
}

.markdown-content :deep(h3) {
  font-size: clamp(18px, 3vw, 22px);
  font-weight: 600;
  margin: clamp(16px, 2.5vw, 20px) 0 clamp(8px, 1.5vw, 12px) 0;
  color: var(--text-color);
}

.markdown-content :deep(h4) {
  font-size: clamp(16px, 2.5vw, 18px);
  font-weight: 600;
  margin: clamp(14px, 2vw, 18px) 0 clamp(6px, 1vw, 10px) 0;
  color: var(--text-color);
}

.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-size: clamp(14px, 2vw, 16px);
  font-weight: 600;
  margin: clamp(12px, 1.5vw, 16px) 0 clamp(6px, 1vw, 8px) 0;
  color: var(--text-color);
}

.markdown-content :deep(p) {
  margin: 0 0 clamp(12px, 2vw, 16px) 0;
  color: var(--text-color);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0 0 clamp(12px, 2vw, 16px) 0;
  padding-left: clamp(24px, 4vw, 32px);
  color: var(--text-color);
}

.markdown-content :deep(li) {
  margin: clamp(4px, 0.8vw, 6px) 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--text-color);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(code) {
  background: var(--surface-section);
  padding: clamp(2px, 0.5vw, 3px) clamp(6px, 1vw, 8px);
  border-radius: clamp(3px, 0.5vw, 4px);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: clamp(12px, 1.8vw, 14px);
  color: var(--primary-color);
}

.markdown-content :deep(pre) {
  background: var(--surface-section);
  padding: clamp(12px, 2vw, 16px);
  border-radius: clamp(6px, 1vw, 8px);
  overflow-x: auto;
  margin: 0 0 clamp(12px, 2vw, 16px) 0;
  border: 1px solid var(--surface-border);
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--text-color);
  font-size: clamp(12px, 1.8vw, 14px);
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: clamp(16px, 2.5vw, 20px);
  margin: 0 0 clamp(12px, 2vw, 16px) 0;
  color: var(--text-color-secondary);
  font-style: italic;
}

.markdown-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: clamp(4px, 0.8vw, 6px);
  margin: clamp(8px, 1.5vw, 12px) 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 clamp(12px, 2vw, 16px) 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: clamp(8px, 1.5vw, 12px);
  border: 1px solid var(--surface-border);
  text-align: left;
}

.markdown-content :deep(th) {
  background: var(--surface-section);
  font-weight: 600;
  color: var(--text-color);
}

.markdown-content :deep(tr:nth-child(even)) {
  background: var(--surface-section);
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--surface-border);
  margin: clamp(16px, 2.5vw, 24px) 0;
}

.empty-state,
.error-state {
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;
  padding: clamp(40px, 8vw, 60px) clamp(20px, 4vw, 40px);
}

.error-state {
  color: #ef4444;
}
</style>

