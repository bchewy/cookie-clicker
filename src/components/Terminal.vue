<template>
  <div class="terminal">
    <div class="terminal-history" ref="history">
      <div v-for="(entry, index) in commandHistory" :key="index">
        <div class="command-line">
          <span class="prompt">brian@cookie.bchwy.com:~$</span>
          {{ entry.command }}
        </div>
        <div class="output" v-html="formatOutput(entry.output)"></div>
      </div>
    </div>
    <div class="command-input">
      <span class="prompt">brian@cookie.bchwy.com:~$</span>
      <input 
        type="text" 
        v-model="currentCommand"
        @keyup.enter="submitCommand"
        @keyup.up="previousCommand"
        @keyup.down="nextCommand"
        autofocus
        ref="commandInput"
      >
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
    }
  },
  data() {
    return {
      currentCommand: '',
      commandBuffer: [],
      commandIndex: -1
    }
  },
  methods: {
    submitCommand() {
      if (this.currentCommand.trim()) {
        this.commandBuffer.push(this.currentCommand)
        this.commandIndex = this.commandBuffer.length
        this.$emit('command', this.currentCommand.trim())
        this.currentCommand = ''
        this.$nextTick(() => {
          this.$refs.history.scrollTop = this.$refs.history.scrollHeight
        })
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
    }
  },
  mounted() {
    this.$refs.commandInput.focus()
  }
}
</script>

<style scoped>
.terminal {
  background-color: #1e1e1e;
  color: #00ff00;
  padding: 20px;
  border-radius: 5px;
  height: 400px;
  overflow-y: auto;
  font-family: 'Ubuntu Mono', monospace;
}

.command-input {
  display: flex;
  margin-top: 10px;
  align-items: center; /* This helps align the prompt and input */
}

.prompt {
  color: #00ff00;
  margin-right: 8px;
  white-space: nowrap;
}

input {
  background: transparent;
  border: none;
  color: #00ff00;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 16px;
  width: 100%;
  outline: none;
  padding: 0;
  margin: 0;
  line-height: 1.2;
}

.command-line {
  margin-top: 10px;
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
</style>
