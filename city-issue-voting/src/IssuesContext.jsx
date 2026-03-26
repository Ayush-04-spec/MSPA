import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { issues as issuesApi, votes as votesApi, comments as commentsApi,
         admin as adminApi, uploads, createWS } from './api'

const Ctx = createContext(null)

export function IssuesProvider({ children }) {
  const { user } = useAuth()

  const [issues,          setIssues]          = useState([])
  const [loadingIssues,   setLoadingIssues]   = useState(true)
  const [nextCursor,      setNextCursor]      = useState(null)
  const [total,           setTotal]           = useState(0)
  const [apiError,        setApiError]        = useState('')
  const [globePulse,      setGlobePulse]      = useState(false)
  const wsRef = useRef(null)

  function normalizeIssue(i) {
    return {
      ...i,
      status:    (i.status || 'OPEN').toLowerCase(),
      resolved:  i.status === 'RESOLVED',
      votes:     i.voteScore ?? i.votes ?? 0,
      userVote:  i.userVote ?? null,
      comments:  i.comments ?? [],
      images:    i.images   ?? [],
      tags:      i.tags     ?? [],
      createdAt: new Date(i.createdAt).getTime(),
    }
  }

  function normalizeComment(c) {
    return { ...c, author: c.author?.name ?? c.author ?? 'Anonymous', createdAt: new Date(c.createdAt).getTime() }
  }

  async function fetchIssues(reset = false, params = {}) {
    setLoadingIssues(true); setApiError('')
    try {
      const data = await issuesApi.list({ limit: 20, ...params, ...(!reset && nextCursor ? { cursor: nextCursor } : {}) })
      const normalized = (data.data || []).map(normalizeIssue)
      setIssues(prev => reset ? normalized : [...prev, ...normalized])
      setNextCursor(data.nextCursor)
      setTotal(data.total ?? 0)
    } catch (e) {
      setApiError(e?.error?.message || 'Backend offline — start the server to load issues')
    } finally { setLoadingIssues(false) }
  }

  // WebSocket
  useEffect(() => {
    if (!user) return
    const ws = createWS((msg) => {
      if (msg.event === 'vote:updated')
        setIssues(prev => prev.map(i => i.id === msg.issueId ? { ...i, votes: msg.voteScore } : i))
      if (msg.event === 'status:changed')
        setIssues(prev => prev.map(i => i.id === msg.issueId
          ? { ...i, status: msg.status.toLowerCase(), resolved: msg.status === 'RESOLVED' } : i))
      if (msg.event === 'comment:added')
        setIssues(prev => prev.map(i => i.id === msg.issueId
          ? { ...i, comments: [...(i.comments || []), normalizeComment(msg.comment)] } : i))
      if (msg.event === 'issue:created') {
        setIssues(prev => [normalizeIssue(msg.issue), ...prev])
        setGlobePulse(true); setTimeout(() => setGlobePulse(false), 2000)
      }
    })
    wsRef.current = ws
    return () => ws.close()
  }, [user])

  const addIssue = async (formData, onSuccess) => {
    const imageUrls = []
    for (const img of formData.imageFiles || []) {
      const { publicUrl } = await uploads.uploadFile(img)
      imageUrls.push(publicUrl)
    }
    const created = await issuesApi.create({
      title: formData.title, location: formData.location,
      category: formData.category, tags: formData.tags,
      images: imageUrls, description: formData.description,
    })
    setIssues(prev => [normalizeIssue(created), ...prev])
    onSuccess?.()
  }

  const vote = async (id, direction) => {
    const issue = issues.find(i => i.id === id)
    if (!issue) return
    const pv = issue.userVote
    let value = direction === 'up' ? 1 : -1
    if ((pv === 'up' && direction === 'up') || (pv === 'down' && direction === 'down')) value = 0
    const delta = value === 0 ? (pv === 'up' ? -1 : 1) : pv ? value * 2 : value
    setIssues(prev => prev.map(i => i.id !== id ? i : { ...i, votes: i.votes + delta, userVote: value === 0 ? null : direction }))
    try {
      const res = await votesApi.cast(id, value)
      setIssues(prev => prev.map(i => i.id !== id ? i : { ...i, votes: res.voteScore }))
    } catch {
      setIssues(prev => prev.map(i => i.id !== id ? i : { ...i, votes: i.votes - delta, userVote: pv }))
    }
  }

  const updateStatus = async (id, status, mlaId) => {
    await adminApi.setStatus(id, status.toUpperCase(), mlaId || undefined)
    setIssues(prev => prev.map(i => i.id !== id ? i : {
      ...i, status, resolved: status === 'resolved', resolvedBy: status === 'resolved' ? mlaId : null,
    }))
  }

  const addComment = async (issueId, text, parentId) => {
    const comment = await commentsApi.add(issueId, text, parentId || undefined)
    setIssues(prev => prev.map(i => i.id !== issueId ? i : {
      ...i, comments: [...(i.comments || []), normalizeComment(comment)],
    }))
  }

  return (
    <Ctx.Provider value={{ issues, loadingIssues, nextCursor, total, apiError, globePulse,
      fetchIssues, addIssue, vote, updateStatus, addComment }}>
      {children}
    </Ctx.Provider>
  )
}

export function useIssues() { return useContext(Ctx) }
