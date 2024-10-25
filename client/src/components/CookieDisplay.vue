<template>
  <div class="cookie-display">
    <div class="cookie-count">🍪 {{ Math.floor(cookies) }}</div>
    <div class="cps">per second: {{ cookiesPerSecond.toFixed(1) }}</div>
  </div>
</template>

<script>
export default {
  name: 'CookieDisplay',
  props: {
    cookies: {
      type: Number,
      required: true
    },
    cookiesPerSecond: {
      type: Number,
      required: true,
      default: 0
    }
  }
}
</script>

<style scoped>
.cookie-display {
  text-align: center;
  margin: 20px 0;
}

.cookie-count {
  font-size: 2.5em;
  color: #00ff00;
}

.cps {
  font-size: 1.2em;
  color: #00aa00;
  margin-top: 5px;
}
</style>
