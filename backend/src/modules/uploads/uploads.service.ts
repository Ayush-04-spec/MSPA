import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2 } from '../../config/storage.js'
import { env } from '../../config/env.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export async function presignUpload(userId: string, filename: string, mimeType: string, size: number) {
  if (!ALLOWED_TYPES.includes(mimeType)) throw Object.assign(new Error('Invalid file type'), { status: 422 })
  if (size > MAX_SIZE) throw Object.assign(new Error('File too large (max 5MB)'), { status: 422 })

  const ext = path.extname(filename).toLowerCase() || '.jpg'
  const objectKey = `${userId}/${uuidv4()}${ext}`

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: mimeType,
    ContentLength: size,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 })
  const publicUrl = `${env.R2_PUBLIC_URL}/${objectKey}`

  return { uploadUrl, objectKey, publicUrl }
}

export async function deleteObject(userId: string, key: string) {
  if (!key.startsWith(`${userId}/`)) throw Object.assign(new Error('Forbidden'), { status: 403 })
  await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }))
}
