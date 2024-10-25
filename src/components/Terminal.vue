<template>
  <div class="terminal" @click="focusInput" :class="{ 'terminal-expanded': isExpanded }">
    <div class="terminal-header">
      <div class="cookie-counter">
        🍪 {{ formatNumber(cookies) }}
      </div>
      <button class="expand-button" @click.stop="toggleExpand">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path v-if="!isExpanded" d="M3 3h4V1H1v6h2V3zm10 0v4h2V1h-6v2h4zm-10 10H3V9H1v6h6v-2H3zm10 0h-4v2h6V9h-2v4z"/>
          <path v-else d="M1 3h2v4h4V1H1v2zm12 0v4h2V1h-6v6h4zM3 13v-4H1v6h6v-2H3zm10 0h-4v2h6V9h-2v4z"/>
        </svg>
      </button>
      <button v-if="isExpanded" class="exit-button" @click.stop="exitFullscreen">
        ✕
      </button>
    </div>
    <div class="terminal-history" ref="history">
      <div v-for="(entry, index) in commandHistory" :key="index">
        <div class="command-line">
          <span class="prompt">{{ username }}@cookie.bchwy.com:~$</span>
          {{ entry.command }}
        </div>
        <div class="output" v-html="formatOutput(entry.output)"></div>
      </div>
    </div>
    <div class="command-input">
      <span class="prompt">{{ username }}@cookie.bchwy.com:~$</span>
      <input type="text" v-model="currentCommand" @keyup.enter="submitCommand" @keyup.up="previousCommand"
        @keyup.down="nextCommand" autofocus ref="commandInput" class="command-input-field">
    </div>
  </div>
</template>

<script>
export default {
  name: 'Terminal',
  props: {
    commandHistory: {
      type: Array,
      required: true
    },
    username: {
      type: String,
      default: 'guest'
    },
    // Add new prop for cookies
    cookies: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentCommand: '',
      commandBuffer: [],
      commandIndex: -1,
      isExpanded: false
    }
  },
  watch: {
    commandHistory: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    }
  },
  methods: {
    submitCommand() {
      if (this.currentCommand.trim()) {
        this.commandBuffer.push(this.currentCommand)
        this.commandIndex = this.commandBuffer.length
        this.$emit('command', this.currentCommand.trim())
        this.currentCommand = ''
      }
    },
    previousCommand() {
      if (this.commandIndex > 0) {
        this.commandIndex--
        this.currentCommand = this.commandBuffer[this.commandIndex]
      }
    },
    nextCommand() {
      if (this.commandIndex < this.commandBuffer.length - 1) {
        this.commandIndex++
        this.currentCommand = this.commandBuffer[this.commandIndex]
      } else {
        this.commandIndex = this.commandBuffer.length
        this.currentCommand = ''
      }
    },
    formatOutput(output) {
      return output.replace(/\n/g, '<br>')
    },
    focusInput() {
      this.$refs.commandInput.focus()
    },
    scrollToBottom() {
      if (this.$refs.history) {
        this.$refs.history.scrollTop = this.$refs.history.scrollHeight
      }
    },
    
    toggleExpand(event) {
      event.preventDefault()
      this.isExpanded = !this.isExpanded
      // Ensure input stays focused after expanding
      this.$nextTick(() => {
        this.focusInput()
      })
    },
    
    formatNumber(num) {
      if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
      return num.toFixed(1)
    },
    
    exitFullscreen() {
      this.isExpanded = false
      this.$nextTick(() => {
        this.focusInput()
      })
    }
  },
  mounted() {
    this.focusInput()
  }
}
</script>

<style scoped>
.terminal {
  background-color: #1e1e1e;
  color: #00ff00;
  padding: 15px;
  border-radius: 5px;
  height: 400px;
  overflow-y: auto;
  font-family: 'Ubuntu Mono', monospace;
  cursor: text;
  position: relative;
  transition: all 0.3s ease;
}

.terminal-expanded {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  width: 100vw;
  z-index: 1001;
  border-radius: 0;
  padding-top: 60px;
}

.terminal-header {
  position: fixed;
  top: 15px;
  right: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1002;
  background-color: rgba(30, 30, 30, 0.9);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.cookie-counter {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.expand-button {
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.expand-button:hover {
  opacity: 1;
}

.terminal-history {
  max-height: calc(100% - 60px);
  overflow-y: auto;
  margin-bottom: 10px;
  padding-bottom: 10px;
  padding-top: 10px;
}

/* Ensure the command input stays at the bottom when expanded */
.command-input {
  display: flex;
  position: sticky;
  bottom: 0;
  background-color: #1e1e1e;
  padding: 10px 0;
  align-items: baseline;
}

.prompt {
  color: #00ff00;
  margin-right: 8px;
  white-space: nowrap;
  display: inline;
}

input {
  background: transparent;
  border: none;
  color: #00ff00;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 16px;
  flex: 1;
  outline: none;
  padding: 0;
  margin: 0;
  line-height: 1.2;
  height: 20px;
}

.exit-button {
  background: rgba(255, 68, 68, 0.2);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
  cursor: pointer;
  padding: 6px 12px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: all 0.2s ease;
  border-radius: 4px;
  min-width: 32px;
  min-height: 32px;
}

.exit-button:hover {
  opacity: 1;
  background-color: rgba(255, 68, 68, 0.3);
  transform: scale(1.05);
}

.command-line {
  margin-top: 5px;
  display: flex;
  align-items: baseline;
}

.command-line .prompt {
  flex-shrink: 0;
}

.output {
  margin-left: 20px;
  color: #ffffff;
}

.terminal-history {
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding-bottom: 10px;
}

.output {
  white-space: pre-wrap;
}

.command-input-field {
  caret-color: #00ff00;
  animation: blink 1s step-end infinite;
}

@keyframes blink {

  from,
  to {
    caret-color: #00ff00;
  }

  50% {
    caret-color: transparent;
  }
}
</style>

