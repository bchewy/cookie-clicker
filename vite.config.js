import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000
  },
  // Add base config for production
  base: '/',
  // Ensure proper module handling
  optimizeDeps: {
    include: ['vue']
  }
})
