import { useEffect, useRef, useCallback } from 'react'
import useAreaChartData, { CAT_COLORS } from './useAreaChartData'

const LABEL_W  = 160
const COUNT_W  = 48
const BAR_H    = 28
const BAR_GAP  = 10
const PAD_V    = 12
const DPR      = () => window.devicePixelRatio || 1

export default function AreaStackedBar({ issues, hiddenCategories }) {
  const canvasRef  = useRef(null)
  const tooltipRef = useRef(null)
  const segRef     = useRef([])  // [{area, category, count, pct, x, y, w}]

  const { areas, stackedData } = useAreaChartData(issues, hiddenCategories)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = DPR()
    const W   = canvas.offsetWidth
    if (!W) return

    const barW = W - LABEL_W - COUNT_W
    const H    = areas.length * (BAR_H + BAR_GAP) + PAD_V * 2

    canvas.width        = W * dpr
    canvas.height       = H * dpr
    canvas.style.height = H + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const segments = []

    stackedData.forEach(({ area, total, segments: segs }, ri) => {
      const y = PAD_V + ri * (BAR_H + BAR_GAP)

      // area label
      const label = area.length > 18 ? area.slice(0, 17) + '…' : area
      ctx.fillStyle = '#8892b0'
      ctx.font      = '500 11px Inter, system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(label, LABEL_W - 8, y + BAR_H / 2 + 4)

      // bar background
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.beginPath()
      ctx.roundRect(LABEL_W, y, barW, BAR_H, 5)
      ctx.fill()

      // segments
      let sx = LABEL_W
      segs.forEach(({ category, count, pct }, si) => {
        if (count === 0) return
        const sw = (pct / 100) * barW
        const color = CAT_COLORS[category] || '#6b7280'

        ctx.fillStyle = color
        ctx.beginPath()
        const isFirst = si === 0 || segs.slice(0, si).every(s => s.count === 0)
        const isLast  = si === segs.length - 1 || segs.slice(si + 1).every(s => s.count === 0)
        if (isFirst && isLast) ctx.roundRect(sx, y, sw, BAR_H, 5)
        else if (isFirst)      ctx.roundRect(sx, y, sw, BAR_H, [5, 0, 0, 5])
        else if (isLast)       ctx.roundRect(sx, y, sw, BAR_H, [0, 5, 5, 0])
        else                   ctx.rect(sx, y, sw, BAR_H)
        ctx.fill()

        segments.push({ area, category, count, pct, x: sx, y, w: sw })
        sx += sw
      })

      // total count label
      ctx.fillStyle = '#e2e8f0'
      ctx.font      = '700 11px Inter, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(total, LABEL_W + barW + 6, y + BAR_H / 2 + 4)
    })

    segRef.current = segments
  }, [areas, stackedData])

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

    const hit = segRef.current.find(s =>
      mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + BAR_H
    )

    if (!hit) { tooltip.classList.remove('visible'); return }

    tooltip.innerHTML = `
      <strong>${hit.area}</strong><br/>
      Category: ${hit.category}<br/>
      Count: ${hit.count} issue${hit.count !== 1 ? 's' : ''}<br/>
      ${Math.round(hit.pct)}% of area total
    `
    const W  = canvas.offsetWidth
    const tx = Math.min(mx + 12, W - 180)
    tooltip.style.left = tx + 'px'
    tooltip.style.top  = (my + 12) + 'px'
    tooltip.classList.add('visible')
  }, [])

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
