import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/f1-static': {
        target: 'https://livetiming.formula1.com/static',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/f1-static/, ''),
      },
    },
  },
})
