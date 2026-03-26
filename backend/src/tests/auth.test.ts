import { describe, it, expect } from 'vitest'
import { trigramSimilarity } from '../utils/trigram.js'
import { normalizeLocation } from '../utils/normalizeLocation.js'

describe('trigramSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(trigramSimilarity('pothole on main street', 'pothole on main street')).toBe(1)
  })
  it('returns 0 for completely different strings', () => {
    expect(trigramSimilarity('abc', 'xyz')).toBe(0)
  })
  it('detects near-duplicates above 0.75', () => {
    const sim = trigramSimilarity('Large pothole on Main Street', 'Large pothole on Main St')
    expect(sim).toBeGreaterThan(0.5)
  })
})

describe('normalizeLocation', () => {
  it('lowercases and replaces spaces', () => {
    expect(normalizeLocation('  Main Street  ')).toBe('main_street')
  })
  it('strips special chars', () => {
    expect(normalizeLocation('Sector 7, Block-B')).toBe('sector_7_blockb')
  })
})
