import { Queue } from 'bullmq'
import { redis } from '../config/redis.js'

const connection = redis

export const notificationsQueue = new Queue('notifications', { connection })
export const mlQueue            = new Queue('ml', { connection, defaultJobOptions: { priority: 10 } })
