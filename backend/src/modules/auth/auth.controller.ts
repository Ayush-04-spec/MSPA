import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from './auth.service.js'
import { rotateRefreshToken, revokeRefreshToken } from './tokens.js'
import { prisma } from '../../config/db.js'

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) })
const loginSchema    = z.object({ email: z.string().email(), password: z.string() })
const googleSchema   = z.object({ idToken: z.string() })
const otpSendSchema  = z.object({ phone: z.string().min(10) })
const otpVerifySchema= z.object({ phone: z.string(), code: z.string().length(6) })

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = registerSchema.parse(req.body)
    const result = await authService.registerWithEmail(email, password, name)
    setRefreshCookie(res, result.refreshToken)
    res.status(201).json({ accessToken: result.accessToken, user: { id: result.user.id, name: result.user.name, role: result.user.role } })
  } catch (e) { next(e) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const result = await authService.loginWithEmail(email, password)
    if (!result) { res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }); return }
    setRefreshCookie(res, result.refreshToken)
    res.json({ accessToken: result.accessToken, user: { id: result.user.id, name: result.user.name, role: result.user.role } })
  } catch (e) { next(e) }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined
    if (!token) { res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'No refresh token' } }); return }
    const result = await rotateRefreshToken(token)
    if (!result) { res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid refresh token' } }); return }
    setRefreshCookie(res, result.refreshToken)
    res.json({ accessToken: result.accessToken })
  } catch (e) { next(e) }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined
    if (token) await revokeRefreshToken(token)
    res.clearCookie('refreshToken')
    res.status(204).send()
  } catch (e) { next(e) }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = googleSchema.parse(req.body)
    const result = await authService.loginWithGoogle(idToken)
    setRefreshCookie(res, result.refreshToken)
    res.json({ accessToken: result.accessToken, user: { id: result.user.id, name: result.user.name, role: result.user.role } })
  } catch (e) { next(e) }
}

export async function otpSend(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = otpSendSchema.parse(req.body)
    await authService.sendOtp(phone)
    res.json({ message: 'OTP sent' })
  } catch (e) { next(e) }
}

export async function otpVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, code } = otpVerifySchema.parse(req.body)
    const result = await authService.verifyOtp(phone, code)
    if (!result) { res.status(401).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' } }); return }
    setRefreshCookie(res, result.refreshToken)
    res.json({ accessToken: result.accessToken, user: { id: result.user.id, name: result.user.name, role: result.user.role } })
  } catch (e) { next(e) }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } })
    if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return }
    res.json(user)
  } catch (e) { next(e) }
}
