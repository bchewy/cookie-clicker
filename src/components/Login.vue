<template>
  <div class="login-overlay" v-if="!username">
    <div class="login-box">
      <h2>🍪 Bash Cookie Clicker</h2>
      <div class="login-form">
        <input type="text" v-model="inputUsername" placeholder="Username (min. 3 characters)"
          @keyup.enter="focusPassword" ref="usernameInput" :disabled="checking">

        <input type="password" v-model="inputPassword" placeholder="Password (dont put a real one..)"
          @keyup.enter="handleSubmit" ref="passwordInput" maxlength="20">

        <div class="status" v-if="checking">Checking...</div>
        <div class="error" v-if="error">{{ error }}</div>

        <button @click="handleSubmit" :disabled="checking || !inputUsername.trim() || !isValidPassword">
          Start Playing
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { SUPABASE_CONFIG } from '../config'
import { createClient } from '@supabase/supabase-js'

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
      checking: false,
      supabase: null
    }
  },
  created() {
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      auth: {
        persistSession: false
      }
    })
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
          .select('*')  // Select all fields for debugging
          .eq('username', this.inputUsername.trim())
          .single()

        console.log('Fetch result:', { existingPlayer, fetchError })

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch error:', fetchError)
          throw fetchError
        }

        let player
        if (existingPlayer) {
          // Login
          if (existingPlayer.password !== this.inputPassword) {
            throw new Error('Invalid password')
          }

          console.log('Attempting to update player:', existingPlayer)

          // First set the user context via RPC
          await this.supabase.rpc('set_user_context', {
            p_username: this.inputUsername.trim(),
            p_user_id: existingPlayer.user_id
          })

          // Only update last_activity if it's been more than 5 minutes since last activity
          const lastActivity = new Date(existingPlayer.last_activity)
          const now = new Date()
          const timeDiff = (now - lastActivity) / 1000 / 60 // difference in minutes

          const updates = {
            last_updated: now.toISOString()
          }

          // Only update last_activity if more than 5 minutes have passed
          if (timeDiff > 5) {
            updates.last_activity = now.toISOString()
          }

          const { data: updatedPlayer, error: updateError } = await this.supabase
            .from('players')
            .update(updates)
            .eq('id', existingPlayer.id)
            .select()
            .single()

          if (updateError) {
            console.error('Update error:', updateError)
            throw updateError
          }
          player = updatedPlayer
        } else {
          console.log('Creating new player')
          // For new players, set both timestamps
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
              upgrades: null  // Add this to match schema
            }])
            .select()
            .single()

          console.log('Insert result:', { newPlayer, insertError })

          if (insertError) {
            console.error('Insert error:', insertError)
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

        console.log('Final player data:', player)

        // Store credentials
        localStorage.setItem('gameCredentials', JSON.stringify({
          username: this.inputUsername.trim(),
          password: this.inputPassword
        }))

        // Emit login event
        this.$emit('login', {
          username: player.username,
          password: this.inputPassword,
          cookies: player.cookies || 0,
          cookiesPerSecond: player.cookies_per_second || 0
        })

      } catch (err) {
        console.error('Login error:', err)
        this.error = err.message || 'Error processing request'
      } finally {
        this.checking = false
      }
    }
  },
  async mounted() {
    this.$refs.usernameInput.focus()

    // Check for stored credentials
    const stored = localStorage.getItem('gameCredentials')
    if (stored) {
      try {
        const { username, password } = JSON.parse(stored)
        this.inputUsername = username
        this.inputPassword = password
        await this.handleSubmit()
      } catch (err) {
        console.error('Error loading stored credentials:', err)
        localStorage.removeItem('gameCredentials')
      }
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
  /* Add backdrop blur */
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.8);
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
