import { prisma } from '../../config/db.js'
import { broadcaster } from '../../websocket/broadcaster.js'
import { notificationsQueue } from '../../jobs/queues.js'

export async function getComments(issueId: string) {
  return prisma.comment.findMany({
    where: { issueId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true } } },
  })
}

export async function addComment(issueId: string, authorId: string, text: string, parentId?: string) {
  // enforce max depth 2
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } })
    if (!parent) throw Object.assign(new Error('Parent comment not found'), { status: 404 })
    if (parent.parentId) throw Object.assign(new Error('Max comment depth exceeded'), { status: 422 })
  }

  const comment = await prisma.comment.create({
    data: { issueId, authorId, text, parentId: parentId ?? null },
    include: { author: { select: { id: true, name: true } } },
  })

  broadcaster.broadcast(`issue:${issueId}`, { event: 'comment:added', issueId, comment })

  // notify parent comment author
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, include: { author: true } })
    if (parent?.author.email) {
      await notificationsQueue.add('email', {
        to: parent.author.email,
        subject: 'Someone replied to your comment',
        text: `${comment.author.name} replied: "${text}"`,
      })
    }
  }

  return comment
}

export async function deleteComment(id: string, userId: string, isAdmin: boolean) {
  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return null
  if (!isAdmin && comment.authorId !== userId) return null
  return prisma.comment.delete({ where: { id } })
}
