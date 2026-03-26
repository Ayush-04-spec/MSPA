import { prisma } from '../../config/db.js'
import { IssueStatus, Role } from '@prisma/client'
import { redis } from '../../config/redis.js'
import { notificationsQueue } from '../../jobs/queues.js'
import { broadcaster } from '../../websocket/broadcaster.js'
import { normalizeLocation } from '../../utils/normalizeLocation.js'

const STATUS_ORDER: IssueStatus[] = ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED']

export async function changeIssueStatus(
  issueId: string, adminId: string,
  newStatus: IssueStatus, mlaId?: string, note?: string
) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) throw Object.assign(new Error('Issue not found'), { status: 404 })

  const fromIdx = STATUS_ORDER.indexOf(issue.status)
  const toIdx   = STATUS_ORDER.indexOf(newStatus)
  if (toIdx < fromIdx && toIdx < 1) {
    throw Object.assign(new Error('Invalid status transition'), { status: 422 })
  }

  await prisma.statusEvent.create({ data: { issueId, from: issue.status, to: newStatus, changedBy: adminId, mlaId, note } })
  const updated = await prisma.issue.update({ where: { id: issueId }, data: { status: newStatus, resolvedById: mlaId ?? null } })

  if (newStatus === 'RESOLVED' && mlaId) {
    await prisma.mlaScore.upsert({
      where:  { mlaId },
      update: { resolvedCount: { increment: 1 }, impactPoints: { increment: issue.voteScore } },
      create: { mlaId, resolvedCount: 1, impactPoints: issue.voteScore },
    })
    await redis.del('leaderboard:top')
  }

  // notify author + voters
  const voters = await prisma.vote.findMany({ where: { issueId }, include: { user: true } })
  const author = await prisma.user.findUnique({ where: { id: issue.authorId } })
  const notifyUsers = [author, ...voters.map(v => v.user)].filter(Boolean)

  for (const user of notifyUsers) {
    if (user?.email) {
      await notificationsQueue.add('email', {
        to: user.email,
        subject: `Issue status: ${newStatus}`,
        text: `Issue "${issue.title}" is now ${newStatus}`,
        html: `<p>Issue <strong>${issue.title}</strong> is now <strong>${newStatus}</strong></p>`,
      })
    }
    if (user?.fcmToken) {
      await notificationsQueue.add('push', {
        token: user.fcmToken,
        title: 'Issue Update',
        body: `"${issue.title}" is now ${newStatus}`,
        data: { issueId, url: `/issues/${issueId}` },
      })
    }
  }

  broadcaster.broadcast(`issue:${issueId}`, { event: 'status:changed', issueId, status: newStatus })
  broadcaster.broadcast(`ward:${normalizeLocation(issue.location)}`, { event: 'status:changed', issueId, status: newStatus })

  return updated
}

export async function getFlags(page = 1) {
  return prisma.flaggedIssue.findMany({
    where: { reviewed: false },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * 20,
    take: 20,
  })
}

export async function dismissFlag(id: string) {
  return prisma.flaggedIssue.update({ where: { id }, data: { reviewed: true } })
}

export async function removeFlag(id: string) {
  const flag = await prisma.flaggedIssue.update({ where: { id }, data: { reviewed: true } })
  await prisma.issue.update({ where: { id: flag.issueId }, data: { deletedAt: new Date() } })
  return flag
}

export async function listUsers(page = 1) {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * 20,
    take: 20,
  })
}

export async function setUserRole(userId: string, role: Role) {
  return prisma.user.update({ where: { id: userId }, data: { role } })
}
