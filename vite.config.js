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
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        courses: 'src/pages/courses.html',
        dashboard: 'src/pages/dashboard.html',
        payment: 'src/pages/payment.html',
        study: 'src/pages/study.html',
        qa: 'src/pages/qa.html',
        profile: 'src/pages/profile.html'
      }
    }
  }
})