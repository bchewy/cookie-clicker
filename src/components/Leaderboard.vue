<template>
  <div class="leaderboard">
    <h2>🏆 Leaderboard</h2>
    <div class="online-count">
      <span class="online-label">Players Online:</span>
      <span class="count">{{ activePlayers.length }}</span>
    </div>
    <div class="leaderboard-entries">
      <div v-for="(player, index) in sortedLeaderboard" 
           :key="player.username" 
           class="entry"
           :class="{ 'current-user': player.username === currentUser }">
        <div class="rank-section">
          <span class="rank">{{ index + 1 }}</span>
          <div class="status-dot" :class="{ 'online': isPlayerActive(player.username) }" 
               :title="isPlayerActive(player.username) ? 'Online' : 'Offline'"></div>
        </div>
        <div class="player-info">
          <span class="username">{{ player.username }}</span>
          <div class="stats">
            <span class="cookies">🍪 {{ formatNumber(player.cookies) }}</span>
            <span class="cps">({{ formatNumber(player.cookies_per_second) }}/s)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Leaderboard',
  props: {
    leaderboard: {
      type: Array,
      required: true,
      default: () => []
    },
    activePlayers: {
      type: Array,
      required: true,
      default: () => []
    },
    currentUser: {
      type: String,
      default: ''
    }
  },
  computed: {
    sortedLeaderboard() {
      return [...this.leaderboard].sort((a, b) => b.cookies - a.cookies)
    }
  },
  methods: {
    isPlayerActive(username) {
      return this.activePlayers.includes(username)
    },
    formatNumber(num) {
      if (num === undefined || num === null) return '0'
      if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
      if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
      return Math.floor(num).toLocaleString()
    }
  }
}
</script>

<style scoped>
.leaderboard {
  background: #1e1e1e;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #333;
}

h2 {
  color: #00ff00;
  margin: 0 0 1rem 0;
  text-align: center;
}

.online-count {
  background: #2a2a2a;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.online-label {
  color: #888;
  margin-right: 0.5rem;
}

.count {
  color: #00ff00;
  font-weight: bold;
}

.entry {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: #2a2a2a;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.entry:hover {
  background: #333;
}

.current-user {
  border: 1px solid #00ff00;
  background: #1a2a1a;
}

.rank-section {
  display: flex;
  align-items: center;
  width: 60px;
}

.rank {
  color: #888;
  width: 30px;
  text-align: right;
  margin-right: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff3333;
  margin-right: 0.5rem;
  transition: background-color 0.3s ease;
}

.status-dot.online {
  background-color: #00ff00;
  box-shadow: 0 0 5px #00ff00;
}

.player-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.username {
  color: #fff;
  font-weight: bold;
}

.stats {
  display: flex;
  gap: 0.5rem;
  color: #00ff00;
}

.cookies {
  color: #00ff00;
}

.cps {
  color: #888;
  font-size: 0.9em;
}
</style>
