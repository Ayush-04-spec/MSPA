import { useRef, useEffect, useState } from 'react'

export default function GooeyTabs({ tabs, activeTab, onChange }) {
  const tabRefs = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const idx = tabs.findIndex(t => t.key === activeTab)
    const el  = tabRefs.current[idx]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab, tabs])

  return (
    <div className="tabs">
      <div className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
      {tabs.map((t, i) => (
        <button
          key={t.key}
          ref={el => tabRefs.current[i] = el}
          className={`tab ${activeTab === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
