import { useState } from 'react'
import IssueForm from './components/IssueForm'
import IssueList from './components/IssueList'
import Leaderboard from './components/Leaderboard'
import ParticleBackground from './components/ParticleBackground'
import './App.css'

const ADMIN_PASSWORD = 'admin123'

export const MLA_LIST = [
  { id: 1, name: 'Rajesh Kumar', constituency: 'North Ward', avatar: '👨‍💼' },
  { id: 2, name: 'Priya Sharma', constituency: 'South Ward', avatar: '👩‍💼' },
  { id: 3, name: 'Anil Mehta',   constituency: 'East Ward',  avatar: '🧑‍💼' },
  { id: 4, name: 'Sunita Rao',   constituency: 'West Ward',  avatar: '👩‍💼' },
]

const initialIssues = [
  { id: 1,  title: 'Large pothole on Main Street',         location: 'Main Street, Block 4',        image: null, votes: 24, userVote: null, resolved: false, createdAt: Date.now() - 86400000 * 5, category: 'Roads',      resolvedBy: null },
  { id: 2,  title: 'Overflowing garbage bins near park',   location: 'Central Park Entrance',       image: null, votes: 18, userVote: null, resolved: false, createdAt: Date.now() - 86400000 * 3, category: 'Sanitation', resolvedBy: null },
  { id: 3,  title: 'Broken street light on MG Road',       location: 'MG Road, Near Bus Stop 12',   image: null, votes: 15, userVote: null, resolved: false, createdAt: Date.now() - 86400000 * 2, category: 'Lighting',   resolvedBy: null },
  { id: 4,  title: 'Stray dogs menace near school',        location: 'Govt. Primary School, Sector 7', image: null, votes: 31, userVote: null, resolved: false, createdAt: Date.now() - 3600000 * 10, category: 'Safety',   resolvedBy: null },
  { id: 5,  title: 'Waterlogging after rain on Ring Road', location: 'Ring Road, Junction 3',       image: null, votes: 27, userVote: null, resolved: false, createdAt: Date.now() - 3600000 * 6,  category: 'Drainage',   resolvedBy: null },
  { id: 6,  title: 'Damaged footpath blocks wheelchair',   location: 'Civil Hospital Road',         image: null, votes: 9,  userVote: null, resolved: false, createdAt: Date.now() - 3600000 * 2,  category: 'Roads',      resolvedBy: null },
  { id: 7,  title: 'Open manhole near market area',        location: 'Sadar Bazaar, Lane 2',        image: null, votes: 42, userVote: null, resolved: false, createdAt: Date.now() - 1800000,       category: 'Safety',     resolvedBy: null },
  { id: 8,  title: 'Illegal dumping site behind colony',   location: 'Shastri Nagar, Block B',      image: null, votes: 13, userVote: null, resolved: false, createdAt: Date.now() - 900000,        category: 'Sanitation', resolvedBy: null },
  { id: 9,  title: 'Park benches broken and rusted',       location: 'Nehru Park, Sector 4',        image: null, votes: 7,  userVote: null, resolved: true,  createdAt: Date.now() - 86400000 * 10, category: 'Parks',      resolvedBy: 2 },
  { id: 10, title: 'No drinking water supply for 3 days',  location: 'Gandhi Colony, Ward 5',       image: null, votes: 56, userVote: null, resolved: true,  createdAt: Date.now() - 86400000 * 7,  category: 'Water',      resolvedBy: 1 },
]

