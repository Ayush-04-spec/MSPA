import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':        'http://localhost:4000',
      '/issues':      'http://localhost:4000',
      '/comments':    'http://localhost:4000',
      '/votes':       'http://localhost:4000',
      '/uploads':     'http://localhost:4000',
      '/admin':       'http://localhost:4000',
      '/leaderboard': 'http://localhost:4000',
      '/export':      'http://localhost:4000',
    },
  },
})
