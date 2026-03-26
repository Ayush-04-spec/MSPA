import { CATEGORIES, CAT_COLORS } from './useAreaChartData'

export default function CategoryLegend({ hiddenCategories, onToggle }) {
  return (
    <div className="cat-legend">
      {CATEGORIES.map(cat => (
        <div
          key={cat}
          className={`legend-item ${hiddenCategories.has(cat) ? 'hidden' : ''}`}
          onClick={() => onToggle(cat)}
          title={hiddenCategories.has(cat) ? 'Click to show' : 'Click to hide'}
        >
          <span className="legend-swatch" style={{ background: CAT_COLORS[cat] }} />
          {cat}
        </div>
      ))}
    </div>
  )
}
