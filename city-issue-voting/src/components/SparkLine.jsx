import { useEffect, useRef } from 'react'

export default function SparkLine({ data = [], color = '#4A78E0', width = 80, height = 28 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = width  * dpr
    canvas.height = height * dpr
    canvas.style.width  = width  + 'px'
    canvas.style.height = height + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const min = Math.min(...data)
    const max = Math.max(...data) || 1
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((v - min) / (max - min || 1)) * (height - 4) - 2,
    }))

    // fill
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, color + '44')
    grad.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, height)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // line
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.5
    ctx.shadowColor = color
    ctx.shadowBlur  = 4
    ctx.stroke()
  }, [data, color, width, height])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
