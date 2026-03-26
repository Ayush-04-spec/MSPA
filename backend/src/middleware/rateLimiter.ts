import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../config/redis.js'
import { Request } from 'express'

function makeStore(prefix: string) {
  return new RedisStore({ sendCommand: (...args: string[]) => redis.call(...args) as Promise<number>, prefix })
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: makeStore('rl:auth:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth requests' } },
})

export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  store: makeStore('rl:otp:'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many OTP requests' } },
})

export const createIssueLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => req.user?.sub ?? req.ip ?? 'anon',
  store: makeStore('rl:issue:create:'),
  message: { error: { code: 'RATE_LIMITED', message: 'Issue creation limit reached' } },
})

export const flagLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => req.user?.sub ?? req.ip ?? 'anon',
  store: makeStore('rl:flag:'),
  message: { error: { code: 'RATE_LIMITED', message: 'Flag limit reached' } },
})

export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: makeStore('rl:export:'),
  message: { error: { code: 'RATE_LIMITED', message: 'Export limit reached' } },
})

export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req: Request) => req.user?.sub ?? req.ip ?? 'anon',
  store: makeStore('rl:default:'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
})
