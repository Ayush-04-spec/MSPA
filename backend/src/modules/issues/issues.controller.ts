import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as svc from './issues.service.js'
import { Category, IssueStatus } from '@prisma/client'

const createSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location:    z.string().min(2).max(200),
  lat:         z.number().optional(),
  lng:         z.number().optional(),
  category:    z.nativeEnum(Category),
  tags:        z.array(z.string()).default([]),
  images:      z.array(z.string().url()).max(5).default([]),
})

const updateSchema = z.object({
  title:       z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  tags:        z.array(z.string()).optional(),
})

const listSchema = z.object({
  cursor:   z.string().uuid().optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  status:   z.nativeEnum(IssueStatus).optional(),
  sort:     z.enum(['votes', 'newest', 'priority']).default('votes'),
  category: z.nativeEnum(Category).optional(),
  tag:      z.string().optional(),
  ward:     z.string().optional(),
})

const nearbySchema = z.object({
  lat:    z.coerce.number(),
  lng:    z.coerce.number(),
  radius: z.coerce.number().min(100).max(50000).default(2000),
  status: z.nativeEnum(IssueStatus).optional(),
})

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listSchema.parse(req.query)
    res.json(await svc.listIssues(query))
  } catch (e) { next(e) }
}

export async function nearby(req: Request, res: Response, next: NextFunction) {
  try {
    const query = nearbySchema.parse(req.query)
    res.json(await svc.getNearbyIssues(query))
  } catch (e) { next(e) }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const issue = await svc.getIssue(req.params.id)
    if (!issue) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' } }); return }
    res.json(issue)
  } catch (e) { next(e) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)
    const issue = await svc.createIssue({ ...data, authorId: req.user!.sub })
    res.status(201).json(issue)
  } catch (e) { next(e) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body)
    const issue = await svc.updateIssue(req.params.id, req.user!.sub, data)
    if (!issue) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found or not yours' } }); return }
    res.json(issue)
  } catch (e) { next(e) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const issue = await svc.deleteIssue(req.params.id, req.user!.sub, req.user!.role === 'ADMIN')
    if (!issue) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' } }); return }
    res.status(204).send()
  } catch (e) { next(e) }
}

export async function flag(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = z.object({ reason: z.string().min(5).max(500) }).parse(req.body)
    await svc.flagIssue(req.params.id, req.user!.sub, reason)
    res.status(201).json({ message: 'Flagged' })
  } catch (e) { next(e) }
}
