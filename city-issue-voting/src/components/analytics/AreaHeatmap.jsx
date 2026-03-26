import { useEffect, useRef, useCallback } from 'react'
import useAreaChartData, { CATEGORIES } from './useAreaChartData'

const LABEL_W  = 160
const COL_COUNT = CATEGORIES.length
const ROW_H    = 40
const HEADER_H = 60
const DPR      = () => window.devicePixelRatio || 1

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return [r,g,b]
}

function cellColor(count, maxCount) {
  if (maxCount === 0) return 'rgba(255,255,255,0.03)'
  const t = count / maxCount
  // Royal Blue ramp: 0 → near-transparent, 1 → #4A78E0
  return `rgba(74,120,224,${0.05 + t * 0.85})`
}

function textColor(count, maxCount) {
  if (maxCount === 0) return 'transparent'
  const t = count / maxCount
  return t > 0.5 ? '#F4F6FA' : '#7aa3f5'
}

export default function AreaHeatmap({ issues, hiddenCategories }) {
  const canvasRef  = useRef(null)
  const tooltipRef = useRef(null)
  const dataRef    = useRef(null)

  const { areas, heatmapMatrix, matrix } = useAreaChartData(issues, hiddenCategories)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = DPR()
    const W   = canvas.offsetWidth
    if (!W) return

    const colW = (W - LABEL_W) / COL_COUNT
    const H    = areas.length * ROW_H + HEADER_H

    canvas.width        = W * dpr
    canvas.height       = H * dpr
    canvas.style.height = H + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    // find global max
    const allCounts = heatmapMatrix.flat()
    const maxCount  = Math.max(...allCounts, 1)

    // store layout for hit-testing
    dataRef.current = { areas, colW, W, maxCount, matrix }

    // ── column headers (rotated 45°) ──
    CATEGORIES.forEach((cat, ci) => {
      const cx = LABEL_W + ci * colW + colW / 2
      ctx.save()
      ctx.translate(cx, HEADER_H - 8)
      ctx.rotate(-Math.PI / 4)
      ctx.fillStyle = '#8892b0'
      ctx.font = '600 11px Inter, system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(cat, 0, 0)
      ctx.restore()
    })

    // ── rows ──
    areas.forEach((area, ri) => {
      const y = HEADER_H + ri * ROW_H

      // row label
      const label = area.length > 16 ? area.slice(0, 15) + '…' : area
      ctx.fillStyle = '#8892b0'
      ctx.font = '500 11px Inter, system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(label, LABEL_W - 8, y + ROW_H / 2 + 4)

      // cells
      CATEGORIES.forEach((cat, ci) => {
        const count = heatmapMatrix[ri]?.[ci] ?? 0
        const x     = LABEL_W + ci * colW

        // cell bg
        ctx.fillStyle = cellColor(count, maxCount)
        ctx.fillRect(x, y, colW, ROW_H)

        // grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth   = 1
        ctx.strokeRect(x + 0.5, y + 0.5, colW - 1, ROW_H - 1)

        // count label
        if (count > 0) {
          ctx.fillStyle  = textColor(count, maxCount)
          ctx.font       = '700 11px Inter, system-ui'
          ctx.textAlign  = 'center'
          ctx.fillText(count, x + colW / 2, y + ROW_H / 2 + 4)
        }
      })
    })
  }, [areas, heatmapMatrix, matrix, hiddenCategories])

  // draw on mount + data change
  useEffect(() => { draw() }, [draw])

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [draw])

  // hover
  const onMouseMove = useCallback((e) => {
    const canvas  = canvasRef.current
    const tooltip = tooltipRef.current
    if (!canvas || !tooltip || !dataRef.current) return

    const rect = canvas.getBoundingClientRect()
    const mx   = e.clientX - rect.left
    const my   = e.clientY - rect.top
    const { areas, colW, W, maxCount, matrix } = dataRef.current

    const ri = Math.floor((my - HEADER_H) / ROW_H)
    const ci = Math.floor((mx - LABEL_W)  / colW)

    if (ri < 0 || ri >= areas.length || ci < 0 || ci >= CATEGORIES.length || mx < LABEL_W) {
      tooltip.classList.remove('visible')
      return
    }

    const area     = areas[ri]
    const cat      = CATEGORIES[ci]
    const count    = matrix[area]?.[cat] || 0
    const areaTotal = Object.values(matrix[area] || {}).reduce((s,v)=>s+v,0)
    const catTotal  = issues.filter(i => i.category === cat).length
    const pctCat    = catTotal  > 0 ? Math.round((count / catTotal)  * 100) : 0
    const pctArea   = areaTotal > 0 ? Math.round((count / areaTotal) * 100) : 0

    tooltip.innerHTML = `
      <strong>${area}</strong><br/>
      Category: ${cat}<br/>
      Count: ${count} issue${count !== 1 ? 's' : ''}<br/>
      ${pctCat}% of all ${cat} issues<br/>
      ${pctArea}% of issues in this area
    `

    // highlight cell
    draw()
    const dpr = DPR()
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const cx = LABEL_W + ci * colW
    const cy = HEADER_H + ri * ROW_H
    ctx.strokeStyle = '#4A78E0'
    ctx.lineWidth   = 2
    ctx.strokeRect(cx + 1, cy + 1, colW - 2, ROW_H - 2)

    // position tooltip
    const tx = Math.min(e.clientX - rect.left + 12, W - 200)
    const ty = e.clientY - rect.top + 12
    tooltip.style.left    = tx + 'px'
    tooltip.style.top     = ty + 'px'
    tooltip.classList.add('visible')
  }, [draw, issues])

  const onMouseLeave = useCallback(() => {
    tooltipRef.current?.classList.remove('visible')
    draw()
  }, [draw])

  if (areas.length < 2) return null

  return (
    <div className="chart-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} />
      <div ref={tooltipRef} className="area-tooltip" />
    </div>
  )
}
