import { useEffect, useRef, useCallback } from 'react'
import useAreaChartData, { CAT_COLORS, CATEGORIES } from './useAreaChartData'

const LABEL_W = 140
const CHART_H = 320
const PAD_B   = 36  // bottom for x-axis labels
const PAD_T   = 16
const DPR     = () => window.devicePixelRatio || 1
const MIN_R   = 6
const MAX_R   = 28

export default function AreaBubbleChart({ issues, hiddenCategories }) {
  const canvasRef  = useRef(null)
  const tooltipRef = useRef(null)
  const bubblesRef = useRef([])

  const { areas, visibleCats, bubbleData, matrix } = useAreaChartData(issues, hiddenCategories)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = DPR()
    const W   = canvas.offsetWidth
    if (!W) return

    canvas.width        = W * dpr
    canvas.height       = CHART_H * dpr
    canvas.style.height = CHART_H + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, CHART_H)

    if (areas.length === 0 || visibleCats.length === 0) return

    const plotW = W - LABEL_W
    const plotH = CHART_H - PAD_B - PAD_T

    // find max count for radius scaling
    const maxCount = Math.max(...bubbleData.map(b => b.count), 1)

    // compute positions
    const rendered = bubbleData.map(b => {
      const ci = visibleCats.indexOf(b.category)
      const ai = areas.indexOf(b.area)
      if (ci < 0 || ai < 0) return null
      const x = LABEL_W + (ci + 0.5) * (plotW / visibleCats.length)
      const y = PAD_T   + (ai + 0.5) * (plotH / areas.length)
      const r = MIN_R + (b.count / maxCount) * (MAX_R - MIN_R)
      return { ...b, x, y, r }
    }).filter(Boolean)

    bubblesRef.current = rendered

    // ── Y axis labels (areas) ──
    areas.forEach((area, ai) => {
      const y = PAD_T + (ai + 0.5) * (plotH / areas.length)
      const label = area.length > 14 ? area.slice(0, 13) + '…' : area
      ctx.fillStyle = '#8892b0'
      ctx.font      = '500 11px Inter, system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(label, LABEL_W - 8, y + 4)
    })

    // ── X axis labels (categories) ──
    visibleCats.forEach((cat, ci) => {
      const x = LABEL_W + (ci + 0.5) * (plotW / visibleCats.length)
      ctx.fillStyle = '#8892b0'
      ctx.font      = '600 11px Inter, system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(cat, x, CHART_H - 8)
    })

    // ── Bubbles ──
    rendered.forEach(b => {
      const color = CAT_COLORS[b.category] || '#6b7280'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fillStyle = color + 'bf' // 75% opacity
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth   = 1.5
      ctx.stroke()

      // label inside if big enough, else outside
      if (b.r > 14) {
        ctx.fillStyle  = '#fff'
        ctx.font       = `700 ${Math.min(b.r * 0.7, 13)}px Inter, system-ui`
        ctx.textAlign  = 'center'
        ctx.fillText(b.count, b.x, b.y + 4)
      } else if (b.r > 0) {
        ctx.fillStyle  = '#e2e8f0'
        ctx.font       = '600 10px Inter, system-ui'
        ctx.textAlign  = 'center'
        ctx.fillText(b.count, b.x, b.y - b.r - 4)
      }
    })
  }, [areas, visibleCats, bubbleData, matrix])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [draw])

  const onMouseMove = useCallback((e) => {
    const canvas  = canvasRef.current
    const tooltip = tooltipRef.current
    if (!canvas || !tooltip) return

    const rect = canvas.getBoundingClientRect()
    const mx   = e.clientX - rect.left
    const my   = e.clientY - rect.top

    const hit = bubblesRef.current.find(b => {
      const dx = mx - b.x, dy = my - b.y
      return Math.sqrt(dx*dx + dy*dy) <= b.r
    })

    if (!hit) { tooltip.classList.remove('visible'); return }

    const areaTotal = Object.values(matrix[hit.area] || {}).reduce((s,v)=>s+v,0)
    const catTotal  = issues.filter(i => i.category === hit.category).length
    const pctCat    = catTotal  > 0 ? Math.round((hit.count / catTotal)  * 100) : 0
    const pctArea   = areaTotal > 0 ? Math.round((hit.count / areaTotal) * 100) : 0

    tooltip.innerHTML = `
      <strong>${hit.area}</strong><br/>
      Category: ${hit.category}<br/>
      Count: ${hit.count} issue${hit.count !== 1 ? 's' : ''}<br/>
      ${pctCat}% of all ${hit.category} issues<br/>
      ${pctArea}% of issues in this area
    `
    const W  = canvas.offsetWidth
    const tx = Math.min(mx + 12, W - 200)
    tooltip.style.left = tx + 'px'
    tooltip.style.top  = (my + 12) + 'px'
    tooltip.classList.add('visible')
  }, [issues, matrix])

  const onMouseLeave = () => tooltipRef.current?.classList.remove('visible')

  if (areas.length < 2) return null

  return (
    <div className="chart-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} />
      <div ref={tooltipRef} className="area-tooltip" />
    </div>
  )
}
