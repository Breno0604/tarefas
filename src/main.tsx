import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { reportWebVitals } from './lib/vitals'
import './index.css'

reportWebVitals()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
