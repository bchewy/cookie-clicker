const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function initializeDatabase() {
  try {
    // Create the players table
    const { error } = await supabase.rpc('init_players_table');
    
    if (error) throw error;
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initializeDatabase();
