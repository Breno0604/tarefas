import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { reportWebVitals } from './lib/vitals'
import './index.css'

reportWebVitals()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
