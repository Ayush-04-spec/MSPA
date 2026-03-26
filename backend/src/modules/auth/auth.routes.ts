import { Router } from 'express'
import * as ctrl from './auth.controller.js'
import { requireAuth } from '../../middleware/auth.js'
import { authLimiter, otpSendLimiter } from '../../middleware/rateLimiter.js'

const router = Router()

router.post('/register',    authLimiter, ctrl.register)
router.post('/login',       authLimiter, ctrl.login)
router.post('/refresh',     ctrl.refresh)
router.post('/logout',      ctrl.logout)
router.post('/google',      authLimiter, ctrl.googleAuth)
router.post('/otp/send',    otpSendLimiter, ctrl.otpSend)
router.post('/otp/verify',  authLimiter, ctrl.otpVerify)
router.get('/me',           requireAuth, ctrl.me)

export default router
