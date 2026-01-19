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
        target: 'http://localhost:8070',
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'ws://localhost:8070',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    // Some environments (or dev setups) can block unlinking existing files in dist.
    // Disabling emptyOutDir prevents build failures while keeping output deterministic by hashed filenames.
    emptyOutDir: false,
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
        'online-plaza': 'src/pages/online-plaza.html',
        // 聊天系统
        chat: 'src/pages/chat.html',
        // 课程系统
        'free-course': 'src/pages/free-course.html'
      }
    },
    copyPublicDir: true
  },
  publicDir: 'public',
  assetsInclude: ['**/*.js'],
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    include: ['zustand', 'date-fns', '@floating-ui/dom']
  }
})