export default function App() {
  const [issues, setIssues]               = useState(initialIssues)
  const [sortBy, setSortBy]               = useState('votes')
  const [showForm, setShowForm]           = useState(false)
  const [isAdmin, setIsAdmin]             = useState(false)
  const [adminInput, setAdminInput]       = useState('')
  const [adminError, setAdminError]       = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [filter, setFilter]               = useState('all')
  const [activeTab, setActiveTab]         = useState('issues')

  const addIssue = (issue) => {
    setIssues((prev) => [
      { ...issue, id: Date.now(), votes: 0, userVote: null, resolved: false, createdAt: Date.now(), resolvedBy: null },
      ...prev,
    ])
    setShowForm(false)
  }

  const vote = (id, direction) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue
        const pv = issue.userVote
        let delta = 0, newVote = null
        if (direction === 'up') {
          if (pv === 'up')   { delta = -1; newVote = null }
          else if (pv === 'down') { delta = 2; newVote = 'up' }
          else               { delta = 1;  newVote = 'up' }
        } else {
          if (pv === 'down') { delta = 1;  newVote = null }
          else if (pv === 'up')   { delta = -2; newVote = 'down' }
          else               { delta = -1; newVote = 'down' }
        }
        return { ...issue, votes: issue.votes + delta, userVote: newVote }
      })
    )
  }

  const markResolved = (id, mlaId) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? { ...issue, resolved: !issue.resolved, resolvedBy: issue.resolved ? null : (mlaId || null) }
          : issue
      )
    )
  }

  const handleAdminLogin = () => {
    if (adminInput === ADMIN_PASSWORD) {
      setIsAdmin(true); setShowAdminLogin(false); setAdminError(false); setAdminInput('')
    } else { setAdminError(true) }
  }

  const openCount     = issues.filter(i => !i.resolved).length
  const resolvedCount = issues.filter(i =>  i.resolved).length

  const sorted = [...issues]
    .filter((i) => filter === 'all' ? true : filter === 'resolved' ? i.resolved : !i.resolved)
    .sort((a, b) => sortBy === 'votes' ? b.votes - a.votes : b.createdAt - a.createdAt)

  return (
    <div className="app">
      <ParticleBackground />
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <span className="logo">🗳️</span>
          <div>
            <h1>CityVoice</h1>
            <p className="tagline">Report · Vote · Resolve</p>
          </div>
        </div>
        <div className="header-right">
          {isAdmin ? (
            <span className="admin-badge" onClick={() => setIsAdmin(false)}>
              👑 Admin <span className="logout">logout</span>
            </span>
          ) : (
            <button className="btn btn-outline" onClick={() => setShowAdminLogin(true)}>Admin Login</button>
          )}
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Report Issue</button>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="stats-bar">
        <div className="stat"><span className="stat-num">{issues.length}</span><span className="stat-label">Total</span></div>
        <div className="stat-divider" />
        <div className="stat"><span className="stat-num open">{openCount}</span><span className="stat-label">Open</span></div>
        <div className="stat-divider" />
        <div className="stat"><span className="stat-num resolved">{resolvedCount}</span><span className="stat-label">Resolved</span></div>
        <div className="stat-divider" />
        <div className="stat"><span className="stat-num votes">{issues.reduce((s,i)=>s+i.votes,0)}</span><span className="stat-label">Total Votes</span></div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
          📋 Issues
        </button>
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 MLA Leaderboard
        </button>
      </div>

      {/* ── Admin Login Modal ── */}
      {showAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🔐</div>
            <h2>Admin Login</h2>
            <p className="hint">Use password: <code>admin123</code></p>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminInput}
              onChange={(e) => { setAdminInput(e.target.value); setAdminError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              className={`input ${adminError ? 'error' : ''}`}
              autoFocus
            />
            {adminError && <p className="error-msg">⚠ Incorrect password</p>}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAdminLogin(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdminLogin}>Login</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Issue Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📝</div>
            <h2>Report an Issue</h2>
            <IssueForm onSubmit={addIssue} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* ── Tab Content ── */}
      {activeTab === 'issues' ? (
        <>
          <div className="controls">
            <div className="filters">
              {[
                { key: 'all',      label: 'All',      icon: '📌' },
                { key: 'open',     label: 'Open',     icon: '🔴' },
                { key: 'resolved', label: 'Resolved', icon: '✅' },
              ].map(({ key, label, icon }) => (
                <button key={key} className={`filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
                  {icon} {label}
                </button>
              ))}
            </div>
            <div className="sort">
              <span>Sort:</span>
              <button className={`filter-btn ${sortBy === 'votes'  ? 'active' : ''}`} onClick={() => setSortBy('votes')}>🔥 Urgent</button>
              <button className={`filter-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>🕐 Newest</button>
            </div>
          </div>

          <main className="main">
            {sorted.length === 0
              ? <div className="empty"><span>🌆</span><p>No issues found. Be the first to report one!</p></div>
              : <IssueList issues={sorted} onVote={vote} onResolve={markResolved} isAdmin={isAdmin} mlaList={MLA_LIST} />
            }
          </main>
        </>
      ) : (
        <Leaderboard issues={issues} mlaList={MLA_LIST} />
      )}
    </div>
  )
}
