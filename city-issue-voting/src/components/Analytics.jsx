import { useEffect, useRef, useState } from 'react'
import AreaHeatmap     from './analytics/AreaHeatmap'
import AreaBubbleChart from './analytics/AreaBubbleChart'
import AreaStackedBar  from './analytics/AreaStackedBar'
import CategoryLegend  from './analytics/CategoryLegend'
import './analytics/areaCharts.css'

const STATUS_COLORS = {
  open:         '#ef4444',
  under_review: '#5A6473',
  in_progress:  '#5A6473',
  resolved:     '#4A78E0',
}

const STATUS_LABELS = {
  open: 'Open', under_review: 'Under Review',
  in_progress: 'In Progress', resolved: 'Resolved',
}

function useDpr() {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
}

/* ── Chart 1: Issues by category ── */
function CategoryChart({ issues }) {
  const ref = useRef(null)
  const dpr = useDpr()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const counts = {}
    issues.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1 })
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const max = entries[0]?.[1] || 1

    const W = canvas.offsetWidth
    const ROW = 36, PAD = 16, LABEL_W = 100, COUNT_W = 32
    const H = entries.length * ROW + PAD * 2
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    entries.forEach(([cat, count], i) => {
      const y = PAD + i * ROW
      const barW = ((W - LABEL_W - COUNT_W - PAD * 2) * count) / max

      // label
      ctx.fillStyle = '#94a3b8'
      ctx.font = '600 12px Inter, system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(cat, LABEL_W, y + 18)

      // bar bg
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.beginPath()
      ctx.roundRect(LABEL_W + PAD, y + 6, W - LABEL_W - COUNT_W - PAD * 2, 20, 4)
      ctx.fill()

      // bar fill — Royal Blue gradient
      const grad = ctx.createLinearGradient(LABEL_W + PAD, 0, LABEL_W + PAD + barW, 0)
      grad.addColorStop(0, '#4A78E0')
      grad.addColorStop(1, '#7aa3f5')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(LABEL_W + PAD, y + 6, Math.max(barW, 4), 20, 4)
      ctx.fill()

      // count
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '700 12px Inter, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(count, W - COUNT_W + 4, y + 18)
    })
  }, [issues, dpr])

  return <canvas ref={ref} style={{ width: '100%', display: 'block' }} />
}

/* ── Chart 2: Status breakdown ── */
function StatusChart({ issues }) {
  const ref = useRef(null)
  const dpr = useDpr()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const counts = { open: 0, under_review: 0, in_progress: 0, resolved: 0 }
    issues.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++ })
    const total = issues.length || 1

    const W = canvas.offsetWidth
    const H = 80
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const BAR_H = 28, BAR_Y = 10, R = 6
    let x = 0
    const segments = Object.entries(counts)

    segments.forEach(([status, count], idx) => {
      const w = (count / total) * W
      if (w < 1) return
      ctx.fillStyle = STATUS_COLORS[status]
      ctx.beginPath()
      if (idx === 0) {
        ctx.roundRect(x, BAR_Y, w, BAR_H, [R, 0, 0, R])
      } else if (idx === segments.length - 1) {
        ctx.roundRect(x, BAR_Y, w, BAR_H, [0, R, R, 0])
      } else {
        ctx.rect(x, BAR_Y, w, BAR_H)
      }
      ctx.fill()
      x += w
    })

    // legend
    let lx = 0
    segments.forEach(([status, count]) => {
      ctx.fillStyle = STATUS_COLORS[status]
      ctx.beginPath()
      ctx.arc(lx + 5, 56, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px Inter, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`${STATUS_LABELS[status]} (${count})`, lx + 14, 60)
      lx += ctx.measureText(`${STATUS_LABELS[status]} (${count})`).width + 28
    })
  }, [issues, dpr])

  return <canvas ref={ref} style={{ width: '100%', display: 'block' }} />
}

