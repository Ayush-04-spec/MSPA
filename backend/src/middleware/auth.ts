import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { Role } from '@prisma/client'

export interface AuthPayload {
  sub: string
  role: Role
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing token' } })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } })
  }
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, () => {
      if (req.user?.role !== role) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } })
        return
      }
      next()
    })
  }
}
