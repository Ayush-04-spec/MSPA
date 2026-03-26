import { Router } from 'express'
import { prisma } from '../../config/db.js'
import { exportLimiter } from '../../middleware/rateLimiter.js'

const router = Router()

router.get('/issues.geojson', exportLimiter, async (_req, res, next) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { deletedAt: null, lat: { not: null }, lng: { not: null } },
      include: { author: false },
    })
    const fc = {
      type: 'FeatureCollection',
      features: issues.map(i => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lng!, i.lat!] },
        properties: {
          id: i.id, title: i.title, category: i.category,
          status: i.status, voteScore: i.voteScore,
          createdAt: i.createdAt, updatedAt: i.updatedAt,
        },
      })),
    }
    res.setHeader('Content-Type', 'application/geo+json')
    res.json(fc)
  } catch (e) { next(e) }
})

router.get('/issues.csv', exportLimiter, async (_req, res, next) => {
  try {
    const issues = await prisma.issue.findMany({ where: { deletedAt: null } })
    const header = 'id,title,location,category,tags,status,voteScore,createdAt,updatedAt\n'
    const rows = issues.map(i =>
      [i.id, `"${i.title.replace(/"/g,'""')}"`, `"${i.location}"`, i.category,
       `"${i.tags.join(';')}"`, i.status, i.voteScore, i.createdAt.toISOString(), i.updatedAt.toISOString()
      ].join(',')
    ).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="cityvoice-issues.csv"')
    res.send(header + rows)
  } catch (e) { next(e) }
})

export default router
