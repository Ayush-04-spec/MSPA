import { createContext, useContext, useState, useEffect } from 'react'
import { auth, setAccessToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // { id, name, role, email }
  const [loading, setLoading] = useState(true)

  // try to restore session on mount
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000) // give up after 3s if backend is down
    auth.refresh()
      .then(ok => ok ? auth.me() : null)
      .then(u => { if (u) setUser(u) })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false) })

    const onLogout = () => { setUser(null); setAccessToken(null) }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = async (email, password) => {
    const data = await auth.login(email, password)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  const register = async (email, password, name) => {
    const data = await auth.register(email, password, name)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await auth.logout().catch(() => {})
    setAccessToken(null)
    setUser(null)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isMla   = user?.role === 'MLA'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isMla }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
