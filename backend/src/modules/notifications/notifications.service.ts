import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'
import admin from 'firebase-admin'

// ── Email ──
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: { user: 'apikey', pass: env.SENDGRID_API_KEY ?? '' },
})

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html, text })
}

// ── FCM ──
let fcmInitialized = false
function initFcm() {
  if (fcmInitialized || !env.FIREBASE_PROJECT_ID) return
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:    env.FIREBASE_PROJECT_ID,
      privateKey:   env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail:  env.FIREBASE_CLIENT_EMAIL,
    }),
  })
  fcmInitialized = true
}

export async function sendPush(fcmToken: string, title: string, body: string, data: Record<string, string>) {
  initFcm()
  await admin.messaging().send({ token: fcmToken, notification: { title, body }, data })
}

// ── SMS via Twilio ──
export async function sendSms(to: string, body: string) {
  if (!env.TWILIO_ACCOUNT_SID) return
  const twilio = (await import('twilio')).default
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  await client.messages.create({ to, from: env.TWILIO_FROM_NUMBER, body })
}

// ── Email templates ──
export function statusChangedEmail(issueTitle: string, oldStatus: string, newStatus: string, issueUrl: string) {
  const text = `Your issue "${issueTitle}" status changed from ${oldStatus} to ${newStatus}. View: ${issueUrl}`
  const html = `<p>Your issue <strong>${issueTitle}</strong> status changed from <em>${oldStatus}</em> to <strong>${newStatus}</strong>.</p><p><a href="${issueUrl}">View issue</a></p>`
  return { text, html, subject: `Issue Update: ${newStatus}` }
}

export function issueResolvedEmail(issueTitle: string, mlaName: string, issueUrl: string) {
  const text = `Great news! Your issue "${issueTitle}" has been resolved by ${mlaName}. View: ${issueUrl}`
  const html = `<p>Great news! Your issue <strong>${issueTitle}</strong> has been resolved by <strong>${mlaName}</strong>.</p><p><a href="${issueUrl}">View issue</a></p>`
  return { text, html, subject: 'Issue Resolved!' }
}

export function commentReplyEmail(issueTitle: string, commenterName: string, replyText: string, issueUrl: string) {
  const text = `${commenterName} replied to your comment on "${issueTitle}": "${replyText}". View: ${issueUrl}`
  const html = `<p><strong>${commenterName}</strong> replied to your comment on <em>${issueTitle}</em>:</p><blockquote>${replyText}</blockquote><p><a href="${issueUrl}">View issue</a></p>`
  return { text, html, subject: `New reply on "${issueTitle}"` }
}
