import { z } from "zod"

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  SITE_URL: z.string().url(),
  // Storage
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_PUBLIC_URL: z.string().url(),
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  TELEGRAM_CHANNEL_ID: z.string().min(1),
  TELEGRAM_ADMIN_CHAT_ID: z.string().min(1),
  // Payment
  ZARINPAL_MERCHANT_ID: z.string().length(36),
  // Email
  RESEND_API_KEY: z.string().startsWith("re_"),
  FROM_EMAIL: z.string().email().optional(),
  // Cron
  CRON_SECRET: z.string().min(32),
  // Optional
  REDIS_URL: z.string().url().optional(),
  TELEGRAM_API_ROOT: z.string().url().optional(),
  ZARINPAL_SANDBOX: z.enum(["true", "false"]).optional(),
})

export function assertServerEnv(): void {
  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    const msg = `Missing or invalid environment variables:\n${result.error.issues.map(i => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg)
    } else {
      console.warn(`[env] ${msg}`)
    }
  }
}
