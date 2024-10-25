<template>
  <div class="leaderboard">
    <h2>🏆 Leaderboard</h2>
    <div class="active-players">
      <span class="active-label">Online Players:</span>
      <span v-if="activePlayers.length === 0">None</span>
      <span v-else class="player-list">
        <span 
          v-for="(player, index) in activePlayers" 
          :key="player"
          class="active-player"
        >
          {{ player }}{{ index < activePlayers.length - 1 ? ', ' : '' }}
        </span>
      </span>
    </div>
    <div class="leaderboard-entries">
      <div v-for="(player, index) in leaderboard" :key="player.username" class="entry">
        <span class="rank">{{ index + 1 }}</span>
        <span class="username">
          {{ player.username }}
          <span 
            class="status-indicator" 
            :class="{ 'online': isPlayerActive(player.username) }"
            :title="isPlayerActive(player.username) ? 'Online' : 'Offline'"
          ></span>
        </span>
        <span class="cookies">🍪 {{ Math.floor(player.cookies) }}</span>
        <span class="cps">({{ player.cookiesPerSecond.toFixed(1) }}/s)</span>
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
    }
  },
  methods: {
    isPlayerActive(username) {
      return this.activePlayers.includes(username)
    }
  }
}
</script>

<style scoped>
.leaderboard {
  margin-top: 20px;
  padding: 15px;
  background: #2a2a2a;
  border-radius: 5px;
}

h2 {
  color: #00ff00;
  margin-top: 0;
  margin-bottom: 15px;
}

.entry {
  display: flex;
  align-items: center;
  padding: 5px 0;
  color: #00ff00;
}

.rank {
  width: 30px;
}

.username {
  flex: 1;
}

.cookies {
  margin-right: 10px;
}

.cps {
  color: #00aa00;
}

.active-players {
  color: #888;
  font-size: 0.9em;
  margin-bottom: 15px;
  padding: 8px;
  background: #222;
  border-radius: 4px;
}

.active-label {
  color: #00ff00;
  margin-right: 8px;
}

.player-list {
  color: #fff;
}

.active-player {
  color: #00ff00;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
  background-color: #ff3333;
  transition: background-color 0.3s ease;
}

.status-indicator.online {
  background-color: #00ff00;
}
</style>
