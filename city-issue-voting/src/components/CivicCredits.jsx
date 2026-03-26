import { useEffect, useRef } from 'react'

export default function CivicCredits({ user, issues = [] }) {
  const canvasRef = useRef(null)
  const credits   = issues.filter(i => i.authorId === user?.id || i.userVote).length * 10 + 50
  const max       = 500
  const pct       = Math.min(credits / max, 1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const S   = 120
    canvas.width  = S * dpr
    canvas.height = S * dpr
    canvas.style.width  = S + 'px'
    canvas.style.height = S + 'px'
    ctx.scale(dpr, dpr)

    const cx = S / 2, cy = S / 2, r = 46
    const start = -Math.PI / 2
    const end   = start + pct * 2 * Math.PI

    // track
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(90,100,115,0.3)'
    ctx.lineWidth = 8
    ctx.stroke()

    // progress — Royal Blue glow
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
    grad.addColorStop(0, '#4A78E0')
    grad.addColorStop(1, '#7aa3f5')
    ctx.beginPath()
    ctx.arc(cx, cy, r, start, end)
    ctx.strokeStyle = grad
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.shadowColor = '#4A78E0'
    ctx.shadowBlur  = 14
    ctx.stroke()

    // center text
    ctx.shadowBlur = 0
    ctx.fillStyle  = '#F4F6FA'
    ctx.font       = '700 22px Inter, system-ui'
    ctx.textAlign  = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(credits, cx, cy - 6)
    ctx.fillStyle = '#9ca3af'
    ctx.font      = '500 10px Inter, system-ui'
    ctx.fillText('CREDITS', cx, cy + 12)
  }, [credits, pct])

  return (
    <div className="civic-credits">
      <canvas ref={canvasRef} />
      <div className="civic-credits-info">
        <p className="civic-credits-name">{user?.name ?? 'Citizen'}</p>
        <p className="civic-credits-sub">Civic Contributor</p>
        <div className="civic-credits-badges">
          {credits >= 100 && <span className="civic-badge">🏅 Reporter</span>}
          {credits >= 200 && <span className="civic-badge">⭐ Advocate</span>}
          {credits >= 400 && <span className="civic-badge">🔵 Champion</span>}
        </div>
      </div>
    </div>
  )
}
