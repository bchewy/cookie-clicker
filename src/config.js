const isProd = import.meta.env.PROD;
const VERCEL_URL = import.meta.env.VERCEL_URL || 'your-vercel-domain.vercel.app';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Updated to handle both Vercel deployment URL formats
export const API_URL = isProd 
  ? `https://${VERCEL_URL}/api`
  : 'http://localhost:3000';

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  // Add additional config for production if needed
  config: {
    autoRefreshToken: true,
    persistSession: true
  }
};

// Remove WebSocket URL since we can't use it on Vercel
