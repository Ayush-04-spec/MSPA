import { Router } from 'express'
import { prisma } from '../../config/db.js'
import { redis } from '../../config/redis.js'

const router = Router()
const CACHE_KEY = 'leaderboard:top'
const TTL = 60

router.get('/', async (_req, res, next) => {
  try {
    const cached = await redis.get(CACHE_KEY)
    if (cached) { res.json(JSON.parse(cached)); return }

    const scores = await prisma.mlaScore.findMany({
      orderBy: [{ resolvedCount: 'desc' }, { impactPoints: 'desc' }],
      take: 20,
    })

    const mlaIds = scores.map(s => s.mlaId)
    const users  = await prisma.user.findMany({ where: { id: { in: mlaIds } }, select: { id: true, name: true } })
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

    const result = scores.map((s, i) => ({
      rank:         i + 1,
      mlaId:        s.mlaId,
      name:         userMap[s.mlaId] ?? 'Unknown',
      resolvedCount: s.resolvedCount,
      impactPoints:  s.impactPoints,
    }))

    await redis.setex(CACHE_KEY, TTL, JSON.stringify(result))
    res.json(result)
  } catch (e) { next(e) }
})

export default router
