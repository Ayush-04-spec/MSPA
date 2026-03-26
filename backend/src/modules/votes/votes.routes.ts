import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { castVote } from './votes.service.js'
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../../config/redis.js'

const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 60,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'anon',
  store: new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) as Promise<number>, prefix: 'rl:vote:' }),
  message: { error: { code: 'RATE_LIMITED', message: 'Vote limit reached' } },
})

const router = Router({ mergeParams: true })

router.post('/', requireAuth, voteLimiter, async (req, res, next) => {
  try {
    const { value } = z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) }).parse(req.body)
    const voteScore = await castVote(req.params.id, req.user!.sub, value)
    res.json({ voteScore })
  } catch (e) { next(e) }
})

export default router
