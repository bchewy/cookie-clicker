export const API_URL = import.meta.env.PROD 
  ? 'https://your-domain.vercel.app/api' // Replace with your Vercel domain
  : 'http://localhost:3000';

export const WS_URL = import.meta.env.PROD
  ? 'wss://your-domain.vercel.app' // Replace with your Vercel domain
  : 'ws://localhost:3000';
