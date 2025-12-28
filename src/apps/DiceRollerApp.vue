<template>
  <div class="dice-roller-app">
    <div class="dice-header">
      <p>Click a die to roll it, or enter a command like "2d20", "d20 adv", "d100", "d50", "d8,d8", or "hope:d8,fear:d8" for labeled independent rolls. You can roll any die number!</p>
    </div>

    <div class="command-section">
      <div class="command-input-wrapper">
        <i class="pi pi-terminal command-icon"></i>
        <input
          v-model="commandInput"
          @keyup.enter="executeCommand"
          @keyup.escape="clearCommand"
          class="command-input"
          type="text"
          placeholder="Enter dice command (e.g., 2d20, 3d6+2, d20 adv, d100, d50, d8,d8, hope:d8,fear:d8)"
          :disabled="isRolling"
        />
        <button
          @click="executeCommand"
          class="command-button"
          :disabled="isRolling || !commandInput.trim()"
          title="Roll (Enter)"
        >
          <i class="pi pi-play"></i>
        </button>
      </div>
      <div v-if="commandError" class="command-error">
        {{ commandError }}
      </div>
    </div>

    <div class="dice-content">
      <div class="dice-grid">
        <button
          v-for="die in diceTypes"
          :key="die.sides"
          class="die-button"
          :class="{ 'rolling': rollingDie === die.sides }"
          @click="rollDie(die.sides)"
          :disabled="isRolling"
        >
          <div class="die-icon" v-html="getDieShape(die.sides)"></div>
          <div class="die-label">d{{ die.sides }}</div>
        </button>
      </div>

      <div class="result-section">
        <div v-if="lastRollResult" class="result-display">
          <div class="result-label">Result:</div>
          <!-- Independent Rolls Display -->
          <div v-if="lastRollResult.isIndependent" class="independent-rolls-display">
            <div class="independent-rolls-list">
              <div
                v-for="(rollResult, idx) in lastRollResult.independentRolls"
                :key="idx"
                class="independent-roll-item"
              >
                <div class="independent-roll-header">
                  <span class="independent-roll-label">{{ rollResult.label || `Roll ${idx + 1}` }}</span>
                </div>
                <!-- Advantage/Disadvantage within independent roll -->
                <div v-if="rollResult.advantageType" class="independent-advantage">
                  <div class="result-value" :class="{ 'rolling': isRolling }">
                    {{ isRolling ? '...' : rollResult.total }}
                  </div>
                  <div class="advantage-type-label">
                    {{ rollResult.advantageType === 'adv' ? 'Advantage' : 'Disadvantage' }}
                  </div>
                  <div class="advantage-rolls">
                    <span
                      v-for="(roll, rollIdx) in rollResult.individualRolls"
                      :key="rollIdx"
                      class="advantage-roll"
                      :class="{ 'selected': roll === rollResult.selectedRoll }"
                    >
                      {{ roll }}
                    </span>
                  </div>
                  <div class="advantage-selected">
                    Selected: <strong>{{ rollResult.selectedRoll }}</strong>
                  </div>
                  <div v-if="rollResult.modifier !== 0" class="advantage-modifier">
                    {{ rollResult.modifier > 0 ? '+' : '' }}{{ rollResult.modifier }} modifier
                  </div>
                </div>
                <!-- Multiple dice within independent roll -->
                <div v-else-if="rollResult.individualRolls && rollResult.individualRolls.length > 1" class="independent-multi">
                  <div class="result-value" :class="{ 'rolling': isRolling }">
                    {{ isRolling ? '...' : rollResult.total }}
                  </div>
                  <div class="individual-rolls">
                    <span
                      v-for="(roll, rollIdx) in rollResult.individualRolls"
                      :key="rollIdx"
                      class="individual-roll"
                    >
                      {{ roll }}{{ rollIdx < rollResult.individualRolls.length - 1 ? ' +' : '' }}
                    </span>
                    <span v-if="rollResult.modifier !== 0" class="modifier">
                      {{ rollResult.modifier > 0 ? '+' : '' }}{{ rollResult.modifier }}
                    </span>
                  </div>
                </div>
                <!-- Single die within independent roll -->
                <div v-else class="independent-single">
                  <div class="result-value" :class="{ 'rolling': isRolling }">
                    {{ isRolling ? '...' : rollResult.total }}
                  </div>
                  <div v-if="rollResult.modifier !== 0" class="modifier">
                    {{ rollResult.modifier > 0 ? '+' : '' }}{{ rollResult.modifier }} modifier
                  </div>
                </div>
              </div>
            </div>
            <div class="result-command">
              {{ lastRollResult.command }}
            </div>
            <button 
              v-if="!isRolling" 
              @click="acceptRoll" 
              class="accept-button"
              :class="{ 'accepted': isCurrentRollAccepted }"
              :disabled="isCurrentRollAccepted"
              :title="isCurrentRollAccepted ? 'Roll accepted' : 'Accept this roll'"
            >
              {{ isCurrentRollAccepted ? 'Accepted' : 'Accept' }}
            </button>
          </div>
          <!-- Advantage/Disadvantage Display -->
          <div v-else-if="lastRollResult.advantageType" class="advantage-display">
            <div class="result-value" :class="{ 'rolling': isRolling }">
              {{ isRolling ? '...' : lastRollResult.total }}
            </div>
            <div class="advantage-type-label">
              {{ lastRollResult.advantageType === 'adv' ? 'Advantage' : 'Disadvantage' }}
            </div>
            <div class="advantage-rolls">
              <span
                v-for="(roll, idx) in lastRollResult.individualRolls"
                :key="idx"
                class="advantage-roll"
                :class="{ 'selected': roll === lastRollResult.selectedRoll }"
              >
                {{ roll }}
              </span>
            </div>
            <div class="advantage-selected">
              Selected: <strong>{{ lastRollResult.selectedRoll }}</strong>
            </div>
            <div v-if="lastRollResult.modifier !== 0" class="advantage-modifier">
              {{ lastRollResult.modifier > 0 ? '+' : '' }}{{ lastRollResult.modifier }} modifier
            </div>
            <div class="result-command">
              {{ lastRollResult.command }}
            </div>
            <button 
              v-if="!isRolling" 
              @click="acceptRoll" 
              class="accept-button"
              :class="{ 'accepted': isCurrentRollAccepted }"
              :disabled="isCurrentRollAccepted"
              :title="isCurrentRollAccepted ? 'Roll accepted' : 'Accept this roll'"
            >
              {{ isCurrentRollAccepted ? 'Accepted' : 'Accept' }}
            </button>
          </div>
          <!-- Multiple Dice Display -->
          <div v-else-if="lastRollResult.individualRolls && lastRollResult.individualRolls.length > 1" class="multi-roll-display">
            <div class="result-value" :class="{ 'rolling': isRolling }">
              {{ isRolling ? '...' : lastRollResult.total }}
            </div>
            <div class="individual-rolls">
              <span
                v-for="(roll, idx) in lastRollResult.individualRolls"
                :key="idx"
                class="individual-roll"
              >
                {{ roll }}{{ idx < lastRollResult.individualRolls.length - 1 ? ' +' : '' }}
              </span>
              <span v-if="lastRollResult.modifier !== 0" class="modifier">
                {{ lastRollResult.modifier > 0 ? '+' : '' }}{{ lastRollResult.modifier }}
              </span>
            </div>
            <div class="result-command">
              {{ lastRollResult.command }}
            </div>
            <button 
              v-if="!isRolling" 
              @click="acceptRoll" 
              class="accept-button"
              :class="{ 'accepted': isCurrentRollAccepted }"
              :disabled="isCurrentRollAccepted"
              :title="isCurrentRollAccepted ? 'Roll accepted' : 'Accept this roll'"
            >
              {{ isCurrentRollAccepted ? 'Accepted' : 'Accept' }}
            </button>
          </div>
          <!-- Single Die Display -->
          <div v-else>
            <div class="result-value" :class="{ 'rolling': isRolling }">
              {{ isRolling ? '...' : lastRollResult.total }}
            </div>
            <div class="result-command">
              {{ lastRollResult.command }}
            </div>
            <button 
              v-if="!isRolling" 
              @click="acceptRoll" 
              class="accept-button"
              :class="{ 'accepted': isCurrentRollAccepted }"
              :disabled="isCurrentRollAccepted"
              :title="isCurrentRollAccepted ? 'Roll accepted' : 'Accept this roll'"
            >
              {{ isCurrentRollAccepted ? 'Accepted' : 'Accept' }}
            </button>
          </div>
        </div>
        <div v-else class="result-placeholder">
          Select a die to roll or enter a command
        </div>
      </div>

      <div v-if="rollHistory.length > 0 || acceptedHistory.length > 0" class="history-section">
        <div class="history-tabs">
          <button 
            @click="activeTab = 'log'" 
            class="tab-button"
            :class="{ 'active': activeTab === 'log' }"
          >
            Log
          </button>
          <button 
            @click="activeTab = 'history'" 
            class="tab-button"
            :class="{ 'active': activeTab === 'history' }"
          >
            History
          </button>
        </div>
        <div class="history-list">
          <div
            v-for="(roll, index) in activeTab === 'log' ? rollHistory : acceptedHistory"
            :key="index"
            class="history-item"
            :class="{ 'history-item-independent': roll.isIndependent }"
          >
            <div class="history-left">
              <span class="history-command">{{ roll.command || `d${roll.dieType}` }}</span>
              <!-- Independent rolls display -->
              <div v-if="roll.isIndependent" class="history-independent-rolls">
                <span
                  v-for="(indRoll, idx) in roll.independentRolls"
                  :key="idx"
                  class="history-independent-roll"
                >
                  <span class="history-independent-label">{{ indRoll.label || `Roll ${idx + 1}` }}:</span>
                  <span class="history-independent-value">
                    <span v-if="indRoll.advantageType">
                      {{ indRoll.advantageType === 'adv' ? 'Adv' : 'Dis' }}: {{ indRoll.individualRolls?.join(', ') }} → {{ indRoll.selectedRoll }}
                      <span v-if="indRoll.modifier !== 0"> ({{ indRoll.modifier > 0 ? '+' : '' }}{{ indRoll.modifier }})</span>
                      = {{ indRoll.total }}
                    </span>
                    <span v-else>
                      <span v-if="indRoll.individualRolls && indRoll.individualRolls.length > 1">
                        {{ indRoll.individualRolls.join(' + ') }}
                        <span v-if="indRoll.modifier !== 0"> {{ indRoll.modifier > 0 ? '+' : '' }}{{ indRoll.modifier }}</span>
                        = {{ indRoll.total }}
                      </span>
                      <span v-else>
                        {{ indRoll.total }}
                      </span>
                    </span>
                  </span>
                </span>
              </div>
              <!-- Single roll display -->
              <span v-else-if="roll.advantageType" class="history-advantage">
                ({{ roll.advantageType === 'adv' ? 'Adv' : 'Dis' }}: {{ roll.individualRolls?.join(', ') }} → {{ roll.selectedRoll }})
              </span>
            </div>
            <span v-if="!roll.isIndependent" class="history-result">{{ roll.result }}</span>
            <span v-else class="history-result-independent">
              {{ roll.independentRolls.map(r => r.total).join(', ') }}
            </span>
          </div>
          <div v-if="(activeTab === 'log' ? rollHistory : acceptedHistory).length === 0" class="history-empty">
            {{ activeTab === 'log' ? 'No rolls yet' : 'No accepted rolls yet' }}
          </div>
        </div>
        <button class="clear-button" @click="clearHistory">Clear {{ activeTab === 'log' ? 'Log' : 'History' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useOSStore } from '../stores/os'

const props = defineProps({
  windowId: String
})

const osStore = useOSStore()

const diceTypes = [
  { sides: 4, name: 'Tetrahedron' },
  { sides: 6, name: 'Cube' },
  { sides: 8, name: 'Octahedron' },
  { sides: 10, name: 'Pentagonal Trapezohedron' },
  { sides: 12, name: 'Dodecahedron' },
  { sides: 20, name: 'Icosahedron' }
]

function getDieShape(sides) {
  const size = 32
  const center = size / 2
  const strokeWidth = 2
  const strokeColor = 'currentColor'
  
  switch(sides) {
    case 4: // Tetrahedron - Triangle
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${center},${size * 0.15} ${size * 0.15},${size * 0.85} ${size * 0.85},${size * 0.85}" 
                 fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </svg>`
    
    case 6: // Cube - Square
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" 
              fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </svg>`
    
    case 8: // Octahedron - Octagon
      const octagonSize = size * 0.4
      const octagonPoints = []
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8 - Math.PI / 8
        const x = center + octagonSize * Math.cos(angle)
        const y = center + octagonSize * Math.sin(angle)
        octagonPoints.push(`${x},${y}`)
      }
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${octagonPoints.join(' ')}" 
                 fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </svg>`
    
    case 10: // Pentagonal Trapezohedron - Pentagon
      const pentagonSize = size * 0.4
      const pentagonPoints = []
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const x = center + pentagonSize * Math.cos(angle)
        const y = center + pentagonSize * Math.sin(angle)
        pentagonPoints.push(`${x},${y}`)
      }
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${pentagonPoints.join(' ')}" 
                 fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </svg>`
    
    case 12: // Dodecahedron - Pentagon (with inner detail)
      const dodecaSize = size * 0.35
      const dodecaPoints = []
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const x = center + dodecaSize * Math.cos(angle)
        const y = center + dodecaSize * Math.sin(angle)
        dodecaPoints.push(`${x},${y}`)
      }
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${dodecaPoints.join(' ')}" 
                 fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <circle cx="${center}" cy="${center}" r="${size * 0.1}" 
                fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth * 0.7}" />
      </svg>`
    
    case 20: // Icosahedron - Triangle (with detail lines to show it's an icosahedron)
      const triSize = size * 0.35
      const topX = center
      const topY = center - triSize
      const leftX = center - triSize * Math.cos(Math.PI / 6)
      const leftY = center + triSize * Math.sin(Math.PI / 6)
      const rightX = center + triSize * Math.cos(Math.PI / 6)
      const rightY = center + triSize * Math.sin(Math.PI / 6)
      const midLeftX = (topX + leftX) / 2
      const midLeftY = (topY + leftY) / 2
      const midRightX = (topX + rightX) / 2
      const midRightY = (topY + rightY) / 2
      const midBottomX = (leftX + rightX) / 2
      const midBottomY = (leftY + rightY) / 2
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}" 
                 fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${midLeftX}" y1="${midLeftY}" x2="${midBottomX}" y2="${midBottomY}" 
              stroke="${strokeColor}" stroke-width="${strokeWidth * 0.7}" />
        <line x1="${midRightX}" y1="${midRightY}" x2="${midBottomX}" y2="${midBottomY}" 
              stroke="${strokeColor}" stroke-width="${strokeWidth * 0.7}" />
        <line x1="${midLeftX}" y1="${midLeftY}" x2="${midRightX}" y2="${midRightY}" 
              stroke="${strokeColor}" stroke-width="${strokeWidth * 0.7}" />
      </svg>`
    
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="${size * 0.3}" 
                fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      </svg>`
  }
}

const isRolling = ref(false)
const rollingDie = ref(null)
const lastRollResult = ref(null)
const rollHistory = ref([])
const acceptedHistory = ref([])
const activeTab = ref('log')
const isCurrentRollAccepted = ref(false)
const commandInput = ref('')
const commandError = ref('')

function rollDie(sides) {
  if (isRolling.value) return
  executeRoll({ count: 1, sides, modifier: 0 }, `d${sides}`)
}

function parseSingleDiceCommand(command) {
  const trimmed = command.trim()
  
  // Check for label format: "label:diceCommand"
  let label = null
  let diceCommand = trimmed
  
  const colonIndex = trimmed.indexOf(':')
  if (colonIndex > 0 && colonIndex < trimmed.length - 1) {
    // Extract label (preserve case) and dice command
    label = trimmed.substring(0, colonIndex).trim()
    diceCommand = trimmed.substring(colonIndex + 1).trim()
    
    // Validate label (alphanumeric, spaces, hyphens, underscores)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(label) || label.length === 0) {
      return null
    }
  }
  
  // Convert dice command to lowercase for parsing (but preserve original for display)
  const diceCommandLower = diceCommand.toLowerCase()
  
  // Remove whitespace but preserve spaces around adv/dis
  const normalized = diceCommandLower.replace(/\s+/g, ' ')
  
  // Pattern: [count]d[sides][+/-modifier][ adv|dis]
  // Examples: d20, 2d20, 3d6+2, d20 adv, d20 dis, d20+5 adv
  const pattern = /^(\d*)d(\d+)([+-]\d+)?(?:\s+(adv|dis))?$/
  const match = normalized.match(pattern)
  
  if (!match) {
    return null
  }
  
  const count = match[1] ? parseInt(match[1], 10) : 1
  const sides = parseInt(match[2], 10)
  const modifier = match[3] ? parseInt(match[3], 10) : 0
  const advantageType = match[4] || null // 'adv', 'dis', or null
  
  // Validate dice sides (must be positive integer)
  if (sides < 1 || sides > 10000) {
    return null
  }
  
  // Validate count (must be 1 for advantage/disadvantage)
  if (advantageType && count !== 1) {
    return null
  }
  
  if (count < 1 || count > 100) {
    return null
  }
  
  return { count, sides, modifier, advantageType, label }
}

function parseDiceCommand(command) {
  commandError.value = ''
  const trimmed = command.trim()
  
  // Check for comma-separated independent rolls
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(p => p.length > 0)
    
    if (parts.length < 2) {
      commandError.value = 'Comma-separated rolls must have at least 2 parts (e.g., d8,d8 or hope:d8,fear:d8)'
      return null
    }
    
    const parsedRolls = []
    for (let i = 0; i < parts.length; i++) {
      const parsed = parseSingleDiceCommand(parts[i])
      if (!parsed) {
        commandError.value = `Invalid format in part ${i + 1}: "${parts[i]}". Use: [label:]diceCommand (e.g., d8 or hope:d8)`
        return null
      }
      parsedRolls.push(parsed)
    }
    
    return { independentRolls: parsedRolls }
  }
  
  // Single roll (original behavior)
  // Note: labels are only used for comma-separated independent rolls
  const parsed = parseSingleDiceCommand(trimmed)
  if (!parsed) {
    commandError.value = 'Invalid format. Use: [count]d[sides][+/-modifier][ adv|dis] (e.g., 2d20, d20 adv) or comma-separated independent rolls (e.g., d8,d8 or hope:d8,fear:d8)'
    return null
  }
  
  // For single rolls, ignore label if present (labels only work with comma-separated rolls)
  if (parsed.label) {
    commandError.value = 'Labels can only be used with comma-separated independent rolls (e.g., hope:d8,fear:d8)'
    return null
  }
  
  return parsed
}

function executeCommand() {
  if (isRolling.value || !commandInput.value.trim()) return
  
  const parsed = parseDiceCommand(commandInput.value)
  if (!parsed) return
  
  executeRoll(parsed, commandInput.value.trim())
}

function executeRoll(rollSpec, command) {
  if (isRolling.value) return

  isRolling.value = true
  commandError.value = ''
  isCurrentRollAccepted.value = false

  // Handle independent rolls (comma-separated)
  if (rollSpec.independentRolls) {
    rollingDie.value = rollSpec.independentRolls[0]?.sides || null
    
    // Animate for a random duration between 0.8 and 1.5 seconds
    const rollDuration = 800 + Math.random() * 700

    // Show intermediate "rolling" values during animation
    const interval = setInterval(() => {
      if (!isRolling.value) {
        clearInterval(interval)
        return
      }
      // Show random intermediate results for each independent roll
      const tempIndependentResults = rollSpec.independentRolls.map((spec, index) => {
        if (spec.advantageType) {
          const tempRolls = [
            Math.floor(Math.random() * spec.sides) + 1,
            Math.floor(Math.random() * spec.sides) + 1
          ]
          const selected = spec.advantageType === 'adv' 
            ? Math.max(...tempRolls)
            : Math.min(...tempRolls)
          return {
            total: selected + spec.modifier,
            individualRolls: tempRolls,
            selectedRoll: selected,
            advantageType: spec.advantageType,
            modifier: spec.modifier,
            dieType: spec.sides,
            count: spec.count,
            label: spec.label || null
          }
        } else {
          const tempRolls = []
          for (let i = 0; i < spec.count; i++) {
            tempRolls.push(Math.floor(Math.random() * spec.sides) + 1)
          }
          return {
            total: tempRolls.reduce((sum, r) => sum + r, 0) + spec.modifier,
            individualRolls: spec.count > 1 ? tempRolls : null,
            modifier: spec.modifier,
            dieType: spec.sides,
            count: spec.count,
            label: spec.label || null
          }
        }
      })
      
      lastRollResult.value = {
        independentRolls: tempIndependentResults,
        command: command,
        isIndependent: true
      }
    }, 50)

    setTimeout(() => {
      // Final roll results for each independent roll
      const independentResults = rollSpec.independentRolls.map(spec => {
        if (spec.advantageType) {
          const rolls = [
            Math.floor(Math.random() * spec.sides) + 1,
            Math.floor(Math.random() * spec.sides) + 1
          ]
          const selectedRoll = spec.advantageType === 'adv' 
            ? Math.max(...rolls)
            : Math.min(...rolls)
          return {
            total: selectedRoll + spec.modifier,
            individualRolls: rolls,
            selectedRoll: selectedRoll,
            advantageType: spec.advantageType,
            modifier: spec.modifier,
            dieType: spec.sides,
            count: spec.count,
            label: spec.label || null
          }
        } else {
          const rolls = []
          for (let i = 0; i < spec.count; i++) {
            rolls.push(Math.floor(Math.random() * spec.sides) + 1)
          }
          return {
            total: rolls.reduce((sum, r) => sum + r, 0) + spec.modifier,
            individualRolls: spec.count > 1 ? rolls : null,
            modifier: spec.modifier,
            dieType: spec.sides,
            count: spec.count,
            label: spec.label || null
          }
        }
      })
      
      lastRollResult.value = {
        independentRolls: independentResults,
        command: command,
        isIndependent: true
      }
      
      isRolling.value = false
      rollingDie.value = null
      clearInterval(interval)

      // Add to history
      rollHistory.value.unshift({
        command: command,
        independentRolls: independentResults,
        isIndependent: true,
        timestamp: new Date()
      })

      // Keep only last 20 rolls
      if (rollHistory.value.length > 20) {
        rollHistory.value = rollHistory.value.slice(0, 20)
      }
      
      // Save to localStorage
      saveHistory()
    }, rollDuration)
    return
  }

  // Original single roll behavior
  rollingDie.value = rollSpec.sides

  // Animate for a random duration between 0.8 and 1.5 seconds
  const rollDuration = 800 + Math.random() * 700

  // Show intermediate "rolling" values during animation
  const interval = setInterval(() => {
    if (!isRolling.value) {
      clearInterval(interval)
      return
    }
    // Show random intermediate results
    let tempRolls = []
    if (rollSpec.advantageType) {
      // For advantage/disadvantage, show 2 rolls
      tempRolls = [
        Math.floor(Math.random() * rollSpec.sides) + 1,
        Math.floor(Math.random() * rollSpec.sides) + 1
      ]
      const selected = rollSpec.advantageType === 'adv' 
        ? Math.max(...tempRolls)
        : Math.min(...tempRolls)
      const tempTotal = selected + rollSpec.modifier
      lastRollResult.value = {
        total: tempTotal,
        individualRolls: tempRolls,
        selectedRoll: selected,
        advantageType: rollSpec.advantageType,
        modifier: rollSpec.modifier,
        command: command,
        dieType: rollSpec.sides
      }
    } else {
      for (let i = 0; i < rollSpec.count; i++) {
        tempRolls.push(Math.floor(Math.random() * rollSpec.sides) + 1)
      }
      const tempTotal = tempRolls.reduce((sum, r) => sum + r, 0) + rollSpec.modifier
      lastRollResult.value = {
        total: tempTotal,
        individualRolls: rollSpec.count > 1 ? tempRolls : null,
        modifier: rollSpec.modifier,
        command: command,
        dieType: rollSpec.sides
      }
    }
  }, 50)

  setTimeout(() => {
    // Final roll results
    let rolls = []
    let total = 0
    let selectedRoll = null
    
    if (rollSpec.advantageType) {
      // Roll 2 dice for advantage/disadvantage
      rolls = [
        Math.floor(Math.random() * rollSpec.sides) + 1,
        Math.floor(Math.random() * rollSpec.sides) + 1
      ]
      selectedRoll = rollSpec.advantageType === 'adv' 
        ? Math.max(...rolls)
        : Math.min(...rolls)
      total = selectedRoll + rollSpec.modifier
      
      lastRollResult.value = {
        total: total,
        individualRolls: rolls,
        selectedRoll: selectedRoll,
        advantageType: rollSpec.advantageType,
        modifier: rollSpec.modifier,
        command: command,
        dieType: rollSpec.sides
      }
    } else {
      for (let i = 0; i < rollSpec.count; i++) {
        rolls.push(Math.floor(Math.random() * rollSpec.sides) + 1)
      }
      total = rolls.reduce((sum, r) => sum + r, 0) + rollSpec.modifier
      
      lastRollResult.value = {
        total: total,
        individualRolls: rollSpec.count > 1 ? rolls : null,
        modifier: rollSpec.modifier,
        command: command,
        dieType: rollSpec.sides
      }
    }
    
    isRolling.value = false
    rollingDie.value = null
    clearInterval(interval)

    // Add to history
    rollHistory.value.unshift({
      command: command,
      dieType: rollSpec.sides,
      result: total,
      individualRolls: rollSpec.advantageType ? rolls : (rollSpec.count > 1 ? rolls : null),
      selectedRoll: selectedRoll,
      advantageType: rollSpec.advantageType,
      modifier: rollSpec.modifier,
      timestamp: new Date()
    })

    // Keep only last 20 rolls
    if (rollHistory.value.length > 20) {
      rollHistory.value = rollHistory.value.slice(0, 20)
    }
    
    // Save to localStorage
    saveHistory()
  }, rollDuration)
}

function saveHistory() {
  try {
    // Convert Date objects to ISO strings for storage
    const logToSave = rollHistory.value.map(roll => ({
      ...roll,
      timestamp: roll.timestamp instanceof Date ? roll.timestamp.toISOString() : roll.timestamp
    }))
    const acceptedToSave = acceptedHistory.value.map(roll => ({
      ...roll,
      timestamp: roll.timestamp instanceof Date ? roll.timestamp.toISOString() : roll.timestamp
    }))
    const logKey = osStore.getSessionStorageKey('dice-roller-log')
    const acceptedKey = osStore.getSessionStorageKey('dice-roller-accepted')
    localStorage.setItem(logKey, JSON.stringify(logToSave))
    localStorage.setItem(acceptedKey, JSON.stringify(acceptedToSave))
  } catch (e) {
    console.error('Failed to save dice roll history:', e)
  }
}

function loadHistory() {
  try {
    const logKey = osStore.getSessionStorageKey('dice-roller-log')
    const acceptedKey = osStore.getSessionStorageKey('dice-roller-accepted')
    
    // Migrate old data if it exists (only for current session)
    if (osStore.currentSessionId) {
      const oldHistory = localStorage.getItem('dice-roller-history')
      if (oldHistory && !localStorage.getItem(logKey)) {
        // Migrate old history to log for current session
        localStorage.setItem(logKey, oldHistory)
        localStorage.removeItem('dice-roller-history')
      }
    }
    
    // Load log
    const savedLog = localStorage.getItem(logKey)
    if (savedLog) {
      const parsed = JSON.parse(savedLog)
      rollHistory.value = parsed.map(roll => ({
        ...roll,
        timestamp: roll.timestamp ? new Date(roll.timestamp) : new Date()
      }))
      if (rollHistory.value.length > 20) {
        rollHistory.value = rollHistory.value.slice(0, 20)
      }
    }
    
    // Load accepted history
    const savedAccepted = localStorage.getItem(acceptedKey)
    if (savedAccepted) {
      const parsed = JSON.parse(savedAccepted)
      acceptedHistory.value = parsed.map(roll => ({
        ...roll,
        timestamp: roll.timestamp ? new Date(roll.timestamp) : new Date()
      }))
      if (acceptedHistory.value.length > 20) {
        acceptedHistory.value = acceptedHistory.value.slice(0, 20)
      }
    }
  } catch (e) {
    console.error('Failed to load dice roll history:', e)
    rollHistory.value = []
    acceptedHistory.value = []
  }
}

function clearCommand() {
  commandInput.value = ''
  commandError.value = ''
}

function acceptRoll() {
  if (!lastRollResult.value || isRolling.value || isCurrentRollAccepted.value) return
  
  // Create a copy of the current roll result
  const rollToAccept = {
    command: lastRollResult.value.command,
    isIndependent: lastRollResult.value.isIndependent,
    timestamp: new Date()
  }
  
  if (lastRollResult.value.isIndependent) {
    rollToAccept.independentRolls = lastRollResult.value.independentRolls
  } else {
    rollToAccept.dieType = lastRollResult.value.dieType
    rollToAccept.result = lastRollResult.value.total
    rollToAccept.individualRolls = lastRollResult.value.individualRolls
    rollToAccept.selectedRoll = lastRollResult.value.selectedRoll
    rollToAccept.advantageType = lastRollResult.value.advantageType
    rollToAccept.modifier = lastRollResult.value.modifier
  }
  
  acceptedHistory.value.unshift(rollToAccept)
  
  // Keep only last 20 accepted rolls
  if (acceptedHistory.value.length > 20) {
    acceptedHistory.value = acceptedHistory.value.slice(0, 20)
  }
  
  isCurrentRollAccepted.value = true
  saveHistory()
}

function clearHistory() {
  if (activeTab.value === 'log') {
    rollHistory.value = []
  } else {
    acceptedHistory.value = []
  }
  saveHistory()
}

// Load history when component mounts and when session changes
onMounted(() => {
  loadHistory()
})

// Watch for session changes and reload history
watch(() => osStore.currentSessionId, () => {
  loadHistory()
  // Clear current roll when switching sessions
  lastRollResult.value = null
  isCurrentRollAccepted.value = false
})
</script>

<script>
// Export help content for this application
export const diceRollerHelpContent = `
  <h1>Dice Roller Help</h1>
  
  <h2>Quick Start</h2>
  <p>Click any die button to roll it, or enter a command in the command input field. <strong>You can roll any die number</strong> - not just the buttons shown!</p>
  
  <h2>Rolling Dice</h2>
  <p>You can roll dice in several ways:</p>
  <ul>
    <li><strong>Click a die button:</strong> Click any of the die buttons (d4, d6, d8, d10, d12, d20) to roll a single die of that type.</li>
    <li><strong>Command input:</strong> Enter dice commands in the text field and press Enter or click the play button. <strong>This allows you to roll any die number</strong>, including d30, d50, d100, or any other number up to d10000!</li>
  </ul>
  
  <h2>Command Syntax</h2>
  
  <h3>Basic Rolls</h3>
  <ul>
    <li><code>d20</code> - Roll a single d20</li>
    <li><code>d100</code> - Roll a single d100 (or any die number!)</li>
    <li><code>2d20</code> - Roll two d20s and add them together</li>
    <li><code>3d6+2</code> - Roll three d6s, add them, then add 2</li>
    <li><code>d20-1</code> - Roll a d20 and subtract 1</li>
    <li><code>2d50+5</code> - Roll two d50s and add 5</li>
  </ul>
  
  <h3>Advantage and Disadvantage</h3>
  <ul>
    <li><code>d20 adv</code> - Roll with advantage (roll twice, take the higher)</li>
    <li><code>d20 dis</code> - Roll with disadvantage (roll twice, take the lower)</li>
    <li><code>d20+5 adv</code> - Roll with advantage and add a modifier</li>
    <li><code>d100 adv</code> - Roll a d100 with advantage</li>
    <li><code>d50+10 dis</code> - Roll a d50 with disadvantage and add 10</li>
  </ul>
  <p><strong>Note:</strong> Advantage/disadvantage only works with single dice rolls (count must be 1), but works with any die number!</p>
  
  <h3>Independent Rolls</h3>
  <p>Roll multiple independent dice at once by separating commands with commas:</p>
  <ul>
    <li><code>d8,d8</code> - Roll two independent d8s</li>
    <li><code>d20,d20</code> - Roll two independent d20s</li>
    <li><code>2d6,d20</code> - Roll 2d6 and a separate d20</li>
    <li><code>d100,d50</code> - Roll a d100 and a d50 independently</li>
  </ul>
  
  <h3>Labeled Independent Rolls</h3>
  <p>Add labels to independent rolls for better organization:</p>
  <ul>
    <li><code>hope:d8,fear:d8</code> - Roll a "hope" d8 and a "fear" d8</li>
    <li><code>attack:d20+5,damage:2d6+3</code> - Roll an attack and damage separately</li>
    <li><code>percentile:d100,modifier:d50</code> - Roll a percentile die and a modifier die</li>
  </ul>
  <p>Labels can contain letters, numbers, spaces, hyphens, and underscores.</p>
  
  <h2>Results Display</h2>
  <p>The result section shows:</p>
  <ul>
    <li><strong>Total:</strong> The final result of your roll</li>
    <li><strong>Individual rolls:</strong> For multiple dice, shows each individual roll</li>
    <li><strong>Selected roll:</strong> For advantage/disadvantage, shows which roll was selected</li>
    <li><strong>Modifier:</strong> Any modifiers applied to the roll</li>
    <li><strong>Command:</strong> The command that was executed</li>
  </ul>
  
  <h2>Accepting Rolls</h2>
  <p>Click the "Accept" button to save a roll to your accepted history. Accepted rolls are kept separate from the general roll log.</p>
  
  <h2>History</h2>
  <p>The history section has two tabs:</p>
  <ul>
    <li><strong>Log:</strong> Shows all rolls you've made (up to 20 most recent)</li>
    <li><strong>History:</strong> Shows only rolls you've accepted (up to 20 most recent)</li>
  </ul>
  <p>Use the "Clear" button to clear the current tab's history.</p>
  
  <h2>Supported Dice</h2>
  <p><strong>The Dice Roller supports rolling any die number from d1 to d10000!</strong> While convenient buttons are provided for common dice types, you can roll any die number using the command input field.</p>
  
  <h3>Rolling Any Die Number</h3>
  <p>Simply type the die number you want to roll in the command input. Examples:</p>
  <ul>
    <li><code>d30</code> - Roll a d30</li>
    <li><code>d50</code> - Roll a d50</li>
    <li><code>d100</code> - Roll a d100 (percentile die)</li>
    <li><code>d1000</code> - Roll a d1000</li>
    <li><code>2d50+10</code> - Roll two d50s and add 10</li>
    <li><code>d100 adv</code> - Roll a d100 with advantage</li>
  </ul>
  <p>All standard command features work with any die number: modifiers, advantage/disadvantage, multiple dice, and independent rolls.</p>
  
  <h3>Common Dice Types (with buttons)</h3>
  <p>For convenience, quick-access buttons are provided for these common dice types:</p>
  <ul>
    <li><strong>d4</strong> (Tetrahedron) - 4-sided die</li>
    <li><strong>d6</strong> (Cube) - 6-sided die, standard cube</li>
    <li><strong>d8</strong> (Octahedron) - 8-sided die</li>
    <li><strong>d10</strong> (Pentagonal Trapezohedron) - 10-sided die</li>
    <li><strong>d12</strong> (Dodecahedron) - 12-sided die</li>
    <li><strong>d20</strong> (Icosahedron) - 20-sided die, standard for many RPGs</li>
  </ul>
  <p>Remember: These buttons are just shortcuts. You can roll any die number using the command input!</p>
  
  <h2>Tips</h2>
  <ul>
    <li>Press <strong>Escape</strong> in the command input to clear it</li>
    <li>Press <strong>Enter</strong> to execute the command</li>
    <li>Rolls are automatically saved to your browser's local storage</li>
    <li>You can use the app while the help window is open (non-modal)</li>
  </ul>
