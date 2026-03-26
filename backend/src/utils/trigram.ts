/** Pure TypeScript trigram similarity (Jaccard on trigram sets) */
function trigrams(s: string): Set<string> {
  const padded = `  ${s.toLowerCase()}  `
  const result = new Set<string>()
  for (let i = 0; i < padded.length - 2; i++) {
    result.add(padded.slice(i, i + 3))
  }
  return result
}

export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a)
  const tb = trigrams(b)
  let intersection = 0
  ta.forEach(t => { if (tb.has(t)) intersection++ })
  const union = ta.size + tb.size - intersection
  return union === 0 ? 0 : intersection / union
}
