const isProd = import.meta.env.PROD;
const VERCEL_URL = process.env.VERCEL_URL || 'your-vercel-domain.vercel.app';

export const API_URL = isProd 
  ? `https://${VERCEL_URL}/api`
  : 'http://localhost:3000';

// Remove WebSocket URL since we can't use it on Vercel
