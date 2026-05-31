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
    // Docker 环境下通过 VITE_API_TARGET=http://server:3001 自动切换
    // 本地开发不需要设，默认 localhost
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
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
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
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
