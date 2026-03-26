import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import * as svc from './comments.service.js'

const issueRouter = Router({ mergeParams: true })

issueRouter.get('/', async (req, res, next) => {
  try { res.json(await svc.getComments(req.params.id)) } catch (e) { next(e) }
})

issueRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { text, parentId } = z.object({ text: z.string().min(1).max(500), parentId: z.string().uuid().optional() }).parse(req.body)
    const comment = await svc.addComment(req.params.id, req.user!.sub, text, parentId)
    res.status(201).json(comment)
  } catch (e) { next(e) }
})

// standalone DELETE /comments/:id
const commentRouter = Router()
commentRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await svc.deleteComment(req.params.id, req.user!.sub, req.user!.role === 'ADMIN')
    if (!result) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comment not found' } }); return }
    res.status(204).send()
  } catch (e) { next(e) }
})

export { issueRouter as issueCommentsRouter, commentRouter }
