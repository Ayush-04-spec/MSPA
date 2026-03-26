import { prisma } from '../../config/db.js'
import { signAccessToken, createRefreshToken } from './tokens.js'
import { env } from '../../config/env.js'
import { OAuth2Client } from 'google-auth-library'
import twilio from 'twilio'
import crypto from 'crypto'

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

export async function registerWithEmail(email: string, password: string, name: string) {
  const { createHash } = await import('crypto')
  const bcrypt = await import('bcryptjs').catch(() => null)
  if (!bcrypt) throw new Error('bcryptjs not installed')
  const passwordHash = await bcrypt.default.hash(password, 12)
  const user = await prisma.user.create({ data: { email, passwordHash, name } })
  const accessToken  = signAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)
  return { user, accessToken, refreshToken }
}

export async function loginWithEmail(email: string, password: string) {
  const bcrypt = await import('bcryptjs').catch(() => null)
  if (!bcrypt) throw new Error('bcryptjs not installed')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.passwordHash) return null
  const valid = await bcrypt.default.compare(password, user.passwordHash)
  if (!valid) return null
  const accessToken  = signAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)
  return { user, accessToken, refreshToken }
}

export async function loginWithGoogle(idToken: string) {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
  const payload = ticket.getPayload()
  if (!payload?.sub) throw new Error('Invalid Google token')
  const user = await prisma.user.upsert({
    where:  { googleId: payload.sub },
    update: { name: payload.name ?? 'User' },
    create: { googleId: payload.sub, email: payload.email, name: payload.name ?? 'User' },
  })
  const accessToken  = signAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)
  return { user, accessToken, refreshToken }
}

export async function sendOtp(phone: string) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio not configured')
  }
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  await client.verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID).verifications.create({
    to: phone, channel: 'sms',
  })
}

export async function verifyOtp(phone: string, code: string) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio not configured')
  }
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  const check = await client.verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({
    to: phone, code,
  })
  if (check.status !== 'approved') return null
  const user = await prisma.user.upsert({
    where:  { phone },
    update: {},
    create: { phone, name: 'Citizen' },
  })
  const accessToken  = signAccessToken(user.id, user.role)
  const refreshToken = await createRefreshToken(user.id)
  return { user, accessToken, refreshToken }
}
