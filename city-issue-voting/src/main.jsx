import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { IssuesProvider } from './IssuesContext.jsx'
import { registerSW } from './registerSW.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <IssuesProvider>
          <App />
        </IssuesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

registerSW()