`
</script>

<style scoped>
.dice-roller-app {
  padding: clamp(12px, 2vw, 24px);
  height: 100%;
  overflow-y: auto;
  background: var(--surface-ground);
  box-sizing: border-box;
}

.dice-header {
  margin-bottom: clamp(12px, 2vw, 20px);
}

.dice-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: clamp(12px, 1.5vw, 14px);
}

.dice-content {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vw, 20px);
}

.dice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(50px, 10vw, 70px), 1fr));
  gap: clamp(4px, 1vw, 8px);
}

/* On very small windows, stack dice in fewer columns */
@media (max-width: 400px) {
  .dice-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.die-button {
  background: var(--surface-section);
  border: 1px solid var(--surface-border);
  border-radius: clamp(4px, 0.8vw, 6px);
  padding: clamp(6px, 1vw, 10px) clamp(4px, 0.8vw, 8px);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2px, 0.5vw, 4px);
  min-height: clamp(40px, 7vw, 55px);
  position: relative;
  overflow: hidden;
}

.die-button:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.die-button:active:not(:disabled) {
  transform: translateY(0);
}

.die-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.die-button.rolling {
  animation: rollAnimation 0.5s ease-in-out infinite;
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.die-button.rolling .die-icon,
.die-button.rolling .die-label {
  color: white;
}

@keyframes rollAnimation {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-5deg) scale(1.05);
  }
  50% {
    transform: rotate(5deg) scale(1.05);
  }
  75% {
    transform: rotate(-5deg) scale(1.05);
  }
}

.die-icon {
  font-size: clamp(14px, 2.5vw, 20px);
  font-weight: 700;
  color: var(--primary-color);
  transition: color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.die-icon svg {
  width: 100%;
  height: 100%;
  color: inherit;
}

.die-icon path,
.die-icon polygon,
.die-icon rect,
.die-icon circle,
.die-icon line {
  stroke: currentColor;
}

.die-label {
  font-size: clamp(8px, 1vw, 10px);
  color: var(--text-color-secondary);
  text-align: center;
  transition: color 0.3s;
  line-height: 1.1;
}

.result-section {
  background: var(--surface-section);
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(10px, 1.5vw, 16px);
  text-align: center;
  border: 1px solid var(--surface-border);
  min-height: clamp(60px, 10vw, 100px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(6px, 1vw, 10px);
  width: 100%;
}

.result-label {
  font-size: clamp(12px, 1.8vw, 14px);
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-value {
  font-size: clamp(24px, 5vw, 40px);
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  min-height: clamp(28px, 6vw, 45px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.result-value.rolling {
  animation: numberRoll 0.3s ease-in-out infinite;
}

@keyframes numberRoll {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.result-die {
  font-size: clamp(14px, 2.2vw, 18px);
  color: var(--text-color-secondary);
  font-weight: 500;
}

.result-placeholder {
  color: var(--text-color-secondary);
  font-size: clamp(12px, 2vw, 16px);
}

.history-section {
  background: var(--surface-section);
  border-radius: clamp(8px, 1.5vw, 12px);
  padding: clamp(12px, 2.5vw, 20px);
  border: 1px solid var(--surface-border);
}

.history-tabs {
  display: flex;
  gap: clamp(4px, 0.8vw, 6px);
  margin-bottom: clamp(8px, 1.5vw, 12px);
  border-bottom: 1px solid var(--surface-border);
}

.tab-button {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px);
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: clamp(12px, 1.8vw, 14px);
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-button:hover {
  color: var(--text-color);
  background: var(--surface-hover);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 600;
}

.history-empty {
  padding: clamp(12px, 2vw, 16px);
  text-align: center;
  color: var(--text-color-secondary);
  font-size: clamp(11px, 1.6vw, 13px);
  font-style: italic;
}

.history-section h3 {
  margin: 0 0 clamp(8px, 2vw, 16px) 0;
  color: var(--text-color);
  font-size: clamp(14px, 2.2vw, 18px);
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 1vw, 8px);
  max-height: clamp(120px, 25vw, 200px);
  overflow-y: auto;
  margin-bottom: clamp(8px, 2vw, 16px);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px);
  background: var(--surface-ground);
  border-radius: clamp(4px, 0.8vw, 6px);
  font-size: clamp(12px, 1.8vw, 14px);
  gap: clamp(8px, 1.5vw, 12px);
}

.history-left {
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.5vw, 4px);
  flex: 1;
  min-width: 0;
}

.history-die {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.history-result {
  color: var(--primary-color);
  font-weight: 700;
  font-size: clamp(14px, 2vw, 16px);
}

.clear-button {
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: clamp(4px, 0.8vw, 6px);
  padding: clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px);
  cursor: pointer;
  color: var(--text-color);
  font-size: clamp(12px, 1.8vw, 14px);
  transition: all 0.2s;
  width: 100%;
}

.clear-button:hover {
  background: var(--surface-border);
}

.command-section {
  margin-bottom: clamp(12px, 3vw, 24px);
}

.command-input-wrapper {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1vw, 8px);
  background: var(--surface-section);
  border: 2px solid var(--surface-border);
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px);
  transition: border-color 0.2s;
}

.command-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.command-icon {
  color: var(--text-color-secondary);
  font-size: clamp(12px, 2vw, 16px);
  flex-shrink: 0;
}

.command-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: clamp(12px, 1.8vw, 14px);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  outline: none;
  min-width: 0;
}

.command-input::placeholder {
  color: var(--text-color-secondary);
}

/* Hide placeholder text on very small screens */
@media (max-width: 300px) {
  .command-input::placeholder {
    font-size: 0;
  }
}

.command-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.command-button {
  background: var(--primary-color);
  border: none;
  border-radius: clamp(4px, 0.8vw, 6px);
  padding: clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-width: clamp(28px, 4.5vw, 36px);
  flex-shrink: 0;
}

.command-button:hover:not(:disabled) {
  background: var(--primary-color);
  opacity: 0.9;
  transform: scale(1.05);
}

.command-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.command-error {
  margin-top: clamp(6px, 1vw, 8px);
  padding: clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: clamp(4px, 0.8vw, 6px);
  color: #ef4444;
  font-size: clamp(11px, 1.6vw, 13px);
}

.multi-roll-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(6px, 1vw, 8px);
  width: 100%;
}

.individual-rolls {
  display: flex;
  align-items: center;
  gap: clamp(2px, 0.5vw, 4px);
  flex-wrap: wrap;
  justify-content: center;
  font-size: clamp(12px, 2vw, 16px);
  color: var(--text-color-secondary);
}

.individual-roll {
  background: var(--surface-ground);
  padding: clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px);
  border-radius: clamp(3px, 0.5vw, 4px);
  font-weight: 600;
  color: var(--primary-color);
}

.modifier {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.result-command {
  font-size: clamp(10px, 1.5vw, 13px);
  color: var(--text-color-secondary);
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.accept-button {
  background: var(--primary-color);
  border: none;
  border-radius: clamp(4px, 0.8vw, 6px);
  padding: clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px);
  color: white;
  cursor: pointer;
  font-size: clamp(11px, 1.5vw, 13px);
  font-weight: 600;
  transition: all 0.2s;
  margin-top: clamp(4px, 0.8vw, 6px);
}

.accept-button:hover:not(:disabled) {
  background: var(--primary-color);
  opacity: 0.9;
  transform: scale(1.05);
}

.accept-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.accept-button.accepted {
  background: var(--surface-hover);
  color: var(--text-color-secondary);
  border: 1px solid var(--surface-border);
}

.accept-button.accepted:hover {
  transform: none;
}

.history-command {
  color: var(--text-color-secondary);
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: clamp(11px, 1.6vw, 13px);
}

.advantage-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(4px, 0.8vw, 6px);
  width: 100%;
}

.advantage-type-label {
  font-size: clamp(12px, 2vw, 14px);
  color: var(--primary-color);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.advantage-rolls {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.2vw, 10px);
  font-size: clamp(14px, 2.5vw, 18px);
}

.advantage-roll {
  background: var(--surface-ground);
  padding: clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px);
  border-radius: clamp(4px, 0.8vw, 6px);
  font-weight: 600;
  color: var(--text-color-secondary);
  border: 1px solid var(--surface-border);
  transition: all 0.3s;
}

.advantage-roll.selected {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.advantage-selected {
  font-size: clamp(11px, 1.5vw, 13px);
  color: var(--text-color);
  margin-top: clamp(2px, 0.5vw, 4px);
}

.advantage-selected strong {
  color: var(--primary-color);
  font-size: clamp(12px, 2vw, 16px);
}

.advantage-modifier {
  font-size: clamp(11px, 1.8vw, 13px);
  color: var(--text-color-secondary);
  font-style: italic;
}

.history-advantage {
  font-size: clamp(10px, 1.4vw, 12px);
  color: var(--text-color-secondary);
  font-style: italic;
  margin: 0 clamp(4px, 1vw, 8px);
}

.history-item-independent {
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(4px, 1vw, 8px);
}

.history-independent-rolls {
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.5vw, 4px);
  margin-top: clamp(4px, 0.8vw, 6px);
  width: 100%;
}

.history-independent-roll {
  display: flex;
  align-items: center;
  gap: clamp(4px, 1vw, 8px);
  font-size: clamp(11px, 1.6vw, 13px);
  flex-wrap: wrap;
}

.history-independent-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  min-width: clamp(50px, 8vw, 70px);
}

.history-independent-value {
  color: var(--primary-color);
  font-weight: 600;
}

.history-result-independent {
  color: var(--primary-color);
  font-weight: 700;
  font-size: clamp(14px, 2vw, 16px);
  align-self: flex-end;
}

.independent-rolls-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.5vw, 12px);
  width: 100%;
}

.independent-rolls-list {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vw, 16px);
  width: 100%;
}

.independent-roll-item {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(10px, 1.5vw, 14px);
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1vw, 8px);
}

.independent-roll-header {
  display: flex;
  align-items: center;
  margin-bottom: clamp(4px, 0.8vw, 6px);
}

.independent-roll-label {
  font-size: clamp(11px, 1.6vw, 13px);
  color: var(--text-color-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.independent-advantage,
.independent-multi,
.independent-single {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(4px, 0.8vw, 6px);
}
</style>

