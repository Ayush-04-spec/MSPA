import { useState } from 'react'
import Tilt from 'react-parallax-tilt'
import { MLA_LIST } from '../mlaList'
import Comments from './Comments'
import Lightbox from './Lightbox'
import PresenceIndicator from './PresenceIndicator'
import BeforeAfterSlider from './BeforeAfterSlider'

const CAT_ICONS = {
  ROAD:        { icon: '🛣️',  bg: 'rgba(74,120,224,0.12)',  color: '#4A78E0' },
  SANITATION:  { icon: '🗑️',  bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  ELECTRICITY: { icon: '⚡',   bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  SAFETY:      { icon: '🚨',   bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  WATER:       { icon: '💧',   bg: 'rgba(56,189,248,0.12)',  color: '#38bdf8' },
  PARKS:       { icon: '🌳',   bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  OTHER:       { icon: '📌',   bg: 'rgba(90,100,115,0.12)',  color: '#5A6473' },
}

const STATUS_PROGRESS = { open: 25, under_review: 50, in_progress: 75, resolved: 100 }
const STATUS_LABELS   = { open: 'Open', under_review: 'In Review', in_progress: 'In Progress', resolved: 'Resolved' }
const STATUSES        = ['open', 'under_review', 'in_progress', 'resolved']

export default function IssueCard({ issue, onVote, onResolve, onStatusChange, onAddComment, isAdmin }) {
  const [showMlaSelect, setShowMlaSelect] = useState(false)
  const [selectedMla,   setSelectedMla]   = useState('')
  const [lbIndex,       setLbIndex]       = useState(null)
  const [expanded,      setExpanded]      = useState(false)

  const timeAgo = (ts) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const cat        = CAT_ICONS[issue.category] || CAT_ICONS.OTHER
  const mla        = MLA_LIST.find(m => m.id === issue.resolvedBy)
  const images     = issue.images || (issue.image ? [issue.image] : [])
  const status     = issue.status || (issue.resolved ? 'resolved' : 'open')
  const progress   = STATUS_PROGRESS[status] || 25
  const isResolved = status === 'resolved'
  const isHighPrio = (issue.votes || 0) >= 20 && !isResolved

  const handleStatusChange = (e) => {
    const s = e.target.value
    if (s === 'resolved') { setShowMlaSelect(true); return }
    onStatusChange(issue.id, s, null)
    setShowMlaSelect(false)
  }

  const confirmResolve = () => {
    onStatusChange(issue.id, 'resolved', selectedMla ? parseInt(selectedMla) : null)
    setShowMlaSelect(false); setSelectedMla('')
  }

  const navLightbox = (delta) =>
    setLbIndex(i => (i + delta + images.length) % images.length)

  return (
    <>
      <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} glareEnable glareMaxOpacity={0.04}
        glareColor="#4A78E0" scale={1.005} style={{ borderRadius: 14 }}>
        <div
          className={`issue-card${isResolved ? ' resolved' : ''}${isHighPrio ? ' priority-high' : ''}`}
          onClick={() => setExpanded(v => !v)}
        >
          {/* Slot A — category icon */}
          <div className="card-icon-slot"
            style={{ background: cat.bg, borderColor: cat.color + '33' }}>
            <span style={{ fontSize: '1.6rem' }}>{cat.icon}</span>
          </div>

          {/* Slot B — content */}
          <div className="card-main">
            <div className="card-title">{issue.title}</div>
            <div className="card-meta">
              <span>📍 {issue.location}</span>
              <span className="card-meta-sep">•</span>
              <span>{timeAgo(issue.createdAt)}</span>
              {mla && (
                <>
                  <span className="card-meta-sep">•</span>
                  <span style={{ color: '#4A78E0' }}>✓ {mla.name}</span>
                </>
              )}
              <PresenceIndicator issueId={issue.id} />
            </div>
            {issue.tags?.length > 0 && (
              <div className="card-tags">
                {issue.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
              </div>
            )}
          </div>

          {/* Slot C — progress + votes */}
          <div className="card-right" onClick={e => e.stopPropagation()}>
            <div className="card-progress-wrap">
              <div className="card-progress-label">{STATUS_LABELS[status]}</div>
              <div className="card-progress-track">
                <div className="card-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="card-votes">
              <button className={`vote-btn up${issue.userVote === 'up' ? ' active' : ''}`}
                onClick={() => onVote(issue.id, 'up')}>▲</button>
              <span className={`vote-count${issue.votes > 0 ? ' pos' : issue.votes < 0 ? ' neg' : ''}`}>
                {issue.votes}
              </span>
              <button className={`vote-btn down${issue.userVote === 'down' ? ' active' : ''}`}
                onClick={() => onVote(issue.id, 'down')}>▼</button>
            </div>
          </div>
        </div>
      </Tilt>

      {/* Expanded detail */}
      {expanded && (
        <div className="card-expanded" onClick={e => e.stopPropagation()}>
          {isResolved && images.length >= 2 ? (
            <BeforeAfterSlider before={images[0]} after={images[1]} />
          ) : images.length === 1 ? (
            <img src={images[0]} alt={issue.title} className="card-img-full"
              onClick={() => setLbIndex(0)} style={{ cursor: 'zoom-in' }} />
          ) : images.length > 1 ? (
            <div className="thumb-strip">
              {images.map((src, i) => (
                <img key={i} src={src} alt="" className="thumb" onClick={() => setLbIndex(i)} />
              ))}
            </div>
          ) : null}

          {isAdmin && !showMlaSelect && (
            <select className="input" style={{ marginTop: 12, maxWidth: 220, fontSize: '0.82rem' }}
              value={status} onChange={handleStatusChange}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          )}
          {isAdmin && showMlaSelect && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <select className="input" style={{ fontSize: '0.82rem' }} value={selectedMla}
                onChange={e => setSelectedMla(e.target.value)}>
                <option value="">-- Assign MLA --</option>
                {MLA_LIST.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={confirmResolve}>Confirm</button>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setShowMlaSelect(false)}>Cancel</button>
            </div>
          )}

          <Comments
            comments={issue.comments || []}
            onAddComment={(text, parentId) => onAddComment(issue.id, text, parentId)}
          />
        </div>
      )}

      {lbIndex !== null && (
        <Lightbox images={images} index={lbIndex} onClose={() => setLbIndex(null)} onNav={navLightbox} />
      )}
    </>
  )
}
