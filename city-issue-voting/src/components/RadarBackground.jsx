import { motion } from 'framer-motion'

const CIRCLE_COUNT = 8

export default function RadarBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      pointerEvents: 'none', overflow: 'hidden',
      background: '#121212',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Radial blue glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '60vw', height: '60vw',
        maxWidth: 700, maxHeight: 700,
        background: 'radial-gradient(circle, rgba(74,120,224,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Radar */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <style>{`
          @keyframes radar-spin {
            from { transform: rotate(20deg); }
            to   { transform: rotate(380deg); }
          }
          .radar-sweep {
            animation: radar-spin 10s linear infinite;
            transform-origin: right center;
            position: absolute;
            right: 50%; top: 50%;
            height: 5px; width: 400px;
            display: flex; align-items: flex-end;
            justify-content: center;
            overflow: hidden;
            background: transparent;
            z-index: 40;
          }
          .radar-sweep-line {
            position: relative; z-index: 40;
            height: 1px; width: 100%;
            background: linear-gradient(to right, transparent, rgba(74,120,224,0.8), transparent);
          }
        `}</style>

        {/* Sweep line */}
        <div className="radar-sweep">
          <div className="radar-sweep-line" />
        </div>

        {/* Concentric circles */}
        {Array.from({ length: CIRCLE_COUNT }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width:  `${(i + 1) * 5}rem`,
              height: `${(i + 1) * 5}rem`,
              borderRadius: '50%',
              border: `1px solid rgba(74,120,224,${Math.max(0.04, 0.35 - i * 0.04)})`,
            }}
          />
        ))}
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
        background: 'linear-gradient(to top, #121212, transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
