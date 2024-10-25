<template>
  <div class="container">
    <Login 
      v-if="!username" 
      :username="username" 
      @login="handleLogin"
    />
    <template v-else>
      <h1>Bash Cookie Clicker</h1>
      <GameIntro 
        v-if="showIntro" 
        @close="showIntro = false"
      />
      <CookieDisplay 
        :cookies="cookies" 
        :cookiesPerSecond="cookiesPerSecond"
      />
      <Terminal 
        @command="handleCommand"
        :commandHistory="commandHistory"
      />
      <Leaderboard 
        :leaderboard="leaderboard" 
        :activePlayers="activePlayers"
      />
    </template>
  </div>
</template>

<script>
import Terminal from './components/Terminal.vue'
import CookieDisplay from './components/CookieDisplay.vue'
import Leaderboard from './components/Leaderboard.vue'
import Login from './components/Login.vue'
import GameIntro from './components/GameIntro.vue'

const UPGRADES = {
  'auto-clicker': {
    name: 'Auto Clicker',
    baseCost: 5,
    cps: 0.2,
    description: 'Automatically clicks once per second'
  },
  'grandma': {
    name: 'Cookie Grandma',
    baseCost: 25,
    cps: 1.5,
    description: 'A nice grandma to bake cookies'
  },
  'factory': {
    name: 'Cookie Factory',
    baseCost: 100,
    cps: 8,
    description: 'An industrial cookie factory'
  },
  'mine': {
    name: 'Cookie Mine',
    baseCost: 500,
    cps: 25,
    description: 'Deep underground cookie extraction'
  },
  'lab': {
    name: 'Cookie Lab',
    baseCost: 2000,
    cps: 100,
    description: 'Scientific cookie research facility'
  },
  'wizard': {
    name: 'Cookie Wizard',
    baseCost: 5000,
    cps: 300,
    description: 'Magical cookie conjuring'
  }
}

