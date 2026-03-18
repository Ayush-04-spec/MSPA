import { useRef, useState } from 'react'

export default function Leaderboard({ issues, mlaList }) {
  const stats = mlaList.map((mla) => {
    const resolved   = issues.filter(i => i.resolved && i.resolvedBy === mla.id)
    const totalVotes = resolved.reduce((s, i) => s + i.votes, 0)
    return { ...mla, resolved: resolved.length, totalVotes, issues: resolved }
  }).sort((a, b) => b.resolved - a.resolved || b.totalVotes - a.totalVotes)

  const medals    = ['🥇', '🥈', '🥉']
  const maxResolved = stats[0]?.resolved || 1

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <h2>🏆 MLA Performance Leaderboard</h2>
        <p className="lb-sub">Ranked by number of city issues resolved</p>
      </div>
      <div className="lb-cards">
        {stats.map((mla, idx) => (
          <LbCard key={mla.id} mla={mla} idx={idx} medal={medals[idx]} maxResolved={maxResolved} />
        ))}
      </div>
    </div>
  )
}

function LbCard({ mla, idx, medal, maxResolved }) {
  const [tilt, setTilt]       = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)

  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
    setTilt({ x: dy * -5, y: dx * 5 })
  }

  const cardStyle = {
    transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${hovered ? 6 : 0}px)`,
    boxShadow: hovered
      ? idx === 0
        ? '0 20px 48px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.2)'
        : '0 16px 36px rgba(0,0,0,0.4), 0 0 20px rgba(91,124,250,0.12)'
      : '0 4px 16px rgba(0,0,0,0.25)',
  }

  const shineStyle = {
    background: `radial-gradient(circle at ${50 + tilt.y * 6}% ${50 + tilt.x * 6}%, rgba(255,255,255,0.07) 0%, transparent 65%)`,
    opacity: hovered ? 1 : 0,
  }

  return (
    <div
      ref={ref}
      className={`lb-card ${idx === 0 ? 'top' : ''}`}
      style={cardStyle}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
    >
      <div className="card-shine" style={shineStyle} />

      <div className="lb-rank">
        {idx < 3 ? medal : <span className="rank-num">#{idx + 1}</span>}
      </div>

      <div className="lb-avatar-wrap">
        <div className="lb-avatar">{mla.avatar}</div>
        {idx === 0 && <div className="lb-avatar-glow" />}
      </div>

      <div className="lb-info">
        <p className="lb-name">{mla.name}</p>
        <p className="lb-constituency">📍 {mla.constituency}</p>
      </div>

      <div className="lb-stats">
        <div className="lb-stat-item">
          <span className="lb-big">{mla.resolved}</span>
          <span className="lb-label">Resolved</span>
        </div>
        <div className="lb-stat-item">
          <span className="lb-big votes">{mla.totalVotes}</span>
          <span className="lb-label">Impact pts</span>
        </div>
      </div>

      <div className="lb-bar-wrap">
        <div className="lb-bar" style={{ width: `${mla.resolved === 0 ? 4 : (mla.resolved / maxResolved) * 100}%` }} />
      </div>

      {mla.issues.length > 0 && (
        <ul className="lb-issue-list">
          {mla.issues.map(i => <li key={i.id}>✅ {i.title}</li>)}
        </ul>
      )}
      {mla.resolved === 0 && <p className="lb-none">No issues resolved yet</p>}
    </div>
  )
}
