// ✅ vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,      
    open: true       
  },
  // 👇 BẠN THÊM ĐOẠN NÀY VÀO NHÉ
  build: {
    chunkSizeWarningLimit: 1600, // Tăng giới hạn lên 1600kB (1.6MB) để tắt cảnh báo
  },
  // 👆 KẾT THÚC ĐOẠN THÊM
  optimizeDeps: {
    include: ['react-is'],
  },
})