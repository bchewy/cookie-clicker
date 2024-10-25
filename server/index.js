const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const db = process.env.NODE_ENV === 'production' 
  ? require('./db-supabase')
  : require('./db');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const sanitize = require('express-mongo-sanitize');

const app = express();

// Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] // Replace with your Vercel domain
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Make sure express.json() is added before any routes
app.use(express.json());

// Add this logging middleware after cors and express.json()
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// Add security middleware
app.use(helmet()); // Security headers
app.use(xss()); // Prevent XSS attacks
app.use(sanitize()); // Prevent SQL injection

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many login attempts, please try again later'
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

// Apply rate limiting
app.use('/login-or-register', loginLimiter);
app.use(generalLimiter);

// Add input validation middleware
const validateInput = (req, res, next) => {
  const { username, password } = req.body;
  
  // Check for invalid characters
  const invalidChars = /[<>{}()\/\\]/;
  if (invalidChars.test(username) || invalidChars.test(password)) {
    return res.status(400).json({ error: 'Invalid characters in username or password' });
  }
  
  next();
};

// Add these endpoints before the WebSocket setup
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (!password || password.length < 4 || password.length > 20) {
      return res.status(400).json({ error: 'Password must be between 4 and 20 characters' });
    }

    const exists = await db.checkUsername(username);
    if (exists) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const player = await db.registerPlayer(username, password);
    res.json({ success: true, player });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error creating account' });
  }
});

// Update the login-or-register endpoint with better error handling
app.post('/login-or-register', validateInput, async (req, res) => {
  console.log('Login/Register attempt:', req.body); // Add logging
  
  try {
    const { username, password } = req.body;
    
    if (!username || username.length < 3) {
      console.log('Invalid username length');
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (!password || password.length < 4 || password.length > 20) {
      console.log('Invalid password length');
      return res.status(400).json({ error: 'Password must be between 4 and 20 characters' });
    }

    // Try to get existing player
    let player = await db.getPlayer(username, password);
    console.log('Existing player:', player); // Add logging
    
    if (player) {
      // Existing player - login successful
      console.log('Login successful');
      res.json({ 
        success: true, 
        player: {
          username: player.username,
          cookies: player.cookies,
          cookiesPerSecond: player.cookiesPerSecond
        },
        message: 'Welcome back!' 
      });
    } else {
      // Check if username exists with different password
      const exists = await db.checkUsername(username);
      console.log('Username exists:', exists); // Add logging
      
      if (exists) {
        console.log('Username taken');
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // New player - create account
      console.log('Creating new player');
      player = await db.registerPlayer(username, password);
      res.json({ 
        success: true, 
        player: {
          username: player.username,
          cookies: player.cookies,
          cookiesPerSecond: player.cookiesPerSecond
        },
        message: 'Account created! Welcome!' 
      });
    }
  } catch (err) {
    console.error('Login/Register detailed error:', err.message, err.stack);
    res.status(500).json({ error: 'Error processing request: ' + err.message });
  }
});

app.post('/check-username', async (req, res) => {
  console.log('Checking username:', req.body);
  try {
    const { username } = req.body;
    if (!username || username.length < 3) {
      console.log('Invalid username:', username);
      return res.status(400).json({ 
        available: false, 
        error: 'Username must be at least 3 characters' 
      });
    }
    
    const exists = await db.checkUsername(username);
    console.log('Username exists:', exists);
    res.json({ available: !exists });
  } catch (err) {
    console.error('Username check error:', err);
    res.status(500).json({ 
      available: false, 
      error: 'Error checking username' 
    });
  }
});

// Add this endpoint to test database connection
app.get('/test-db', async (req, res) => {
  try {
    await db.getLeaderboard();
    res.json({ status: 'Database is working' });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Update WebSocket server setup for Vercel
const server = process.env.NODE_ENV === 'production'
  ? app // In production, let Vercel handle the server
  : http.createServer(app);

// Only create WebSocket server in development
let wss;
if (process.env.NODE_ENV !== 'production') {
  wss = new WebSocket.Server({ server });
  // ... existing WebSocket code ...
}

// Store active connections
const clients = new Map();

// Track active sessions
const activeSessions = new Map();

// Add WebSocket connection limits
const wsConnections = new Map(); // IP -> connection count
const WS_MAX_CONNECTIONS_PER_IP = 3;

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const currentConnections = wsConnections.get(ip) || 0;
  
  if (currentConnections >= WS_MAX_CONNECTIONS_PER_IP) {
    ws.close();
    return;
  }
  
  wsConnections.set(ip, currentConnections + 1);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'register':
          try {
            username = data.username;
            const player = await db.getPlayer(username, data.password);
            if (player) {
              activeSessions.set(username, ws);
              
              ws.send(JSON.stringify({
                type: 'init',
                player: {
                  username: player.username,
                  cookies: player.cookies,
                  cookiesPerSecond: player.cookiesPerSecond
                }
              }));
              
              broadcastLeaderboard();
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Invalid credentials'
              }));
              ws.close();  // Close the connection if authentication fails
            }
          } catch (err) {
            console.error('Player registration error:', err);
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Failed to register player'
            }));
            ws.close();
          }
          break;

        case 'update':
          try {
            if (username === data.username) {
              // Verify credentials before update
              const player = await db.getPlayer(data.username, data.password);
              if (player) {
                await db.updatePlayer(data.username, data.cookies, data.cookiesPerSecond);
                throttledBroadcastLeaderboard();
              }
            }
          } catch (err) {
            console.error('Update error:', err);
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Failed to update player data'
            }));
          }
          break;
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    if (username) {
      activeSessions.delete(username);
      broadcastLeaderboard();
    }
    
    const count = wsConnections.get(ip);
    if (count > 1) {
      wsConnections.set(ip, count - 1);
    } else {
      wsConnections.delete(ip);
    }
  });
});

// Add throttling to leaderboard broadcasts
let broadcastTimeout = null;
function throttledBroadcastLeaderboard() {
  if (!broadcastTimeout) {
    broadcastTimeout = setTimeout(() => {
      broadcastLeaderboard();
      broadcastTimeout = null;
    }, 5000); // Update every 5 seconds
  }
}

// Modified broadcast function
async function broadcastLeaderboard() {
  try {
    const leaderboard = await db.getLeaderboard();
    const message = JSON.stringify({
      type: 'leaderboard',
      data: leaderboard,
      activePlayers: Array.from(activeSessions.keys())
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (err) {
    console.error('Error broadcasting leaderboard:', err);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'error',
          error: 'Failed to update leaderboard'
        }));
      }
    });
  }
}

// REST endpoints
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboard();
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the port configuration
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express API
module.exports = app;
