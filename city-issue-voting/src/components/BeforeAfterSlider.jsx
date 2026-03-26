import { useState, useRef, useCallback } from 'react'

export default function BeforeAfterSlider({ before, after, title }) {
  const [pos, setPos]       = useState(50)
  const [dragging, setDrag] = useState(false)
  const wrapRef = useRef(null)

  const move = useCallback((clientX) => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const pct  = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  const onMouseMove = (e) => { if (dragging) move(e.clientX) }
  const onTouchMove = (e) => { if (dragging) move(e.touches[0].clientX) }

  return (
    <div
      ref={wrapRef}
      className="ba-wrap"
      onMouseMove={onMouseMove}
      onMouseUp={() => setDrag(false)}
      onMouseLeave={() => setDrag(false)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => setDrag(false)}
    >
      {/* After (full width base) */}
      <img src={after} alt="After" className="ba-img ba-after" />

      {/* Before (clipped) */}
      <div className="ba-before-wrap" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="ba-img ba-before" />
      </div>

      {/* Labels */}
      <span className="ba-label ba-label-before">BEFORE</span>
      <span className="ba-label ba-label-after">AFTER</span>

      {/* Glassmorphic handle */}
      <div
        className="ba-handle"
        style={{ left: `${pos}%` }}
        onMouseDown={() => setDrag(true)}
        onTouchStart={() => setDrag(true)}
      >
        <div className="ba-handle-line" />
        <div className="ba-handle-knob">
          <span>◀</span><span>▶</span>
        </div>
        <div className="ba-handle-line" />
      </div>
    </div>
  )
}
