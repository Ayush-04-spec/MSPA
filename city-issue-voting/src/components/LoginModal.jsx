import { useState } from 'react'
import { useAuth } from '../AuthContext'

export default function LoginModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return }
        await register(email, password, name)
      }
      onClose()
    } catch (err) {
      const msg = err?.error?.message || err?.message || 'Something went wrong'
      const details = err?.error?.details
      setError(details ? Object.entries(details).map(([k,v]) => `${k}: ${v}`).join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">{mode === 'login' ? '🔐' : '📝'}</div>
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

        <form onSubmit={submit} className="issue-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>Name</label>
              <input className="input" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)} autoFocus />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoFocus={mode === 'login'} />
          </div>
          <div className="form-group">
            <label>Password <span style={{color:'var(--muted)', fontWeight:400, textTransform:'none'}}>(min 8 chars)</span></label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <p className="error-msg">⚠ {error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '…' : mode === 'login' ? 'Sign In' : 'Register'}
            </button>
          </div>
        </form>

        <p style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--muted2)', textAlign: 'center' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
