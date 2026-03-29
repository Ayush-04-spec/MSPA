import { useState, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import GlobeHero from './components/GlobeHero'
import LoginModal from './components/LoginModal'
import Frontline from './pages/Frontline'
import HallOfImpact from './pages/HallOfImpact'
import ThePulse from './pages/ThePulse'
import { useAuth } from './AuthContext'
import { useIssues } from './IssuesContext'
import { useNavigate } from 'react-router-dom'
import './App.css'
import './features.css'

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { issues, total } = useIssues()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const contentRef = useRef(null)

  const scrollToContent = () => {
    setTimeout(() => {
      if (contentRef.current) {
        const y = contentRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50)
  }

  const openCount     = issues.filter(i => !i.resolved).length
  const resolvedCount = issues.filter(i =>  i.resolved).length

  const handleReport = () => {
    if (!user) { setShowLogin(true); return }
    navigate('/')
    setTimeout(() => window.dispatchEvent(new Event('open-report-form')), 50)
  }

  if (authLoading) return (
    <div style={{ background: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6473', fontSize: '0.9rem' }}>
      ●
    </div>
  )

  return (
    <>
      {/* ── Globe hero (full viewport, contains nav + title + tabs) ── */}
      <GlobeHero onSignIn={() => setShowLogin(true)} onReport={handleReport} onTabChange={scrollToContent} />

      {/* ── Content below the hero ── */}
      <div ref={contentRef} className="app" style={{ position: 'relative', zIndex: 1, background: '#121212' }}>

        {/* Slim stats bar */}
        <div className="stats-bar">
          <div className="stat-item">◈ Total: <span className="stat-val">{total || issues.length}</span></div>
          <span className="stat-sep">|</span>
          <div className="stat-item">◉ Open: <span className="stat-val open">{openCount}</span></div>
          <span className="stat-sep">|</span>
          <div className="stat-item">✓ Resolved: <span className="stat-val resolved">{resolvedCount}</span></div>
          <span className="stat-sep">|</span>
          <div className="stat-item">▲ Votes: <span className="stat-val">{issues.reduce((s, i) => s + (i.votes || 0), 0)}</span></div>
        </div>

        {/* Modals */}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

        {/* Routed pages */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"            element={<Frontline />} />
            <Route path="/leaderboard" element={<HallOfImpact />} />
            <Route path="/analytics"   element={<ThePulse />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button className="fab" onClick={handleReport} aria-label="Report Issue" title="Report Issue">+</button>
    </>
  )
}
