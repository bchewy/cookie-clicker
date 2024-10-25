const isProd = import.meta.env.PROD;
const VERCEL_URL = import.meta.env.VITE_VERCEL_URL || 'your-vercel-domain.vercel.app';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const API_URL = isProd 
  ? `https://${VERCEL_URL}/api`
  : 'http://localhost:3000';

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

// Remove WebSocket URL since we can't use it on Vercel
