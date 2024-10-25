<template>
  <div class="game-intro">
    <div class="intro-content">
      <div class="intro-header">
        <h2>Welcome to Bash Cookie Clicker!</h2>
        <button class="close-button" @click="$emit('close')" title="Close">×</button>
      </div>

      <div class="intro-sections">
        <div class="section commands">
          <h3>🖥️ Commands</h3>
          <div class="command-list">
            <div class="command-item">
              <code>click</code>
              <span>Click cookie</span>
            </div>
            <div class="command-item">
              <code>shop</code>
              <span>View upgrades</span>
            </div>
            <div class="command-item">
              <code>buy &lt;item&gt; [quantity|max]</code>
              <span>Buy upgrade(s). Quantity is optional</span>
            </div>
            <div class="command-item">
              <code>stats</code>
              <span>View stats</span>
            </div>
            <div class="command-item">
              <code>help</code>
              <span>Show all commands</span>
            </div>
          </div>
        </div>

        <div class="section tips">
          <h3>💡 Tips</h3>
          <ul>
            <li>
              <span class="tip-number">1.</span>
              Start clicking to earn cookies
            </li>
            <li>
              <span class="tip-number">2.</span>
              Buy auto-clickers to generate passive income
            </li>
            <li>
              <span class="tip-number">3.</span>
              Compete on the leaderboard with other players
            </li>
            <li>
              <span class="tip-number">4.</span>
              Progress saves automatically
            </li>
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
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid #00ff00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
}

.intro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 255, 0, 0.2);
}

h2 {
  color: #00ff00;
  margin: 0;
  font-size: 1.4em;
}

.close-button {
  background: none;
  border: none;
  color: #00ff00;
  font-size: 1.8em;
  cursor: pointer;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(0, 255, 0, 0.1);
  transform: scale(1.1);
}

.intro-sections {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2rem;
}

.section {
  background: rgba(0, 255, 0, 0.05);
  padding: 1.2rem;
  border-radius: 8px;
}

h3 {
  color: #00ff00;
  margin: 0 0 1rem 0;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.command-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.command-item {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

code {
  background: #2a2a2a;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  color: #00ff00;
  font-size: 0.9em;
  min-width: 80px;
  display: inline-block;
  border: 1px solid rgba(0, 255, 0, 0.2);
}

.command-item span {
  color: #fff;
  font-size: 0.9em;
  opacity: 0.9;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

li {
  color: #fff;
  font-size: 0.9em;
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  opacity: 0.9;
}

.tip-number {
  color: #00ff00;
  font-weight: bold;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .intro-sections {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .game-intro {
    padding: 1rem;
  }

  .command-item {
    flex-direction: column;
    gap: 0.4rem;
  }

  code {
    min-width: auto;
  }
}
</style>
