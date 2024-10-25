<template>
  <div class="container">
    <!-- Main content -->
    <div class="game-content" :class="{ 'blurred': !username }">
      <h1>Bash Cookie Clicker</h1>
      <GameIntro v-if="showIntro" @close="showIntro = false" />
      <CookieDisplay :cookies="cookies" :cookiesPerSecond="cookiesPerSecond" />
      <Terminal 
        @command="handleCommand" 
        :commandHistory="commandHistory" 
        :username="username"
        :cookies="cookies"
      />
      <Leaderboard :leaderboard="leaderboard" :activePlayers="activePlayers" :currentUser="username" />
    </div>

    <!-- Login overlay -->
    <div class="login-overlay" v-if="!username">
      <div class="login-box">
        <h2>🍪 Bash Cookie Clicker</h2>
        <div class="login-form">
          <input 
            type="text" 
            v-model="inputUsername" 
            placeholder="Username (min. 3 characters)"
            @keyup.enter="focusPassword" 
            ref="usernameInput" 
            :disabled="checking"
          >

          <input 
            type="password" 
            v-model="inputPassword" 
            placeholder="Password (dont put a real one..)"
            @keyup.enter="handleSubmit" 
            ref="passwordInput" 
            maxlength="20"
          >

          <div class="status" v-if="checking">Checking...</div>
          <div class="error" v-if="error">{{ error }}</div>

          <button 
            @click="handleSubmit" 
            :disabled="checking || !inputUsername.trim() || !isValidPassword"
          >
            Start Playing
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Terminal from './components/Terminal.vue'
import CookieDisplay from './components/CookieDisplay.vue'
import Leaderboard from './components/Leaderboard.vue'
import GameIntro from './components/GameIntro.vue'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './config'

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
  },
  'temple': {
    name: 'Cookie Temple',
    baseCost: 15000,
    cps: 1000,
    description: 'Sacred cookie shrine'
  },
  'timeMachine': {
    name: 'Time Machine',
    baseCost: 50000,
    cps: 3500,
    description: 'Cookies from other timelines'
  },
  'condenser': {
    name: 'Antimatter Condenser',
    baseCost: 150000,
    cps: 12000,
    description: 'Converts antimatter to cookies'
  },
  'prism': {
    name: 'Prism',
    baseCost: 500000,
    cps: 40000,
    description: 'Light becomes cookies'
  },
  'chancemaker': {
    name: 'Chancemaker',
    baseCost: 1500000,
    cps: 130000,
    description: 'Manipulates cookie probability'
  },
  'fractal': {
    name: 'Fractal Engine',
    baseCost: 5000000,
    cps: 430000,
    description: 'Recursive cookie generation'
  },
  'console': {
    name: 'Console',
    baseCost: 15000000,
    cps: 1400000,
    description: 'Hacks cookies into existence'
  },
  'idleverse': {
    name: 'Idleverse',
    baseCost: 50000000,
    cps: 4700000,
    description: 'Parallel cookie universes'
  },
  'ai': {
    name: 'Cookie AI',
    baseCost: 150000000,
    cps: 15600000,
    description: 'Artificial cookie intelligence'
  },
  'quantum': {
    name: 'Quantum Baker',
    baseCost: 500000000,
    cps: 52000000,
    description: 'Quantum cookie uncertainty'
  }
}

