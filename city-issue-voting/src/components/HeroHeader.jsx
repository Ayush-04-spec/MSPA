import { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const NAV_ITEMS = [
  { name: 'Issues',      path: '/'            },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'Analytics',   path: '/analytics'   },
]

export default function HeroHeader({ onSignIn, onReport }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header style={{ position: 'relative', zIndex: 10 }}>
      {/* ── Top nav bar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '0 8px' }}>
        <div style={{
          maxWidth: scrolled ? 800 : 1100,
          margin: '10px auto 0',
          padding: scrolled ? '10px 20px' : '12px 32px',
          background: scrolled ? 'rgba(18,18,18,0.85)' : 'rgba(18,18,18,0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(90,100,115,0.4)',
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, transition: 'all 0.3s ease',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px rgba(74,120,224,0.7))' }}>🗳️</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#F4F6FA,#4A78E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CityVoice
            </span>
          </div>

          {/* Desktop nav links */}
          <ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}
            className="desktop-nav">
            {NAV_ITEMS.map(item => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit',
                    color: location.pathname === item.path ? '#F4F6FA' : '#5A6473',
                    transition: 'color 0.15s',
                  }}
                >{item.name}</button>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAdmin && (
              <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                👑 Admin
              </span>
            )}
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(90,100,115,0.35)', borderRadius: 20, padding: '5px 12px', fontSize: '0.8rem', color: '#F4F6FA' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4A78E0,#2a55c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  {user.name}
                  <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6473', fontSize: '0.78rem', fontFamily: 'inherit' }}>↩</button>
                </div>
                <button onClick={onReport} style={{ background: 'linear-gradient(135deg,#4A78E0,#2a55c8)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(74,120,224,0.4)', fontFamily: 'inherit' }}>
                  + Report
                </button>
              </>
            ) : (
              <>
                <button onClick={onSignIn} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(90,100,115,0.35)', borderRadius: 10, padding: '7px 14px', color: '#5A6473', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Login
                </button>
                <button onClick={onReport} style={{ background: 'linear-gradient(135deg,#4A78E0,#2a55c8)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(74,120,224,0.4)', fontFamily: 'inherit' }}>
                  Report Issue
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6473', display: 'none' }}
              className="mobile-menu-btn">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ maxWidth: 400, margin: '8px auto 0', background: 'rgba(18,18,18,0.95)', border: '1px solid rgba(90,100,115,0.4)', borderRadius: 16, padding: '16px 20px', backdropFilter: 'blur(20px)' }}>
            {NAV_ITEMS.map(item => (
              <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', color: '#F4F6FA', fontSize: '0.95rem', fontFamily: 'inherit', borderBottom: '1px solid rgba(90,100,115,0.2)' }}>
                {item.name}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero section ── */}
      <div style={{ paddingTop: 120, paddingBottom: 32, textAlign: 'center', position: 'relative' }}>
        {/* Announcement pill */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(18,18,18,0.7)', border: '1px solid rgba(90,100,115,0.4)', borderRadius: 99, padding: '6px 16px 6px 16px', marginBottom: 28, backdropFilter: 'blur(12px)', cursor: 'pointer' }}>
          <span style={{ fontSize: '0.82rem', color: '#F4F6FA' }}>Real-time civic issue tracking for your city</span>
          <span style={{ width: 1, height: 14, background: 'rgba(90,100,115,0.5)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4A78E0', fontSize: '0.78rem', fontWeight: 600 }}>
            <ArrowRight size={12} /> Live
          </div>
        </motion.div>

        {/* Hero title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 25, delay: 0.15 }}
          style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20, background: 'linear-gradient(135deg, #F4F6FA 0%, rgba(244,246,250,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Report. Vote. Resolve.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ fontSize: '1.1rem', color: '#5A6473', maxWidth: 520, margin: '0 auto 0', lineHeight: 1.6 }}
        >
          A civic command center where citizens report problems, vote on urgency, and hold elected representatives accountable.
        </motion.p>
      </div>
    </header>
  )
}
