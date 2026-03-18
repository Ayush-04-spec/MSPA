import { useState, useRef } from 'react'
import { MLA_LIST } from '../App'

const CATEGORY_COLORS = {
  Roads:      { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c', glow: '251,146,60' },
  Sanitation: { bg: 'rgba(163,230,53,0.15)',  color: '#a3e635', glow: '163,230,53' },
  Lighting:   { bg: 'rgba(250,204,21,0.15)',  color: '#facc15', glow: '250,204,21' },
  Safety:     { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', glow: '239,68,68'  },
  Drainage:   { bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8', glow: '56,189,248' },
  Parks:      { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', glow: '34,197,94'  },
  Water:      { bg: 'rgba(99,102,241,0.15)',  color: '#6366f1', glow: '99,102,241' },
  Other:      { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', glow: '148,163,184'},
}

export default function IssueCard({ issue, onVote, onResolve, isAdmin }) {
  const [showMlaSelect, setShowMlaSelect] = useState(false)
  const [selectedMla,   setSelectedMla]   = useState('')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef(null)

  const timeAgo = (ts) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const cat = CATEGORY_COLORS[issue.category] || CATEGORY_COLORS.Other
  const mla = MLA_LIST.find(m => m.id === issue.resolvedBy)

  const onMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width  / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -6, y: dx * 6 })
  }

  const onMouseLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false) }
  const onMouseEnter = () => setHovered(true)

  const handleResolve = () => {
    if (issue.resolved) { onResolve(issue.id, null); return }
    setShowMlaSelect(true)
  }

  const confirmResolve = () => {
    onResolve(issue.id, selectedMla ? parseInt(selectedMla) : null)
    setShowMlaSelect(false); setSelectedMla('')
  }

  const cardStyle = {
    transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${hovered ? 8 : 0}px)`,
    boxShadow: hovered
      ? `0 24px 48px rgba(0,0,0,0.5), 0 0 32px rgba(${cat.glow},0.18), inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
  }

  // dynamic shine based on tilt
  const shineStyle = {
    background: `radial-gradient(circle at ${50 + tilt.y * 5}% ${50 + tilt.x * 5}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
    opacity: hovered ? 1 : 0,
  }

  return (
    <div
      ref={cardRef}
      className={`issue-card ${issue.resolved ? 'resolved' : ''}`}
      style={cardStyle}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      {/* shine overlay */}
      <div className="card-shine" style={shineStyle} />

      {/* left vote strip */}
      <div className="vote-strip">
        <button
          className={`vote-btn up ${issue.userVote === 'up' ? 'active' : ''}`}
          onClick={() => onVote(issue.id, 'up')}
          aria-label="Upvote"
        >▲</button>
        <span className={`vote-count ${issue.votes > 0 ? 'pos' : issue.votes < 0 ? 'neg' : ''}`}>
          {issue.votes}
        </span>
        <button
          className={`vote-btn down ${issue.userVote === 'down' ? 'active' : ''}`}
          onClick={() => onVote(issue.id, 'down')}
          aria-label="Downvote"
        >▼</button>
      </div>

      {/* card content */}
      <div className="card-content">
        {issue.image && <img src={issue.image} alt={issue.title} className="card-img" />}

        <div className="card-body">
          <div className="card-top">
            <span className="category-tag" style={{ background: cat.bg, color: cat.color, boxShadow: `0 0 10px rgba(${cat.glow},0.25)` }}>
              {issue.category}
            </span>
            {issue.resolved && <span className="badge-resolved">✅ Resolved</span>}
          </div>

          <h3 className="card-title">{issue.title}</h3>
          <p className="card-meta">📍 {issue.location} &nbsp;·&nbsp; 🕐 {timeAgo(issue.createdAt)}</p>

          {mla && (
            <p className="resolved-by">
              {mla.avatar} Resolved by <strong>{mla.name}</strong> · {mla.constituency}
            </p>
          )}

          {isAdmin && !showMlaSelect && (
            <button
              className={`btn-action ${issue.resolved ? 'btn-reopen' : 'btn-resolve'}`}
              onClick={handleResolve}
            >
              {issue.resolved ? '↩ Mark Open' : '✓ Mark Resolved'}
            </button>
          )}

          {isAdmin && showMlaSelect && (
            <div className="mla-select-row">
              <select className="input select-sm" value={selectedMla} onChange={e => setSelectedMla(e.target.value)}>
                <option value="">-- Assign MLA (optional) --</option>
                {MLA_LIST.map(m => (
                  <option key={m.id} value={m.id}>{m.avatar} {m.name} · {m.constituency}</option>
                ))}
              </select>
              <button className="btn-action btn-resolve" onClick={confirmResolve}>Confirm</button>
              <button className="btn-action btn-reopen" onClick={() => setShowMlaSelect(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
