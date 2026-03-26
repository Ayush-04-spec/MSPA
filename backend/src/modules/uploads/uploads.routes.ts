import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import * as svc from './uploads.service.js'

const router = Router()

router.post('/presign', requireAuth, async (req, res, next) => {
  try {
    const { filename, mimeType, size } = z.object({
      filename: z.string().min(1),
      mimeType: z.string(),
      size:     z.number().int().positive(),
    }).parse(req.body)
    const result = await svc.presignUpload(req.user!.sub, filename, mimeType, size)
    res.json(result)
  } catch (e) { next(e) }
})

router.delete('/:key', requireAuth, async (req, res, next) => {
  try {
    // key may contain slashes (userId/uuid.ext) — reconstruct from full path
    const key = req.path.slice(1) // strip leading /
    await svc.deleteObject(req.user!.sub, key)
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
