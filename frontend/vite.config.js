import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true, silenceDeprecations: ['import'] }
    }
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000'
    }
  },
  test: {
    environment: 'jsdom'
  }
})
