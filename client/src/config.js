const isProd = import.meta.env.PROD;
const VERCEL_URL = process.env.VERCEL_URL || 'your-vercel-domain.vercel.app';

export const API_URL = isProd 
  ? `https://${VERCEL_URL}/api`
  : 'http://localhost:3000/api';

export const WS_URL = isProd
  ? `wss://${VERCEL_URL}/api`
  : 'ws://localhost:3000';
