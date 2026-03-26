import { WebSocket } from 'ws'

class Broadcaster {
  private rooms = new Map<string, Set<WebSocket>>()

  join(room: string, ws: WebSocket) {
    if (!this.rooms.has(room)) this.rooms.set(room, new Set())
    this.rooms.get(room)!.add(ws)
  }

  leave(room: string, ws: WebSocket) {
    this.rooms.get(room)?.delete(ws)
  }

  leaveAll(ws: WebSocket) {
    this.rooms.forEach(set => set.delete(ws))
  }

  broadcast(room: string, payload: unknown) {
    const sockets = this.rooms.get(room)
    if (!sockets) return
    const msg = JSON.stringify(payload)
    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg)
      } else {
        sockets.delete(ws)
      }
    })
  }
}

export const broadcaster = new Broadcaster()
