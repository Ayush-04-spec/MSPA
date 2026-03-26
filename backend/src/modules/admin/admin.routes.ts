import { Router } from 'express'
import { z } from 'zod'
import { requireRole } from '../../middleware/auth.js'
import * as svc from './admin.service.js'
import { prisma } from '../../config/db.js'
import { IssueStatus, Role } from '@prisma/client'

const router = Router()
const adminOnly = requireRole('ADMIN')

router.get('/issues', adminOnly, async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1
    const issues = await prisma.issue.findMany({ orderBy: { createdAt: 'desc' }, skip: (page-1)*20, take: 20 })
    res.json(issues)
  } catch (e) { next(e) }
})

router.patch('/issues/:id/status', adminOnly, async (req, res, next) => {
  try {
    const { status, mlaId, note } = z.object({
      status: z.nativeEnum(IssueStatus),
      mlaId:  z.string().uuid().optional(),
      note:   z.string().max(500).optional(),
    }).parse(req.body)
    const updated = await svc.changeIssueStatus(req.params.id, req.user!.sub, status, mlaId, note)
    res.json(updated)
  } catch (e) { next(e) }
})

router.get('/flags', adminOnly, async (req, res, next) => {
  try { res.json(await svc.getFlags(Number(req.query.page) || 1)) } catch (e) { next(e) }
})

router.patch('/flags/:id/dismiss', adminOnly, async (req, res, next) => {
  try { res.json(await svc.dismissFlag(req.params.id)) } catch (e) { next(e) }
})

router.patch('/flags/:id/remove', adminOnly, async (req, res, next) => {
  try { res.json(await svc.removeFlag(req.params.id)) } catch (e) { next(e) }
})

router.get('/users', adminOnly, async (req, res, next) => {
  try { res.json(await svc.listUsers(Number(req.query.page) || 1)) } catch (e) { next(e) }
})

router.patch('/users/:id/role', adminOnly, async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.nativeEnum(Role) }).parse(req.body)
    res.json(await svc.setUserRole(req.params.id, role))
  } catch (e) { next(e) }
})

export default router
