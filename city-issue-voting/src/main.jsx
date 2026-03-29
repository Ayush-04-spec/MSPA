import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { IssuesProvider } from './IssuesContext.jsx'
import { registerSW } from './registerSW.js'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ color: '#ef4444', padding: 40, fontFamily: 'monospace', background: '#121212', minHeight: '100vh' }}>
        <h2>Runtime Error</h2>
        <pre style={{ marginTop: 16, fontSize: 13, whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
        <pre style={{ marginTop: 8, fontSize: 11, color: '#5A6473', whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
      </div>
    )
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <IssuesProvider>
            <App />
          </IssuesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

registerSW()
