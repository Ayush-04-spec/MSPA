import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import GooeyTabs from './GooeyTabs'
import GLSLHills from './GLSLHills'
import { ArrowRight } from 'lucide-react'

const TABS = [
  { key: '/',            label: 'Issues'      },
  { key: '/leaderboard', label: 'Leaderboard' },
  { key: '/analytics',   label: 'Analytics'   },
]

export default function GlobeHero({ onSignIn, onReport, onTabChange }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const activeTab = TABS.find(t => t.key === location.pathname)?.key ?? '/'

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#121212', overflow: 'hidden' }}>

      {/* ── GLSL Hills background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#121212', overflow: 'hidden' }}>
        <GLSLHills speed={0.5} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(18,18,18,0.3) 0%, rgba(18,18,18,0.15) 50%, rgba(18,18,18,0.7) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Fixed top nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 32px',
        background: 'rgba(18,18,18,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(90,100,115,0.25)',
        gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}>
          <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px rgba(74,120,224,0.7))' }}>🗳️</span>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', background: 'linear-gradient(135deg,#F4F6FA,#4A78E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CityVoice
          </span>
        </div>

        {/* Tab nav — center */}
        <GooeyTabs tabs={TABS} activeTab={activeTab} onChange={(key) => { navigate(key); onTabChange?.() }} />

        {/* Auth — right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isAdmin && (
            <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
              👑 Admin
            </span>
          )}
          {user ? (
            <>
              <span style={{ fontSize: '0.8rem', color: '#5A6473' }}>{user.name}</span>
              <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(90,100,115,0.35)', borderRadius: 8, padding: '5px 12px', color: '#5A6473', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Logout
              </button>
            </>
          ) : (
            <button onClick={onSignIn} style={{ background: 'none', border: '1px solid rgba(90,100,115,0.35)', borderRadius: 8, padding: '6px 14px', color: '#5A6473', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero content ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
        minHeight: '100vh', textAlign: 'center', padding: '15vh 24px 0',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          style={{ maxWidth: 640 }}
        >
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(74,120,224,0.1)', border: '1px solid rgba(74,120,224,0.25)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4A78E0', boxShadow: '0 0 8px #4A78E0', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.78rem', color: '#4A78E0', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Live Civic Reporting
            </span>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 900,
              lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 20,
              background: 'linear-gradient(135deg, #F4F6FA 0%, rgba(244,246,250,0.65) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            Report. Vote.<br />Resolve.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            style={{ fontSize: '1.05rem', color: '#5A6473', lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}
          >
            A civic command center where citizens report problems, vote on urgency, and hold representatives accountable.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
