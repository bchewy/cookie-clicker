<template>
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
          placeholder="Password (4-20 characters)"
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
</template>

<script>
export default {
  name: 'Login',
  props: {
    username: String
  },
  data() {
    return {
      inputUsername: '',
      inputPassword: '',
      error: '',
      checking: false
    }
  },
  computed: {
    isValidPassword() {
      return this.inputPassword.length >= 4 && this.inputPassword.length <= 20;
    }
  },
  methods: {
    focusPassword() {
      this.$refs.passwordInput.focus()
    },

    async handleSubmit() {
      if (!this.inputUsername.trim() || !this.isValidPassword) {
        return
      }

      if (this.inputUsername.length < 3) {
        this.error = 'Username must be at least 3 characters'
        return
      }

      this.checking = true
      this.error = ''

      try {
        const response = await fetch('http://localhost:3000/login-or-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.inputUsername.trim(),
            password: this.inputPassword
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed')
        }

        // Store credentials in localStorage for auto-login
        localStorage.setItem('gameCredentials', JSON.stringify({
          username: this.inputUsername.trim(),
          password: this.inputPassword
        }))

        this.$emit('login', {
          username: this.inputUsername.trim(),
          password: this.inputPassword  // Add password to the emit
        })
      } catch (err) {
        console.error('Error:', err)
        this.error = err.message
      } finally {
        this.checking = false
      }
    }
  },
  mounted() {
    this.$refs.usernameInput.focus()
    
    // Check for stored credentials
    const stored = localStorage.getItem('gameCredentials')
    if (stored) {
      const { username, password } = JSON.parse(stored)
      this.inputUsername = username
      this.inputPassword = password
      this.handleSubmit()
    }
  }
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
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

h2 {
  color: #00ff00;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.error {
  color: #ff4444;
  font-size: 0.9rem;
}

.status {
  color: #888;
  font-size: 0.9rem;
}

button:disabled {
  background: #666;
  cursor: not-allowed;
}

input[type="password"] {
  background: #2a2a2a;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 0.5rem;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  border-radius: 4px;
}
</style>
