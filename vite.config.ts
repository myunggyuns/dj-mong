import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages 배포 시 아래 base를 실제 repo 이름으로 바꿔주세요.
// 예: repo가 github.com/USERNAME/nan2026-arcade 라면 base: '/nan2026-arcade/'
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser'
          }
        },
      },
    },
  },
})
