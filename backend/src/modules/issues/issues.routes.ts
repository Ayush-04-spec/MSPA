import { Router } from 'express'
import * as ctrl from './issues.controller.js'
import { requireAuth } from '../../middleware/auth.js'
import { createIssueLimiter, flagLimiter } from '../../middleware/rateLimiter.js'

const router = Router()

router.get('/',         ctrl.list)
router.get('/nearby',   ctrl.nearby)
router.get('/:id',      ctrl.getOne)
router.post('/',        requireAuth, createIssueLimiter, ctrl.create)
router.patch('/:id',    requireAuth, ctrl.update)
router.delete('/:id',   requireAuth, ctrl.remove)
router.post('/:id/flag',requireAuth, flagLimiter, ctrl.flag)

export default router
