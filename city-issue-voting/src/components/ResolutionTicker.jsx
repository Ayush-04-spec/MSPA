import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SEED = [
  { id: 1, mla: 'Rajesh Kumar', issue: 'Pothole on Main Street',     ward: 'North Ward', time: '2m ago' },
  { id: 2, mla: 'Priya Sharma', issue: 'Garbage bins overflowing',   ward: 'South Ward', time: '8m ago' },
  { id: 3, mla: 'Anil Mehta',   issue: 'Broken street light MG Rd',  ward: 'East Ward',  time: '15m ago' },
  { id: 4, mla: 'Sunita Rao',   issue: 'Waterlogging Ring Road',     ward: 'West Ward',  time: '22m ago' },
  { id: 5, mla: 'Rajesh Kumar', issue: 'Open manhole Sadar Bazaar',  ward: 'North Ward', time: '31m ago' },
]

export default function ResolutionTicker({ liveEvents = [] }) {
  const [items, setItems] = useState(SEED)
  const [pulse, setPulse] = useState(false)
  const trackRef = useRef(null)

  // inject live WS events
  useEffect(() => {
    if (liveEvents.length === 0) return
    const latest = liveEvents[liveEvents.length - 1]
    setItems(prev => [{ id: Date.now(), mla: latest.mla || 'An MLA', issue: latest.title || 'an issue', ward: latest.ward || '', time: 'just now' }, ...prev.slice(0, 8)])
    setPulse(true)
    setTimeout(() => setPulse(false), 1800)
  }, [liveEvents.length])

  return (
    <div className={`ticker-wrap ${pulse ? 'ticker-pulse' : ''}`}>
      <div className="ticker-label">
        <span className="ticker-dot" />
        LIVE RESOLUTIONS
      </div>
      <div className="ticker-track" ref={trackRef}>
        <div className="ticker-inner">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-mla">✅ {item.mla}</span>
              &nbsp;resolved&nbsp;
              <span className="ticker-issue">"{item.issue}"</span>
              &nbsp;·&nbsp;
              <span className="ticker-meta">{item.ward} · {item.time}</span>
              <span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
