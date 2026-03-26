import { useRef, useState, useEffect, forwardRef } from 'react'
import { gsap } from 'gsap'
import SparkLine from './SparkLine'
import CivicCredits from './CivicCredits'
import { useAuth } from '../AuthContext'

// Generate fake velocity sparkline data per MLA
function velocityData(seed) {
  return Array.from({ length: 10 }, (_, i) => Math.max(0, Math.round(seed * Math.sin(i * 0.8 + seed) + seed + 2)))
}

export default function Leaderboard({ issues, mlaList }) {
  const { user } = useAuth()

  const stats = (Array.isArray(mlaList) && mlaList.length > 0 ? mlaList : []).map((mla, idx) => {
    const resolved   = issues.filter(i => (i.resolved || i.status === 'resolved') && i.resolvedBy === mla.id)
    const totalVotes = resolved.reduce((s, i) => s + (i.votes || 0), 0)
    return { ...mla, resolved: resolved.length, totalVotes, issues: resolved, sparkData: velocityData(idx + 2) }
  }).sort((a, b) => b.resolved - a.resolved || b.totalVotes - a.totalVotes)

  const medals      = ['🥇', '🥈', '🥉']
  const maxResolved = stats[0]?.resolved || 1
  const cardsRef    = useRef([])

  useEffect(() => {
    const els = cardsRef.current.filter(Boolean)
    if (els.length === 0) return
    gsap.fromTo(els,
      { opacity: 0, y: 44, scale: 0.94 },
      { opacity: 1, y: 0,  scale: 1, duration: 0.55, stagger: 0.1, ease: 'back.out(1.5)' }
    )
  }, [stats.length])

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <h2>🏆 Hall of Impact</h2>
        <p className="lb-sub">Ranked by issues resolved · Resolution velocity sparkline shown per MLA</p>
      </div>

      {user && (
        <div style={{ marginBottom: 24 }}>
          <CivicCredits user={user} issues={issues} />
        </div>
      )}

      <div className="lb-cards">
        {stats.map((mla, idx) => (
          <LbCard
            key={mla.id ?? idx}
            mla={mla} idx={idx}
            medal={medals[idx]}
            maxResolved={maxResolved}
            ref={el => cardsRef.current[idx] = el}
          />
        ))}
        {stats.length === 0 && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <span>🏛️</span><p>No leaderboard data yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const LbCard = forwardRef(function LbCard({ mla, idx, medal, maxResolved }, ref) {
  return (
    <div ref={ref} className={`lb-card ${idx === 0 ? 'top' : ''}`}>
      <div className="lb-card-inner">
        <div className="lb-rank">
          {idx < 3 ? medal : <span className="rank-num">#{idx + 1}</span>}
        </div>
        <div className="lb-avatar-wrap">
          <div className="lb-avatar">{mla.avatar ?? '👤'}</div>
          {idx === 0 && <div className="lb-avatar-glow" />}
        </div>
        <div className="lb-info">
          <p className="lb-name">{mla.name}</p>
          <p className="lb-constituency">📍 {mla.constituency ?? mla.ward ?? '—'}</p>
        </div>
        <div className="lb-stats">
          <div className="lb-stat-item">
            <span className="lb-big">{mla.resolved ?? mla.resolvedCount ?? 0}</span>
            <span className="lb-label">Resolved</span>
          </div>
          <div className="lb-stat-item">
            <span className="lb-big votes">{mla.totalVotes ?? mla.impactPoints ?? 0}</span>
            <span className="lb-label">Impact</span>
          </div>
        </div>
      </div>

      {/* Resolution Velocity Sparkline */}
      <div className="lb-sparkline-row">
        <span className="lb-spark-label">Resolution velocity</span>
        <SparkLine data={mla.sparkData} color={idx === 0 ? '#4A78E0' : '#5A6473'} />
      </div>

      <div className="lb-bar-wrap">
        <div className="lb-bar"
          style={{ width: `${(mla.resolved ?? 0) === 0 ? 4 : ((mla.resolved ?? 0) / maxResolved) * 100}%` }} />
      </div>

      {mla.issues?.length > 0 && (
        <ul className="lb-issue-list">
          {mla.issues.map(i => <li key={i.id}>✅ {i.title}</li>)}
        </ul>
      )}
      {(mla.resolved ?? 0) === 0 && <p className="lb-none">No issues resolved yet</p>}
    </div>
  )
})
