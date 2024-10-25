<template>
  <div class="game-intro">
    <div class="intro-content">
      <div class="intro-header">
        <h2>Welcome to Bash Cookie Clicker!</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <div class="intro-sections">
        <div class="section">
          <h3>Commands:</h3>
          <code>click</code> - Click cookie
          <code>shop</code> - View upgrades
          <code>buy &lt;item&gt; [quantity]</code> - Buy upgrade(s). Quantity is optional (default: 1)
          <code>stats</code> - View stats
          <code>help</code> - Show all commands
        </div>

        <div class="section">
          <h3>Tips:</h3>
          <ul>
            <li>Start clicking → Buy auto-clickers → Profit!</li>
            <li>Compete on the leaderboard</li>
            <li>Progress saves automatically</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameIntro'
}
</script>

<style scoped>
.game-intro {
  background: #1e1e1e;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #00ff00;
  font-size: 0.9em;
}

.intro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

h2 {
  color: #00ff00;
  margin: 0;
  font-size: 1.2em;
}

.close-button {
  background: none;
  border: none;
  color: #00ff00;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0 5px;
}

.intro-sections {
  display: flex;
  gap: 20px;
}

.section {
  flex: 1;
}

h3 {
  color: #00ff00;
  margin: 0 0 5px 0;
  font-size: 1em;
}

code {
  background: #2a2a2a;
  padding: 2px 4px;
  border-radius: 3px;
  color: #00ff00;
  margin-right: 8px;
  font-size: 0.9em;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin: 3px 0;
  color: #fff;
  font-size: 0.9em;
}

.intro-content {
  color: #fff;
}
</style>
