const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../server/config');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initializeDatabase() {
  try {
    // Create the players table directly using Supabase's PostgreSQL
    const { data, error } = await supabase.rpc('create_players_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS players (
          id BIGSERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          cookies FLOAT DEFAULT 0,
          cookies_per_second FLOAT DEFAULT 0,
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          last_activity TIMESTAMPTZ DEFAULT NOW(),  -- New column for offline earnings
          upgrades JSONB DEFAULT NULL
        );
      `
    });

    if (error) throw error;
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initializeDatabase();
