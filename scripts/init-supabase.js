const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  try {
    // Test connection by trying to select from players table
    const { data, error } = await supabase
      .from('players')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('Database connection successful');
  } catch (err) {
    console.error('Database check failed:', err);
    console.log('Please run the SQL setup script in Supabase SQL Editor');
  }
}

checkDatabase();
