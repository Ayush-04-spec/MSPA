import { useState } from 'react'

function getGuestName() {
  const key = 'cityvoice_guest'
  let name = sessionStorage.getItem(key)
  if (!name) {
    const names = ['Alex', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake']
    name = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 90 + 10)
    sessionStorage.setItem(key, name)
  }
  return name
}

const GUEST = getGuestName()

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function CommentItem({ comment, allComments, onReply }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const replies = allComments.filter(c => c.parentId === comment.id)

  const submitReply = () => {
    const t = replyText.trim()
    if (!t) return
    onReply(t, comment.id)
    setReplyText('')
    setShowReply(false)
  }

  return (
    <div className="comment">
      <div className="comment-meta">
        <span className="comment-author">{comment.author?.name ?? comment.author ?? 'Anonymous'}</span>
        <span className="comment-time">{timeAgo(typeof comment.createdAt === 'string' ? new Date(comment.createdAt).getTime() : comment.createdAt)}</span>
      </div>
      <p className="comment-text">{comment.text}</p>
      <button className="comment-reply-btn" onClick={() => setShowReply(v => !v)}>
        ↩ Reply
      </button>

      {showReply && (
        <div className="reply-input-row">
          <input
            className="input comment-input"
            placeholder={`Reply as ${GUEST}…`}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitReply()}
            autoFocus
          />
          <button className="btn-action btn-resolve" onClick={submitReply}>Post</button>
          <button className="btn-action btn-reopen" onClick={() => setShowReply(false)}>✕</button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="comment-replies">
          {replies.map(r => (
            <CommentItem key={r.id} comment={r} allComments={allComments} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Comments({ comments = [], onAddComment }) {
  const [open, setOpen]   = useState(false)
  const [text, setText]   = useState('')

  const topLevel = comments.filter(c => !c.parentId)

  const submit = () => {
    const t = text.trim()
    if (!t) return
    onAddComment(t, null)
    setText('')
  }

  return (
    <div className="comments-section">
      <button className="comments-toggle" onClick={() => setOpen(v => !v)}>
        💬 Comments ({comments.length}) {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="comments-body">
          {topLevel.length === 0 && (
            <p className="comments-empty">No comments yet. Be the first!</p>
          )}
          {topLevel.map(c => (
            <CommentItem key={c.id} comment={c} allComments={comments} onReply={onAddComment} />
          ))}

          <div className="comment-new-row">
            <input
              className="input comment-input"
              placeholder={`Comment as ${GUEST}…`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            <button className="btn-action btn-resolve" onClick={submit}>Post</button>
          </div>
        </div>
      )}
    </div>
  )
}
