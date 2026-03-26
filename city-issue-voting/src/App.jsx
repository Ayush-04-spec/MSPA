import { useState, Suspense, lazy } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import GooeyTabs    from './components/GooeyTabs'
import LoginModal   from './components/LoginModal'
import ResolutionTicker from './components/ResolutionTicker'
import Frontline    from './pages/Frontline'
import HallOfImpact from './pages/HallOfImpact'
import ThePulse     from './pages/ThePulse'
import { useAuth }  from './AuthContext'
import { useIssues } from './IssuesContext'
import './App.css'
import './features.css'

// Globe rendered as fixed background — lazy to not block paint
const CityGlobe = lazy(() => import('./components/CityGlobe'))

const TABS = [
  { key: '/',            label: '⚡ Frontline'   },
  { key: '/leaderboard', label: '🏆 Impact'      },
  { key: '/analytics',   label: '📡 Pulse'       },
]

const STATUS_PROGRESS = { open: 25, under_review: 50, in_progress: 75, resolved: 100 }

export default function App() {
  const { user, loading: authLoading, logout, isAdmin } = useAuth()
  const { issues, total } = useIssues()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [showLogin, setShowLogin] = useState(false)

  const activeTab     = TABS.find(t => t.key === location.pathname)?.key ?? '/'
  const openCount     = issues.filter(i => !i.resolved).length
  const resolvedCount = issues.filter(i =>  i.resolved).length

  const handleFAB = () => {
    if (!user) { setShowLogin(true); return }
    navigate('/')
    setTimeout(() => window.dispatchEvent(new Event('open-report-form')), 50)
  }

  if (authLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#5A6473', fontSize:'0.9rem' }}>
      Loading…
    </div>
  )

  return (
    <>
      {/* ── Fixed atmospheric globe ── */}
      <div className="globe-bg-glow" />
      <Suspense fallback={null}>
        <div className="globe-bg">
          <CityGlobe pulse={false} />
        </div>
      </Suspense>

      <div className="app">
        {/* ── Resolution Ticker ── */}
        <ResolutionTicker liveEvents={[]} />

        {/* ── Header: logo + profile only ── */}
        <header className="header">
          <div className="header-left">
            <span className="logo">🗳️</span>
            <h1>CityVoice</h1>
          </div>
          <div className="header-right">
            {isAdmin && <span className="admin-badge">👑 Admin</span>}
            {user ? (
              <div className="user-chip">
                <div className="user-chip-avatar">{user.name?.[0]?.toUpperCase() ?? 'U'}</div>
                {user.name}
                <button className="btn-ghost" onClick={logout}>↩</button>
              </div>
            ) : (
              <button className="btn btn-outline" style={{ fontSize:'0.8rem', padding:'7px 14px' }}
                onClick={() => setShowLogin(true)}>Sign In</button>
            )}
          </div>
        </header>

        {/* ── Gooey Nav ── */}
        <div className="nav-wrap">
          <GooeyTabs tabs={TABS} activeTab={activeTab} onChange={(key) => navigate(key)} />
        </div>

        {/* ── Slim stats bar ── */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">◈</span>
            Total: <span className="stat-val">{total || issues.length}</span>
          </div>
          <span className="stat-sep">|</span>
          <div className="stat-item">
            <span className="stat-icon">◉</span>
            Open: <span className="stat-val open">{openCount}</span>
          </div>
          <span className="stat-sep">|</span>
          <div className="stat-item">
            <span className="stat-icon">✓</span>
            Resolved: <span className="stat-val resolved">{resolvedCount}</span>
          </div>
          <span className="stat-sep">|</span>
          <div className="stat-item">
            <span className="stat-icon">▲</span>
            Votes: <span className="stat-val">{issues.reduce((s,i)=>s+(i.votes||0),0)}</span>
          </div>
        </div>

        {/* ── Modals ── */}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

        {/* ── Routed pages ── */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"            element={<Frontline />} />
            <Route path="/leaderboard" element={<HallOfImpact />} />
            <Route path="/analytics"   element={<ThePulse />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* ── FAB ── */}
      <button className="fab" onClick={handleFAB} aria-label="Report Issue" title="Report Issue">
        +
      </button>
    </>
  )
}
