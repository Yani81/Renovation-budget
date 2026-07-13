import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ВАЖНО (както при MyCar):
//  - за GitHub Pages:  base: '/Renovation-budget/'  (името на репото)
//  - за Capacitor/iOS: base: './'
export default defineConfig({
  plugins: [react()],
  base: '/Renovation-budget/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