export default {
  name: 'App',
  components: {
    Terminal,
    CookieDisplay,
    Leaderboard,
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
      password: '',
      leaderboard: [],
      supabase: null,
      subscription: null,
      showIntro: true,
      activePlayers: [],
      leaderboardInterval: null,
      lastKnownCookies: 0,
      lastHiddenTime: null,
      isClosing: false,
      inputUsername: '',
      inputPassword: '',
      checking: false,
      error: null,
    }
  },
  computed: {
    isValidPassword() {
      return this.inputPassword.length >= 4 && this.inputPassword.length <= 20;
    }
  },
  created() {
    // Initialize Supabase client
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)

    // Add window unload listeners
    window.addEventListener('beforeunload', this.handleBeforeUnload)
    window.addEventListener('unload', this.handleBeforeUnload)

    // Add visibility change listener
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    initializeRealtimeSubscription() {
      // Set up realtime subscription for leaderboard updates
      this.subscription = this.supabase
        .channel('game-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'players'
          },
          (payload) => {
            this.fetchLeaderboard()
          }
        )
        .subscribe()

      // Use a single shared presence channel for all users
      this.presenceChannel = this.supabase
        .channel('online-users')
        .on('presence', { event: 'sync' }, () => {
          const presenceState = this.presenceChannel.presenceState()
          // Get all online users from the shared channel
          const onlineUsers = new Set()
          Object.values(presenceState).forEach(presences => {
            presences.forEach(presence => {
              if (presence.username) {
                onlineUsers.add(presence.username)
              }
            })
          })
          this.activePlayers = Array.from(onlineUsers)
          console.log('Active players:', this.activePlayers)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', leftPresences)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.presenceChannel.track({
              username: this.username,
              online_at: new Date().toISOString()
            })
          }
        })
    },

    // Replace startAutoSync with a more efficient version
    startAutoSync() {
      // Local cookie generation every second
      this.cookieInterval = setInterval(() => {
        this.cookies += this.cookiesPerSecond
      }, 1000)

      // Sync with server every 10 seconds
      this.syncInterval = setInterval(() => {
        this.syncWithServer()
      }, 10000)
    },

    async syncWithServer() {
      if (!this.username) return

      try {
        const { error } = await this.supabase
          .from('players')
          .update({
            cookies: this.cookies,
            cookies_per_second: this.cookiesPerSecond,
            upgrades: this.upgrades,
            last_updated: new Date().toISOString()
          })
          .eq('username', this.username)

        if (error) throw error

        await this.fetchLeaderboard()
      } catch (err) {
        console.error('Error syncing with server:', err)
      }
    },

    // Add cleanup method
    async cleanup(isUnloading = false) {
      if (this.isClosing) return
      this.isClosing = true

      try {
        if (this.username && this.supabase) {
          const now = new Date().toISOString()

          // Only update game state, not last_activity
          const { error } = await this.supabase
            .from('players')
            .update({
              cookies: this.cookies,
              cookies_per_second: this.cookiesPerSecond,
              last_updated: now,
              upgrades: this.upgrades
            })
            .eq('username', this.username)

          if (error) throw error
          console.log('Cleanup: Updated game state at:', now)
        }

        // Clear intervals
        if (this.cookieInterval) clearInterval(this.cookieInterval)
        if (this.syncInterval) clearInterval(this.syncInterval)
        if (this.leaderboardInterval) clearInterval(this.leaderboardInterval)

        // Clean up presence and subscription
        if (this.presenceChannel) {
          await this.presenceChannel.untrack()
          await this.presenceChannel.unsubscribe()
        }
        if (this.subscription) {
          await this.subscription.unsubscribe()
        }

      } catch (err) {
        console.error('Error during cleanup:', err)
      } finally {
        this.isClosing = false
      }
    },

    // Add a new method specifically for handling beforeunload
    handleBeforeUnload(event) {
      // Cancel the event as stated by the standard
      event.preventDefault()
      event.returnValue = ''

      if (this.username && this.supabase) {
        const now = new Date().toISOString()

        const data = {
          cookies: this.cookies,
          cookies_per_second: this.cookiesPerSecond,
          last_updated: now,
          last_activity: now,  // Update last_activity when closing
          upgrades: this.upgrades
        }

        // Create the endpoint URL with proper headers
        const endpoint = `${SUPABASE_CONFIG.url}/rest/v1/players?username=eq.${encodeURIComponent(this.username)}`

        // Send the beacon with proper headers
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        const success = navigator.sendBeacon(endpoint, blob)

        console.log('Updating last_activity time to:', now)
      }
    },

    // Update handleLogin method to properly load upgrades from database
    async handleLogin(loginData) {
      try {
        this.username = loginData.username
        this.password = loginData.password

        // Get the player's last state from database
        const { data: playerData, error } = await this.supabase
          .from('players')
          .select('cookies, cookies_per_second, last_activity, upgrades')
          .eq('username', loginData.username)
          .single()

        if (error) throw error

        // Initialize upgrades with base data and counts
        if (playerData.upgrades) {
          // Merge the base UPGRADES data with saved counts
          this.upgrades = Object.keys(UPGRADES).reduce((acc, key) => {
            acc[key] = {
              ...UPGRADES[key],
              count: (playerData.upgrades[key]?.count || 0)
            }
            return acc
          }, {})
        } else {
          // Initialize with zero counts if no saved data
          this.upgrades = Object.keys(UPGRADES).reduce((acc, key) => {
            acc[key] = {
              ...UPGRADES[key],
              count: 0
            }
            return acc
          }, {})
        }

        // Use last_activity for offline earnings calculation
        const lastActivity = new Date(playerData.last_activity)
        const now = new Date()
        const minutesOffline = (now - lastActivity) / 1000 / 60

        console.log('Last activity:', lastActivity)
        console.log('Current time:', now)
        console.log('Minutes offline:', minutesOffline)
        console.log('CPS:', playerData.cookies_per_second)

        // Set initial CPS
        this.cookiesPerSecond = playerData.cookies_per_second || 0

        // Calculate and apply offline earnings if more than 5 minutes have passed
        if (minutesOffline > 5) {
          const offlineEarnings = Math.floor(this.cookiesPerSecond * minutesOffline * 60 * 0.5) // 50% efficiency
          console.log('Calculated offline earnings:', offlineEarnings)

          if (offlineEarnings > 0) {
            this.cookies = playerData.cookies + offlineEarnings
            this.commandHistory.push({
              command: 'offline-earnings',
              output: `Welcome back! While you were away for ${this.formatTime(minutesOffline * 60)}, your cookies generated ${this.formatNumber(offlineEarnings)} cookies! 🍪\nCurrent cookies: ${this.formatNumber(this.cookies)}`
            })
          }
        } else {
          this.cookies = playerData.cookies
        }

        // Always update both timestamps on login
        await this.supabase
          .from('players')
          .update({
            cookies: this.cookies,
            cookies_per_second: this.cookiesPerSecond,
            last_updated: now.toISOString(),
            last_activity: now.toISOString(),  // Update activity time on login
            upgrades: this.upgrades
          })
          .eq('username', this.username)

        // Initialize game systems
        this.initializeRealtimeSubscription()
        this.initializeGame()
        this.startAutoSync()

        // Start leaderboard polling
        this.leaderboardInterval = setInterval(() => {
          this.fetchLeaderboard()
        }, 5000)

      } catch (err) {
        console.error('Error in handleLogin:', err)
        this.commandHistory.push({
          command: 'login-error',
          output: 'Error logging in. Please try again.'
        })
      }
    },

    async initializeSupabase() {
      this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)

      // Subscribe to realtime updates
      this.subscription = this.supabase
        .channel('public:players')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'players'
          },
          (payload) => {
            console.log('Realtime update:', payload)
            this.fetchLeaderboard()
          }
        )
        .subscribe()

      // Initial leaderboard fetch
      await this.fetchLeaderboard()
    },

    async fetchLeaderboard() {
      try {
        const { data: leaderboard, error } = await this.supabase
          .from('players')
          .select('username, cookies, cookies_per_second')
          .order('cookies', { ascending: false })
          .limit(10)

        if (error) throw error

        this.leaderboard = leaderboard || []
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      }
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

      switch (cmd) {
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
          if (args.length < 2) {
            this.commandHistory.push({
              command,
              output: 'Usage: buy <item-name> [amount|max]'
            })
            return
          }
          const item = args[1]
          const amount = args[2]
          this.handleBuy(item, amount)
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

    // Update handleBuy method to preserve user's upgrade data
    async handleBuy(item, amount = '1') {
      if (!item) {
        this.commandHistory.push({
          command: 'buy',
          output: 'Usage: buy <item-name> [amount|max]'
        })
        return
      }

      const upgrade = this.upgrades[item]
      if (!upgrade) {
        this.commandHistory.push({
          command: `buy ${item}`,
          output: 'Item not found: ' + item
        })
        return
      }

      let quantityToBuy = 0
      let totalCost = 0

      if (amount.toLowerCase() === 'max') {
        // Calculate maximum affordable quantity
        let cookies = this.cookies
        let count = upgrade.count || 0
        while (cookies >= this.calculateCost(item, count)) {
          cookies -= this.calculateCost(item, count)
          count++
          quantityToBuy++
        }
      } else {
        // Parse amount as number
        quantityToBuy = parseInt(amount)
        if (isNaN(quantityToBuy) || quantityToBuy < 1) {
          quantityToBuy = 1
        }

        // Calculate total cost for the requested quantity
        for (let i = 0; i < quantityToBuy; i++) {
          totalCost += this.calculateCost(item, (upgrade.count || 0) + i)
        }

        // Check if user can afford the total cost
        if (this.cookies < totalCost) {
          this.commandHistory.push({
            command: `buy ${item} ${amount}`,
            output: `Not enough cookies! Need ${this.formatNumber(totalCost)} cookies.`
          })
          return
        }
      }

      if (quantityToBuy === 0) {
        this.commandHistory.push({
          command: `buy ${item} ${amount}`,
          output: `Cannot afford any ${upgrade.name}!`
        })
        return
      }

      // Calculate final cost for the actual quantity being bought
      totalCost = 0
      for (let i = 0; i < quantityToBuy; i++) {
        totalCost += this.calculateCost(item, (upgrade.count || 0) + i)
      }

      // Process the purchase
      try {
        this.cookies -= totalCost
        this.upgrades[item] = {
          ...this.upgrades[item],
          count: (this.upgrades[item].count || 0) + quantityToBuy
        }

        this.recalculateCPS()

        // Sync with server
        const { error } = await this.supabase
          .from('players')
          .update({
            cookies: this.cookies,
            cookies_per_second: this.cookiesPerSecond,
            upgrades: this.upgrades,
            last_updated: new Date().toISOString()
          })
          .eq('username', this.username)

        if (error) throw error

        this.commandHistory.push({
          command: `buy ${item} ${amount}`,
          output: `Bought ${quantityToBuy}x ${upgrade.name} for ${this.formatNumber(totalCost)} cookies! You now have ${this.upgrades[item].count} of them.`
        })
      } catch (err) {
        console.error('Error syncing purchase:', err)
        this.commandHistory.push({
          command: `buy ${item} ${amount}`,
          output: 'Error saving purchase. Please try again.'
        })
      }
    },

    calculateCost(item, count = null) {
      const upgrade = this.upgrades[item]
      const currentCount = count !== null ? count : upgrade.count
      return Math.floor(upgrade.baseCost * Math.pow(1.15, currentCount))
    },

    recalculateCPS() {
      this.cookiesPerSecond = Object.values(this.upgrades)
        .reduce((total, upgrade) => total + (upgrade.cps * upgrade.count), 0)
      // Sync with server after CPS changes
      this.syncWithServer()
    },

    showHelp() {
      const help = `
Available commands:
- click-cookie (or click): Click the cookie manually
- cookie-count (or stats): Show current cookies and stats
- ls (or shop): Show available upgrades
- buy <item> [amount|max]: Purchase upgrade(s). Examples:
  • buy auto-clicker     (buy 1)
  • buy grandma 5        (buy 5)
  • buy factory max      (buy maximum affordable)
- save: Save your progress
- clear: Clear terminal
- achievements: Show your achievements
- help: Show this help message
      `.trim()
      this.commandHistory.push({ command: 'help', output: help })
    },

    showShop() {
      // Define column widths
      const cols = {
        item: 15,        // Width for item name
        cost: 11,        // Width for cost
        cps: 8,         // Width for CPS
        desc: 40        // Width for description (increased since we removed owned column)
      }

      // Create header and separator
      const header = [
        'ITEM'.padEnd(cols.item),
        'COST'.padStart(cols.cost),
        'CPS'.padStart(cols.cps),
        'DESCRIPTION'.padEnd(cols.desc)
      ].join(' | ')

      const separator = [
        '-'.repeat(cols.item),
        '-'.repeat(cols.cost),
        '-'.repeat(cols.cps),
        '-'.repeat(cols.desc)
      ].join('-|-')

      // Format each upgrade entry
      const shop = Object.entries(this.upgrades)
        .map(([key, upgrade]) => {
          const cost = this.calculateCost(key)
          // Truncate item name and description if too long
          const itemName = key.padEnd(cols.item).slice(0, cols.item)
          const description = upgrade.description.padEnd(cols.desc).slice(0, cols.desc)

          return [
            itemName,
            this.formatNumber(cost).padStart(cols.cost),
            this.formatNumber(upgrade.cps).padStart(cols.cps),
            description
          ].join(' | ')
        })
        .join('\n')

      // Combine everything
      const output = `${header}\n${separator}\n${shop}`

      this.commandHistory.push({
        command: 'ls',
        output: `Available Upgrades:\n\n${output}`
      })
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

    // Add input sanitization
    sanitizeInput(input) {
      return input.replace(/[<>{}()\/\\]/g, '');
    },

    beforeUnmount() {
      this.cleanup()
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      window.removeEventListener('unload', this.handleBeforeUnload)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    },

    // Add beforeRouteLeave navigation guard if using vue-router
    beforeRouteLeave(to, from, next) {
      this.cleanup()
      next()
    },

    // Update the handleVisibilityChange method
    async handleVisibilityChange() {
      if (!this.username) return

      if (document.hidden) {
        // Tab is hidden, store the timestamp and sync
        this.lastHiddenTime = new Date()
        await this.syncWithServer()
      } else {
        // Tab is visible again
        if (!this.lastHiddenTime) return

        const now = new Date()
        const minutesHidden = (now - this.lastHiddenTime) / 1000 / 60

        // Only process if more than 5 minutes have passed
        if (minutesHidden > 5) {
          // First get the latest state
          const { data: playerData, error } = await this.supabase
            .from('players')
            .select('cookies, cookies_per_second, last_activity')
            .eq('username', this.username)
            .single()

          if (!error && playerData) {
            const lastActivity = new Date(playerData.last_activity)
            const minutesOffline = (now - lastActivity) / 1000 / 60

            if (minutesOffline > 5) {
              const offlineEarnings = Math.floor(playerData.cookies_per_second * minutesOffline * 60 * 0.5)
              if (offlineEarnings > 0) {
                this.cookies = playerData.cookies + offlineEarnings
                this.showMessage(`Welcome back! You earned ${this.formatNumber(offlineEarnings)} cookies while away.`)
              }

              // Update both timestamps
              await this.supabase
                .from('players')
                .update({
                  cookies: this.cookies,
                  last_updated: now.toISOString(),
                  last_activity: now.toISOString()
                })
                .eq('username', this.username)
            }
          }
        }

        this.lastHiddenTime = null
      }
    },

    // Add this method
    formatOfflineEarnings(amount) {
      if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M`
      if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`
      return Math.floor(amount).toLocaleString()
    },

    // Add these helper methods
    formatTime(seconds) {
      if (seconds < 60) return `${seconds} seconds`
      if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`
      }
      const hours = Math.floor(seconds / 3600)
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    },

    formatNumber(num) {
      if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
      return num.toFixed(1)
    },

    focusPassword() {
      this.$refs.passwordInput.focus()
    },

    async handleSubmit() {
      if (!this.inputUsername.trim() || !this.isValidPassword) {
        this.error = 'Please enter valid username and password'
        return
      }

      if (this.inputUsername.length < 3) {
        this.error = 'Username must be at least 3 characters'
        return
      }

      this.checking = true
      this.error = ''

      try {
        console.log('Attempting login for:', this.inputUsername.trim())

        // First, check if user exists
        const { data: existingPlayer, error: fetchError } = await this.supabase
          .from('players')
          .select('*')
          .eq('username', this.inputUsername.trim())
          .single()

        console.log('Fetch result:', { existingPlayer, fetchError })

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch error:', fetchError)
          throw fetchError
        }

        let player
        if (existingPlayer) {
          // Login logic for existing player
          if (existingPlayer.password !== this.inputPassword) {
            throw new Error('Invalid password')
          }

          // Update player data
          const now = new Date()
          const lastActivity = new Date(existingPlayer.last_activity)
          const timeDiff = (now - lastActivity) / 1000 / 60

          const updates = {
            last_updated: now.toISOString()
          }

          if (timeDiff > 5) {
            updates.last_activity = now.toISOString()
          }

          const { data: updatedPlayer, error: updateError } = await this.supabase
            .from('players')
            .update(updates)
            .eq('id', existingPlayer.id)
            .select()
            .single()

          if (updateError) throw updateError
          player = updatedPlayer
        } else {
          // Create new player
          const now = new Date().toISOString()
          const { data: newPlayer, error: insertError } = await this.supabase
            .from('players')
            .insert([{
              username: this.inputUsername.trim(),
              password: this.inputPassword,
              cookies: 0,
              cookies_per_second: 0,
              last_updated: now,
              last_activity: now,
              upgrades: null
            }])
            .select()
            .single()

          if (insertError) {
            if (insertError.code === '23505') {
              throw new Error('Username already taken')
            }
            throw insertError
          }
          player = newPlayer
        }

        if (!player) {
          throw new Error('Failed to get player data')
        }

        // Store credentials
        localStorage.setItem('gameCredentials', JSON.stringify({
          username: this.inputUsername.trim(),
          password: this.inputPassword
        }))

        // Update app state
        this.username = player.username
        this.password = this.inputPassword
        this.cookies = player.cookies || 0
        this.cookiesPerSecond = player.cookies_per_second || 0

        // Initialize game after successful login
        this.initializeGame()
        this.startAutoSync()
        this.initializeRealtimeSubscription()

      } catch (err) {
        console.error('Login error:', err)
        this.error = err.message || 'Error processing request'
      } finally {
        this.checking = false
      }
    }
  },
  mounted() {
    this.$refs.usernameInput?.focus()

    // Check for stored credentials
    const stored = localStorage.getItem('gameCredentials')
    if (stored) {
      try {
        const { username, password } = JSON.parse(stored)
        this.inputUsername = username
        this.inputPassword = password
        this.handleSubmit()
      } catch (err) {
        console.error('Error loading stored credentials:', err)
        localStorage.removeItem('gameCredentials')
      }
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

.game-content {
  transition: filter 0.3s ease;
}

.game-content.blurred {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}

/* Login styles */
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-box {
  background: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h2 {
  color: #00ff00;
  margin-bottom: 2rem;
}

input {
  background: #2a2a2a;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 0.5rem;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  border-radius: 4px;
}

button {
  background: #00ff00;
  color: #000;
  border: none;
  padding: 0.5rem;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 4px;
}

button:hover {
  background: #00cc00;
}

button:disabled {
  background: #666;
  cursor: not-allowed;
}

.error {
  color: #ff4444;
  font-size: 0.9rem;
}

.status {
  color: #888;
  font-size: 0.9rem;
}
</style>


