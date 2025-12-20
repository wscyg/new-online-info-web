import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://42.194.245.66:8070',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'home.html',
        courses: 'src/pages/courses.html',
        dashboard: 'src/pages/dashboard.html',
        payment: 'src/pages/payment.html',
        study: 'src/pages/study.html',
        profile: 'src/pages/profile.html',
        login: 'src/pages/login.html',
        register: 'src/pages/register.html',
        orders: 'src/pages/orders.html',
        'course-detail': 'src/pages/course-detail.html',
        leaderboard: 'src/pages/leaderboard.html',
        notes: 'src/pages/notes.html',
        'community-square': 'src/pages/community-square.html',
        qa: 'src/pages/qa.html',
        // PK系统
        'pk-arena': 'src/pages/pk-arena.html',
        'pk-battle': 'src/pages/pk-battle.html',
        'pk-leaderboard': 'src/pages/pk-leaderboard.html',
        'pk-replay': 'src/pages/pk-replay.html',
        // 积分系统
        'points-shop': 'src/pages/points-shop.html',
        lottery: 'src/pages/lottery.html',
        'my-courses': 'src/pages/my-courses.html',
        // 社区
        community: 'src/pages/community.html',
        learn: 'src/pages/learn.html',
        achievements: 'src/pages/achievements.html',
        // 练习场
        practice: 'src/pages/practice.html',
        // 在线广场
        'online-plaza': 'src/pages/online-plaza.html'
      }
    },
    copyPublicDir: true
  },
  publicDir: false,
  assetsInclude: ['**/*.js'],
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    include: ['zustand', 'date-fns', '@floating-ui/dom']
  }
})