import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage, Server } from 'http'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { broadcaster } from './broadcaster.js'
import { AuthPayload } from '../middleware/auth.js'

interface AuthedSocket extends WebSocket {
  userId?: string
  role?: string
  authTimeout?: ReturnType<typeof setTimeout>
}

export function attachWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws: AuthedSocket, _req: IncomingMessage) => {
    // require auth within 5 seconds
    ws.authTimeout = setTimeout(() => {
      if (!ws.userId) ws.close(4001, 'Auth timeout')
    }, 5000)

    ws.on('message', (raw) => {
      let msg: { type: string; token?: string; room?: string }
      try { msg = JSON.parse(raw.toString()) } catch { return }

      if (msg.type === 'auth' && msg.token) {
        try {
          const payload = jwt.verify(msg.token, env.JWT_ACCESS_SECRET) as AuthPayload
          ws.userId = payload.sub
          ws.role   = payload.role
          clearTimeout(ws.authTimeout)
          ws.send(JSON.stringify({ type: 'auth:ok' }))
        } catch {
          ws.close(4002, 'Invalid token')
        }
        return
      }

      if (!ws.userId) return // not authed yet

      if (msg.type === 'subscribe' && msg.room) {
        // admin room restricted
        if (msg.room === 'admin' && ws.role !== 'ADMIN') return
        broadcaster.join(msg.room, ws)
        ws.send(JSON.stringify({ type: 'subscribed', room: msg.room }))
      }

      if (msg.type === 'unsubscribe' && msg.room) {
        broadcaster.leave(msg.room, ws)
      }
    })

    ws.on('close', () => {
      clearTimeout(ws.authTimeout)
      broadcaster.leaveAll(ws)
    })
  })

  return wss
}
