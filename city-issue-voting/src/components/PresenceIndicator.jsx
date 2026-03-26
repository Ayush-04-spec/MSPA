import { useState, useEffect } from 'react'

export default function PresenceIndicator({ issueId }) {
  // Simulate presence count — in production this comes from WS room tracking
  const [count, setCount] = useState(() => Math.floor(Math.random() * 18) + 2)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => Math.max(1, c + (Math.random() > 0.5 ? 1 : -1)))
    }, 8000)
    return () => clearInterval(interval)
  }, [issueId])

  if (count < 2) return null

  return (
    <span className="presence">
      <span className="presence-dot" />
      {count} viewing
    </span>
  )
}
