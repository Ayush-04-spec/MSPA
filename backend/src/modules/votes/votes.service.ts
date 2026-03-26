import { prisma } from '../../config/db.js'
import { redis } from '../../config/redis.js'
import { broadcaster } from '../../websocket/broadcaster.js'

export async function castVote(issueId: string, userId: string, value: 0 | 1 | -1) {
  if (value === 0) {
    await prisma.vote.deleteMany({ where: { issueId, userId } })
  } else {
    await prisma.vote.upsert({
      where:  { issueId_userId: { issueId, userId } },
      update: { value },
      create: { issueId, userId, value },
    })
  }

  // recompute voteScore
  const agg = await prisma.vote.aggregate({ where: { issueId }, _sum: { value: true } })
  const voteScore = agg._sum.value ?? 0
  await prisma.issue.update({ where: { id: issueId }, data: { voteScore } })
  await redis.set(`issue:score:${issueId}`, voteScore)

  broadcaster.broadcast(`issue:${issueId}`, { event: 'vote:updated', issueId, voteScore })
  return voteScore
}
