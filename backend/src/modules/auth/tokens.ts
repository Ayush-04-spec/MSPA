import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../../config/env.js'
import { prisma } from '../../config/db.js'
import { Role } from '@prisma/client'

export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  })
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } })
  return token
}

export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const record = await prisma.refreshToken.findUnique({ where: { token: oldToken }, include: { user: true } })
  if (!record || record.expiresAt < new Date()) return null
  await prisma.refreshToken.delete({ where: { id: record.id } })
  const accessToken  = signAccessToken(record.userId, record.user.role)
  const refreshToken = await createRefreshToken(record.userId)
  return { accessToken, refreshToken }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } })
}
