import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase, isBackendConfigured } from './lib/supabase' // sesuaikan path

console.log('Backend terkonfigurasi:', isBackendConfigured)

if (supabase) {
  supabase.from('specialties').select('*').then(({ data, error }) => {
    console.log('specialties:', data, error)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
