import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd())
    console.log('ENV:', env)
  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_SERVER_URI,
          changeOrigin: true,
          secure: false
        }
      }
    }
  })
}