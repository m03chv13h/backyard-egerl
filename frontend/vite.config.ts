import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = 'http://localhost:8787';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      '/token': apiProxyTarget,
      '/users': apiProxyTarget,
      '/events': apiProxyTarget,
      '/event': apiProxyTarget,
      '/runner': apiProxyTarget,
      '/tag-info': apiProxyTarget,
      '/scanner': apiProxyTarget,
    },
  },
})
