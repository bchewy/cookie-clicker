const isProd = import.meta.env.PROD;
const VERCEL_URL = import.meta.env.VITE_VERCEL_URL || 'your-vercel-domain.vercel.app';

export const API_URL = isProd 
  ? `https://${VERCEL_URL}/api`
  : 'http://localhost:3000';

export const SUPABASE_CONFIG = {
  url: 'https://wenmcqfcsuysgfgzbint.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlbm1jcWZjc3V5c2dmZ3piaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NTEwMTAsImV4cCI6MjA0NTQyNzAxMH0.F3H0yxi8MOFyDZlA9tuvEWUAFae5Ml5uJNgJco0IGOQ'
};

// Remove WebSocket URL since we can't use it on Vercel
