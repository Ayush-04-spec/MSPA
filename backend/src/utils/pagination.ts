export interface CursorPage<T> {
  data: T[]
  nextCursor: string | null
  total: number
}

export function buildCursorPage<T extends { id: string }>(
  items: T[],
  limit: number,
  total: number
): CursorPage<T> {
  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, limit) : items
  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    total,
  }
}