export default {
  name: 'App',
  components: {
    Terminal,
    CookieDisplay,
    Leaderboard,
    Login,
    GameIntro
  },
  data() {
    return {
      cookies: 0,
      commandHistory: [],
      upgrades: {},
      cookiesPerSecond: 0,
      clickPower: 1,
      achievements: new Set(),
      multiplier: 1,
      username: '',
      password: '', // Add this line
      leaderboard: [],
      ws: null,
      activePlayers: [],
      showIntro: true // Add this line
    }
  },
  created() {
    // Only initialize leaderboard updates
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.syncWithServer()
      }
    }, 1000)
  },
  methods: {
    handleLogin(loginData) {
      this.username = loginData.username
      this.password = loginData.password  // Store the password
      this.connectWebSocket()
      this.initializeGame()
    },

    initializeGame() {
      // Initialize upgrades
      for (const [key, upgrade] of Object.entries(UPGRADES)) {
        this.upgrades[key] = {
          ...upgrade,
          count: 0
        }
      }
      
      // Start the auto-cookie generation
      setInterval(this.generateCookies, 1000)
      
      // Load saved game if exists
      this.loadGame()
    },

    handleCommand(command) {
      // Sanitize command input
      const sanitizedCommand = this.sanitizeInput(command);
      if (sanitizedCommand !== command) {
        this.commandHistory.push({ 
          command, 
          output: 'Invalid command: Special characters not allowed' 
        });
        return;
      }

      const args = command.split(' ')
      const cmd = args[0]

      switch(cmd) {
        case 'click-cookie':
        case 'click':
          const clickReward = this.clickPower * this.multiplier
          this.cookies += clickReward
          this.commandHistory.push({ 
            command, 
            output: `Cookie clicked! +${clickReward.toFixed(1)} 🍪` 
          })
          this.checkAchievements()
          break

        case 'cookie-count':
        case 'stats':
          this.commandHistory.push({ 
            command, 
            output: `You have ${this.cookies.toFixed(1)} cookies\nCookies per second: ${this.cookiesPerSecond.toFixed(1)}\nClick power: ${this.clickPower}` 
          })
          break

        case 'help':
          this.showHelp()
          break

        case 'buy':
          this.handleBuy(args[1])
          break

        case 'ls':
        case 'shop':
          this.showShop()
          break

        case 'save':
          this.saveGame()
          this.commandHistory.push({ command, output: 'Game saved! 💾' })
          break

        case 'clear':
          this.commandHistory = []
          break

        case 'achievements':
          this.showAchievements()
          break

        default:
          this.commandHistory.push({ command, output: 'Command not found: ' + command })
      }
    },

    generateCookies() {
      this.cookies += this.cookiesPerSecond
      this.syncWithServer()
    },

    handleBuy(item) {
      if (!item) {
        this.commandHistory.push({ 
          command: 'buy', 
          output: 'Usage: buy <item-name>' 
        })
        return
      }

      const upgrade = this.upgrades[item]
      if (!upgrade) {
        this.commandHistory.push({ 
          command: 'buy ' + item, 
          output: 'Item not found: ' + item 
        })
        return
      }

      const cost = this.calculateCost(item)
      if (this.cookies >= cost) {
        this.cookies -= cost
        upgrade.count++
        this.recalculateCPS()
        this.commandHistory.push({ 
          command: 'buy ' + item, 
          output: `Bought ${upgrade.name}! You now have ${upgrade.count} of them.` 
        })
      } else {
        this.commandHistory.push({ 
          command: 'buy ' + item, 
          output: `Not enough cookies! Need ${cost.toFixed(1)} cookies.` 
        })
      }
    },

    calculateCost(item) {
      const upgrade = this.upgrades[item]
      return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count))
    },

    recalculateCPS() {
      this.cookiesPerSecond = Object.values(this.upgrades)
        .reduce((total, upgrade) => total + (upgrade.cps * upgrade.count), 0)
    },

    showHelp() {
      const help = `
Available commands:
- click-cookie (or click): Click the cookie manually
- cookie-count (or stats): Show current cookies and stats
- ls (or shop): Show available upgrades
- buy <item>: Purchase an upgrade
- save: Save your progress
- clear: Clear terminal
- achievements: Show your achievements
- help: Show this help message
      `.trim()
      this.commandHistory.push({ command: 'help', output: help })
    },

    showShop() {
      const shop = Object.entries(this.upgrades)
        .map(([key, upgrade]) => {
          const cost = this.calculateCost(key)
          return `${key}: ${upgrade.description} (Cost: ${cost.toFixed(1)} cookies, CPS: ${upgrade.cps}, Owned: ${upgrade.count})`
        })
        .join('\n')
      this.commandHistory.push({ command: 'ls', output: shop })
    },

    saveGame() {
      const saveData = {
        cookies: this.cookies,
        upgrades: this.upgrades,
        clickPower: this.clickPower,
        achievements: Array.from(this.achievements),
        multiplier: this.multiplier
      }
      localStorage.setItem('cookieClickerSave', JSON.stringify(saveData))
    },

    loadGame() {
      const saveData = localStorage.getItem('cookieClickerSave')
      if (saveData) {
        const data = JSON.parse(saveData)
        this.cookies = data.cookies
        this.upgrades = data.upgrades
        this.clickPower = data.clickPower
        this.achievements = new Set(data.achievements || [])
        this.multiplier = data.multiplier || 1
        this.recalculateCPS()
      }
    },

    checkAchievements() {
      const milestones = [100, 1000, 10000, 100000, 1000000]
      const currentMilestone = milestones.find(m => this.cookies >= m && !this.achievements.has(`cookies-${m}`))
      
      if (currentMilestone) {
        this.achievements.add(`cookies-${currentMilestone}`)
        this.multiplier += 0.1
        this.commandHistory.push({
          command: 'achievement',
          output: `🏆 Achievement unlocked: ${currentMilestone} cookies! Multiplier increased to ${this.multiplier.toFixed(1)}x`
        })
      }
    },

    showAchievements() {
      const output = this.achievements.size > 0 
        ? Array.from(this.achievements).join('\n')
        : 'No achievements yet. Keep clicking!'
      this.commandHistory.push({
        command: 'achievements',
        output: `🏆 Achievements:\n${output}\nCurrent multiplier: ${this.multiplier.toFixed(1)}x`
      })
    },

    connectWebSocket() {
      this.ws = new WebSocket('ws://localhost:3000')
      
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({
          type: 'register',
          username: this.username,
          password: this.password
        }))
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch(message.type) {
            case 'init':
              if (message.player) {
                this.cookies = message.player.cookies || 0
                this.cookiesPerSecond = message.player.cookiesPerSecond || 0
                this.recalculateCPS()
              }
              break
              
            case 'leaderboard':
              this.leaderboard = message.data || []
              this.activePlayers = message.activePlayers || []
              console.log('Active players updated:', this.activePlayers) // Add logging
              break

            case 'error':
              console.error('WebSocket error:', message.error)
              break
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      this.ws.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...')
        setTimeout(() => this.connectWebSocket(), 5000)
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    },
    
    syncWithServer() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'update',
          username: this.username,
          password: this.password,  // Include password in updates
          cookies: this.cookies,
          cookiesPerSecond: this.cookiesPerSecond
        }))
      }
    },

    // Add input sanitization
    sanitizeInput(input) {
      return input.replace(/[<>{}()\/\\]/g, '');
    },

    startPolling() {
      setInterval(async () => {
        try {
          // Update player data
          const response = await fetch(`${API_URL}/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: this.username,
              password: this.password,
              cookies: this.cookies,
              cookiesPerSecond: this.cookiesPerSecond
            })
          });

          // Get leaderboard
          const leaderboardResponse = await fetch(`${API_URL}/leaderboard`);
          const leaderboardData = await leaderboardResponse.json();
          this.leaderboard = leaderboardData;
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000); // Poll every 5 seconds
    }
  }
}
</script>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Ubuntu Mono', monospace;
}

h1 {
  text-align: center;
  color: #00ff00;
}

/* Add styles for disabled state */
.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>

