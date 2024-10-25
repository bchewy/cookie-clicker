const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'game.db'));

// Add this after creating the database connection
db.on('error', (err) => {
    console.error('SQLite error:', err);
});

// Initialize database tables with error handling - only create if not exists
db.serialize(() => {
    try {
        // Create the table only if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                cookies REAL DEFAULT 0,
                cookiesPerSecond REAL DEFAULT 0,
                lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('Database initialized successfully');
            }
        });
    } catch (err) {
        console.error('Error during database initialization:', err);
    }
});

const dbWrapper = {
    // Get or create player
    getPlayer: (username, password) => {
        return new Promise((resolve, reject) => {
            if (!username || !password) {
                reject(new Error('Username and password are required'));
                return;
            }

            db.get(
                'SELECT * FROM players WHERE username = ? AND password = ?',
                [username, password],
                (err, row) => {
                    if (err) {
                        console.error('Database error in getPlayer:', err);
                        reject(err);
                        return;
                    }
                    resolve(row);
                }
            );
        });
    },

    // Add new method for registration
    registerPlayer: (username, password) => {
        return new Promise((resolve, reject) => {
            if (!username || !password) {
                reject(new Error('Username and password are required'));
                return;
            }

            db.run(
                'INSERT INTO players (username, password) VALUES (?, ?)',
                [username, password],
                function (err) {
                    if (err) {
                        console.error('Database error in registerPlayer:', err);
                        reject(err);
                        return;
                    }
                    resolve({
                        id: this.lastID,
                        username,
                        cookies: 2000,
                        cookiesPerSecond: 0
                    });
                }
            );
        });
    },

    // Update player stats
    updatePlayer: (username, cookies, cookiesPerSecond) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE players SET cookies = ?, cookiesPerSecond = ?, lastUpdated = CURRENT_TIMESTAMP WHERE username = ?',
                [cookies, cookiesPerSecond, username],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    },

    // Get leaderboard
    getLeaderboard: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT username, cookies, cookiesPerSecond FROM players ORDER BY cookies DESC LIMIT 10',
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
        });
    },

    // Add to the dbWrapper object
    checkUsername: (username) => {
        return new Promise((resolve, reject) => {
            if (!username) {
                reject(new Error('Username is required'));
                return;
            }

            db.get(
                'SELECT id FROM players WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        console.error('Database error in checkUsername:', err);
                        reject(err);
                        return;
                    }
                    resolve(!!row);
                }
            );
        });
    }
};

module.exports = dbWrapper;
