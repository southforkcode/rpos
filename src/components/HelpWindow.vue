<template>
  <div class="help-window">
    <div class="help-content" v-html="helpContent"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  helpContent: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.help-window {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--surface-ground);
  box-sizing: border-box;
}

.help-content {
  color: var(--text-color);
  line-height: 1.6;
  font-size: 14px;
}

.help-content :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-color);
}

.help-content :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 12px 0;
  color: var(--text-color);
}

.help-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: var(--text-color);
}

.help-content :deep(p) {
  margin: 0 0 12px 0;
  color: var(--text-color-secondary);
}

.help-content :deep(ul),
.help-content :deep(ol) {
  margin: 0 0 12px 0;
  padding-left: 24px;
  color: var(--text-color-secondary);
}

.help-content :deep(li) {
  margin: 4px 0;
}

.help-content :deep(code) {
  background: var(--surface-section);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  color: var(--primary-color);
}

.help-content :deep(strong) {
  color: var(--text-color);
  font-weight: 600;
}

.help-content :deep(em) {
  font-style: italic;
}
</style>

