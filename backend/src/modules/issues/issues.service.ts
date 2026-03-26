import { prisma } from '../../config/db.js'
import { Category, IssueStatus, Prisma } from '@prisma/client'
import { buildCursorPage } from '../../utils/pagination.js'
import { notificationsQueue, mlQueue } from '../../jobs/queues.js'
import { broadcaster } from '../../websocket/broadcaster.js'
import { normalizeLocation } from '../../utils/normalizeLocation.js'

export interface ListIssuesQuery {
  cursor?: string
  limit?: number
  status?: IssueStatus
  sort?: 'votes' | 'newest' | 'priority'
  category?: Category
  tag?: string
  ward?: string
}

export async function listIssues(query: ListIssuesQuery) {
  const limit = Math.min(query.limit ?? 20, 100)
  const where: Prisma.IssueWhereInput = {
    deletedAt: null,
    ...(query.status   && { status: query.status }),
    ...(query.category && { category: query.category }),
    ...(query.tag      && { tags: { has: query.tag } }),
    ...(query.ward     && { location: { contains: query.ward, mode: 'insensitive' } }),
    ...(query.cursor   && { id: { lt: query.cursor } }),
  }
  const orderBy: Prisma.IssueOrderByWithRelationInput =
    query.sort === 'newest'   ? { createdAt: 'desc' } :
    query.sort === 'priority' ? { priorityScore: 'desc' } :
                                { voteScore: 'desc' }

  const [items, total] = await Promise.all([
    prisma.issue.findMany({ where, orderBy, take: limit + 1, include: { author: { select: { id: true, name: true } } } }),
    prisma.issue.count({ where }),
  ])
  return buildCursorPage(items, limit, total)
}

export async function getIssue(id: string) {
  return prisma.issue.findFirst({
    where: { id, deletedAt: null },
    include: {
      author:        { select: { id: true, name: true } },
      comments:      { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      _count:        { select: { votes: true } },
    },
  })
}

export async function createIssue(data: {
  title: string; description?: string; location: string
  lat?: number; lng?: number; category: Category
  tags: string[]; images: string[]; authorId: string
}) {
  const issue = await prisma.issue.create({ data })
  await mlQueue.add('priorityScore', { issueId: issue.id })
  await mlQueue.add('duplicateScore', { issueId: issue.id })
  broadcaster.broadcast(`ward:${normalizeLocation(issue.location)}`, { event: 'issue:created', issue })
  return issue
}

export async function updateIssue(id: string, authorId: string, data: { title?: string; description?: string; tags?: string[] }) {
  const issue = await prisma.issue.findFirst({ where: { id, authorId, deletedAt: null } })
  if (!issue) return null
  return prisma.issue.update({ where: { id }, data })
}

export async function deleteIssue(id: string, userId: string, isAdmin: boolean) {
  const issue = await prisma.issue.findFirst({ where: { id, deletedAt: null } })
  if (!issue) return null
  if (!isAdmin && issue.authorId !== userId) return null
  return prisma.issue.update({ where: { id }, data: { deletedAt: new Date() } })
}

export async function flagIssue(issueId: string, flaggedBy: string, reason: string) {
  const flag = await prisma.flaggedIssue.upsert({
    where:  { issueId },
    update: { reason, flaggedBy, reviewed: false },
    create: { issueId, reason, flaggedBy },
  })
  broadcaster.broadcast('admin', { event: 'flag:raised', issueId, reason })
  return flag
}

export interface NearbyQuery { lat: number; lng: number; radius: number; status?: IssueStatus }

export async function getNearbyIssues(query: NearbyQuery) {
  type NearbyRow = { id: string; title: string; location: string; category: string; status: string; voteScore: number; distance_metres: number }
  const rows = await prisma.$queryRaw<NearbyRow[]>`
    SELECT id, title, location, category, status, "voteScore",
           ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography) AS distance_metres
    FROM "Issue"
    WHERE geom IS NOT NULL
      AND "deletedAt" IS NULL
      ${query.status ? Prisma.sql`AND status = ${query.status}::"IssueStatus"` : Prisma.empty}
      AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography, ${query.radius})
    ORDER BY distance_metres ASC
    LIMIT 50
  `
  return rows
}
