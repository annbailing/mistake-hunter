import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // 后端启动中，静默忽略连接拒绝
            if ((err as any).code === 'ECONNREFUSED') return
            console.error('[proxy error]', err.message)
          })
        },
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if ((err as any).code === 'ECONNREFUSED') return
            console.error('[proxy error]', err.message)
          })
        },
      },
    },
  },
})
