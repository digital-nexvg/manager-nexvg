import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProcessingOverlay } from './components/common/ProcessingOverlay'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ProcessingOverlay />
  </StrictMode>,
)
