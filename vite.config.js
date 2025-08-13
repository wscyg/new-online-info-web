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
        'course-detail': 'src/pages/course-detail.html'
      }
    },
    copyPublicDir: true
  },
  publicDir: false,
  assetsInclude: ['**/*.js']
})