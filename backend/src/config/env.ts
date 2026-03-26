import { z } from 'zod'

const schema = z.object({
  DATABASE_URL:              z.string().url(),
  REDIS_URL:                 z.string().url(),
  JWT_ACCESS_SECRET:         z.string().min(16),
  JWT_REFRESH_SECRET:        z.string().min(16),
  JWT_ACCESS_EXPIRY:         z.string().default('15m'),
  JWT_REFRESH_EXPIRY:        z.string().default('30d'),
  GOOGLE_CLIENT_ID:          z.string().optional(),
  GOOGLE_CLIENT_SECRET:      z.string().optional(),
  TWILIO_ACCOUNT_SID:        z.string().optional(),
  TWILIO_AUTH_TOKEN:         z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILIO_FROM_NUMBER:        z.string().optional(),
  SENDGRID_API_KEY:          z.string().optional(),
  EMAIL_FROM:                z.string().email().default('noreply@cityvoice.in'),
  FIREBASE_PROJECT_ID:       z.string().optional(),
  FIREBASE_PRIVATE_KEY:      z.string().optional(),
  FIREBASE_CLIENT_EMAIL:     z.string().optional(),
  R2_ACCOUNT_ID:             z.string().optional(),
  R2_ACCESS_KEY_ID:          z.string().optional(),
  R2_SECRET_ACCESS_KEY:      z.string().optional(),
  R2_BUCKET_NAME:            z.string().default('cityvoice-uploads'),
  R2_PUBLIC_URL:             z.string().url().optional(),
  FRONTEND_URL:              z.string().url().default('http://localhost:5173'),
  PORT:                      z.coerce.number().default(4000),
  NODE_ENV:                  z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
