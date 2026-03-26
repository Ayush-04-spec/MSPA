import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { createServer } from 'http'
import { env } from './config/env.js'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { defaultLimiter } from './middleware/rateLimiter.js'
import { attachWebSocketServer } from './websocket/server.js'

import authRoutes        from './modules/auth/auth.routes.js'
import issueRoutes       from './modules/issues/issues.routes.js'
import voteRoutes        from './modules/votes/votes.routes.js'
import { issueCommentsRouter, commentRouter } from './modules/comments/comments.routes.js'
import uploadRoutes      from './modules/uploads/uploads.routes.js'
import adminRoutes       from './modules/admin/admin.routes.js'
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes.js'
import exportRoutes      from './modules/export/export.routes.js'

// start workers (same process in dev)
import './jobs/workers.js'

const app = express()

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(requestLogger)
app.use(defaultLimiter)

app.use('/auth',        authRoutes)
app.use('/issues',      issueRoutes)
app.use('/issues/:id/vote',     voteRoutes)
app.use('/issues/:id/comments', issueCommentsRouter)
app.use('/comments',    commentRouter)
app.use('/uploads',     uploadRoutes)
app.use('/admin',       adminRoutes)
app.use('/leaderboard', leaderboardRoutes)
app.use('/export',      exportRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

const httpServer = createServer(app)
attachWebSocketServer(httpServer)

httpServer.listen(env.PORT, () => {
  console.log(`🚀 CityVoice API running on port ${env.PORT}`)
})

export default app
