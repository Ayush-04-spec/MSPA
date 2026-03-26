import { Worker } from 'bullmq'
import { redis } from '../config/redis.js'
import { sendEmail, sendPush, sendSms } from '../modules/notifications/notifications.service.js'
import { prisma } from '../config/db.js'
import { trigramSimilarity } from '../utils/trigram.js'

const connection = redis

// ── Notifications worker ──
export const notificationsWorker = new Worker('notifications', async (job) => {
  const { name, data } = job

  if (name === 'email') {
    await sendEmail(data.to, data.subject, data.html ?? data.text, data.text)
  } else if (name === 'push') {
    await sendPush(data.token, data.title, data.body, data.data ?? {})
  } else if (name === 'sms') {
    await sendSms(data.to, data.body)
  }
}, {
  connection,
  concurrency: 5,
})

notificationsWorker.on('failed', async (job, err) => {
  if (!job) return
  await prisma.failedNotification.create({ data: { jobData: job.data, error: err.message } })
})

// ── ML worker ──
export const mlWorker = new Worker('ml', async (job) => {
  if (job.name === 'duplicateScore') {
    const { issueId } = job.data as { issueId: string }
    const issue = await prisma.issue.findUnique({ where: { id: issueId } })
    if (!issue) return

    const candidates = await prisma.issue.findMany({
      where: { category: issue.category, status: 'OPEN', id: { not: issueId }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    for (const c of candidates) {
      const sim = trigramSimilarity(issue.title, c.title)
      if (sim > 0.75) {
        await prisma.issue.update({ where: { id: issueId }, data: { duplicateOf: c.id } })
        break
      }
    }
  }

  if (job.name === 'priorityScore') {
    const { issueId } = job.data as { issueId: string }
    const issue = await prisma.issue.findUnique({ where: { id: issueId } })
    if (!issue) return

    const categoryWeights: Record<string, number> = {
      ROAD: 1.2, WATER: 1.5, ELECTRICITY: 1.3,
      SANITATION: 1.4, PARKS: 0.8, SAFETY: 1.6, OTHER: 1.0,
    }
    const hoursSince = (Date.now() - issue.createdAt.getTime()) / 3_600_000
    const ageDecay   = Math.exp(-hoursSince / 72)
    const weight     = categoryWeights[issue.category] ?? 1.0
    const score      = issue.voteScore * 1.0 + ageDecay * -0.5 + weight

    await prisma.issue.update({ where: { id: issueId }, data: { priorityScore: score } })
  }
}, { connection })
