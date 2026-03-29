import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import IssueList from '../components/IssueList'
import IssueForm from '../components/IssueForm'
import LoginModal from '../components/LoginModal'
import { useAuth } from '../AuthContext'
import { useIssues } from '../IssuesContext'

const ALL_TAGS = ['Road', 'Water', 'Electricity', 'Sanitation', 'Parks', 'Safety', 'Other']

const pageVariants = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, y: -16, filter: 'blur(4px)', transition: { duration: 0.25 } },
}

export default function Frontline() {
  const { user, isAdmin } = useAuth()
  const { issues, loadingIssues, nextCursor, apiError, globePulse, fetchIssues, addIssue, vote, updateStatus, addComment } = useIssues()

  const [sortBy, setSortBy] = useState('votes')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const searchTimer = useRef(null)

  // listen for global "open report form" event from header button
  useEffect(() => {
    const handler = () => setShowForm(true)
    window.addEventListener('open-report-form', handler)
    return () => window.removeEventListener('open-report-form', handler)
  }, [])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearchDebounced(search), 150)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  useEffect(() => {
    fetchIssues(true, {
      sort: sortBy,
      ...(filter !== 'all' && { status: filter === 'resolved' ? 'RESOLVED' : 'OPEN' }),
      ...(searchDebounced && { ward: searchDebounced }),
      ...(activeTags.length > 0 && { tag: activeTags[0] }),
    })
  }, [filter, sortBy, searchDebounced, activeTags])

  const handleAddIssue = async (formData) => {
    if (!user) { setShowLogin(true); return }
    try {
      await addIssue(formData, () => setShowForm(false))
    } catch (e) { alert(e?.error?.message || 'Failed to create issue') }
  }

  const handleVote = async (id, dir) => {
    if (!user) { setShowLogin(true); return }
    try { await vote(id, dir) } catch { }
  }

  const handleComment = async (issueId, text, parentId) => {
    if (!user) { setShowLogin(true); return }
    try { await addComment(issueId, text, parentId) } catch (e) { alert(e?.error?.message || 'Failed') }
  }

  const toggleTag = (tag) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const filtered = issues.filter(i =>
    activeTags.length === 0 || activeTags.every(t => (i.tags || []).includes(t))
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

      <div className="search-bar-wrap">
        <input type="search" className="input search-input"
          placeholder="🔍 Search issues by title or location…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="tag-filter-row">
        {ALL_TAGS.map(t => (
          <button key={t} className={`tag-chip-btn ${activeTags.includes(t) ? 'active' : ''}`}
            onClick={() => toggleTag(t)}>{t}</button>
        ))}
        {activeTags.length > 0 && (
          <button className="tag-chip-btn clear" onClick={() => setActiveTags([])}>✕ Clear</button>
        )}
      </div>

      <div className="controls">
        <div className="filters">
          {[
            { key: 'all', label: 'All', icon: '📌' },
            { key: 'open', label: 'Open', icon: '🔴' },
            { key: 'resolved', label: 'Resolved', icon: '✅' },
          ].map(({ key, label, icon }) => (
            <button key={key} className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}>{icon} {label}</button>
          ))}
        </div>
        <div className="sort">
          <span>Sort:</span>
          <button className={`filter-btn ${sortBy === 'votes' ? 'active' : ''}`} onClick={() => setSortBy('votes')}>🔥 Urgent</button>
          <button className={`filter-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>🕐 Newest</button>
        </div>
      </div>

      <main className="main">
        {apiError ? (
          <div className="empty"><span>⚠️</span><p>{apiError}</p>
            <button className="btn btn-outline" onClick={() => fetchIssues(true)}>Retry</button>
          </div>
        ) : loadingIssues && issues.length === 0 ? (
          <div className="empty"><span>⏳</span><p>Loading issues…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><span>🌆</span><p>No issues found.</p></div>
        ) : (
          <>
            <IssueList issues={filtered} onVote={handleVote}
              onResolve={(id, mlaId) => updateStatus(id, 'resolved', mlaId)}
              onStatusChange={updateStatus} onAddComment={handleComment} isAdmin={isAdmin} />
            {nextCursor && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn btn-outline" onClick={() => fetchIssues(false)} disabled={loadingIssues}>
                  {loadingIssues ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showLogin && createPortal(
        <LoginModal onClose={() => setShowLogin(false)} />,
        document.body
      )}

      {showForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">📝</div>
            <h2>Report an Issue</h2>
            <IssueForm onSubmit={handleAddIssue} onCancel={() => setShowForm(false)} />
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  )
}