/* ── Chart 3: Top 5 most-voted ── */
function TopVotedChart({ issues }) {
  const ref = useRef(null)
  const dpr = useDpr()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const top5 = [...issues].sort((a, b) => b.votes - a.votes).slice(0, 5)
    const max = top5[0]?.votes || 1

    const W = canvas.offsetWidth
    const ROW = 36, PAD = 16, LABEL_W = 180, COUNT_W = 36
    const H = top5.length * ROW + PAD * 2
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    top5.forEach((issue, i) => {
      const y = PAD + i * ROW
      const label = issue.title.length > 28 ? issue.title.slice(0, 28) + '…' : issue.title
      const barW = ((W - LABEL_W - COUNT_W - PAD * 2) * issue.votes) / max

      ctx.fillStyle = '#94a3b8'
      ctx.font = '500 11px Inter, system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(label, LABEL_W, y + 18)

      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.beginPath()
      ctx.roundRect(LABEL_W + PAD, y + 6, W - LABEL_W - COUNT_W - PAD * 2, 20, 4)
      ctx.fill()

      const grad = ctx.createLinearGradient(LABEL_W + PAD, 0, LABEL_W + PAD + barW, 0)
      grad.addColorStop(0, '#ef4444')
      grad.addColorStop(1, '#f59e0b')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(LABEL_W + PAD, y + 6, Math.max(barW, 4), 20, 4)
      ctx.fill()

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '700 12px Inter, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(issue.votes, W - COUNT_W + 4, y + 18)
    })
  }, [issues, dpr])

  return <canvas ref={ref} style={{ width: '100%', display: 'block' }} />
}

export default function Analytics({ issues }) {
  const [hiddenCategories, setHiddenCategories] = useState(new Set())

  const toggleCategory = (cat) => {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // unique areas check for placeholder
  const uniqueAreas = new Set(issues.map(i => (i.location || '').trim().replace(/\b\w/g, c => c.toUpperCase())))
  const showAreaCharts = uniqueAreas.size >= 2

  return (
    <div className="analytics">
      <div className="an-header">
        <h2>📊 Analytics Dashboard</h2>
        <p className="lb-sub">Live stats from current session data</p>
      </div>

      <div className="an-cards">
        <div className="an-card">
          <h3 className="an-title">Issues by Category</h3>
          <CategoryChart issues={issues} />
        </div>

        <div className="an-card">
          <h3 className="an-title">Status Breakdown</h3>
          <StatusChart issues={issues} />
        </div>

        <div className="an-card">
          <h3 className="an-title">Top 5 Most Voted</h3>
          <TopVotedChart issues={issues} />
        </div>
      </div>

      {/* ── Area × Problem Breakdown ── */}
      <div className="area-section">
        <h3 className="area-section-heading">Area × Problem Breakdown</h3>
        <p className="area-section-sub">Which areas have the highest concentration of which problem types</p>

        {!showAreaCharts ? (
          <div className="area-panel">
            <div className="area-placeholder">
              <span>🗺️</span>
              Add issues from multiple areas to see the heatmap
            </div>
          </div>
        ) : (
          <div className="area-panel">
            <div>
              <p className="chart-label">Filter by category</p>
              <CategoryLegend hiddenCategories={hiddenCategories} onToggle={toggleCategory} />
            </div>

            <div>
              <p className="chart-label">Heatmap — area × category count</p>
              <AreaHeatmap issues={issues} hiddenCategories={hiddenCategories} />
            </div>

            <div>
              <p className="chart-label">Bubble chart — issue intensity</p>
              <AreaBubbleChart issues={issues} hiddenCategories={hiddenCategories} />
            </div>

            <div>
              <p className="chart-label">Stacked bars — category split per area</p>
              <AreaStackedBar issues={issues} hiddenCategories={hiddenCategories} />
            </div>

            {issues.length === 1 && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                More data needed for meaningful patterns
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
