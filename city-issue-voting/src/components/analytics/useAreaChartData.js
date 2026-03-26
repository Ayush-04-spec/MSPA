export const CATEGORIES = ['ROAD', 'WATER', 'ELECTRICITY', 'SANITATION', 'PARKS', 'SAFETY', 'OTHER']

export const CAT_COLORS = {
  ROAD:        '#4A78E0',
  WATER:       '#2563eb',
  ELECTRICITY: '#f59e0b',
  SANITATION:  '#22c55e',
  PARKS:       '#0891b2',
  SAFETY:      '#ef4444',
  OTHER:       '#5A6473',
}

function normalizeArea(loc) {
  return loc.trim().replace(/\b\w/g, c => c.toUpperCase())
}

export default function useAreaChartData(issues, hiddenCategories = new Set()) {
  // build area → category → count map
  const matrix = {}
  issues.forEach(issue => {
    const area = normalizeArea(issue.location || 'Unknown')
    const cat  = issue.category || 'Other'
    if (!matrix[area]) matrix[area] = {}
    matrix[area][cat] = (matrix[area][cat] || 0) + 1
  })

  // sort areas by total desc, max 10
  const areas = Object.entries(matrix)
    .map(([area, cats]) => ({ area, total: Object.values(cats).reduce((s, v) => s + v, 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(a => a.area)

  const visibleCats = CATEGORIES.filter(c => !hiddenCategories.has(c))

  // heatmap matrix: areas × categories 2D array
  const heatmapMatrix = areas.map(area =>
    CATEGORIES.map(cat => (matrix[area]?.[cat] || 0))
  )

  // bubble data
  const bubbleData = []
  areas.forEach((area, ai) => {
    visibleCats.forEach((cat, ci) => {
      const count = matrix[area]?.[cat] || 0
      if (count > 0) bubbleData.push({ area, category: cat, count, areaIdx: ai, catIdx: ci })
    })
  })

  // stacked bar data
  const stackedData = areas.map(area => {
    const total = visibleCats.reduce((s, cat) => s + (matrix[area]?.[cat] || 0), 0)
    const segments = visibleCats.map(cat => {
      const count = matrix[area]?.[cat] || 0
      return { category: cat, count, pct: total > 0 ? (count / total) * 100 : 0 }
    })
    return { area, total, segments }
  })

  return { areas, categories: CATEGORIES, visibleCats, heatmapMatrix, bubbleData, stackedData, matrix }
}
