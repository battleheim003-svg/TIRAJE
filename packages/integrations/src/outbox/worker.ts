import { db } from "@tirajeh/database"
import { channelHandlers } from "./handlers"

export interface DrainOutboxResult {
  processed: number
  failed: number
  dead: number
}

interface RawOutboxRow {
  id: string
  event: string
  channel: string
  payload: Record<string, unknown>
  status: string
  attempts: number
  run_after?: Date
  runAfter?: Date
  last_error?: string | null
  lastError?: string | null
  sent_at?: Date | null
  sentAt?: Date | null
  created_at?: Date
  createdAt?: Date
}

export async function drainOutbox(limit = 25): Promise<DrainOutboxResult> {
  const now = new Date()
  let processed = 0
  let failed = 0
  let dead = 0

  // 1. SELECT + UPDATE status='PROCESSING' using PostgreSQL FOR UPDATE SKIP LOCKED
  const selectedRows = await db.$queryRaw<RawOutboxRow[]>`
    UPDATE outbox
    SET status = 'PROCESSING'
    WHERE id IN (
      SELECT id FROM outbox
      WHERE status IN ('PENDING', 'FAILED') AND run_after <= ${now}
      ORDER BY run_after ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `

  if (!selectedRows || selectedRows.length === 0) {
    return { processed: 0, failed: 0, dead: 0 }
  }

  for (const row of selectedRows) {
    const handler = channelHandlers[row.channel]

    if (!handler) {
      console.error(`[outbox:worker] No handler for channel: ${row.channel} (id: ${row.id})`)
      await db.outbox.update({
        where: { id: row.id },
        data: {
          status: "DEAD",
          lastError: `Unknown channel: ${row.channel}`,
        },
      })
      dead++
      continue
    }

    try {
      await handler(row.payload as Record<string, unknown>)

      // Succeeded
      await db.outbox.update({
        where: { id: row.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      })
      processed++
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const newAttempts = row.attempts + 1

      // Check Telegram 429 Too Many Requests retry_after
      let retryAfterSec: number | null = null
      const tg429Match = errorMsg.match(/retry after (\d+)/i)
      if (tg429Match?.[1]) {
        retryAfterSec = parseInt(tg429Match[1], 10)
      } else if ((err as { parameters?: { retry_after?: number } })?.parameters?.retry_after) {
        retryAfterSec = (err as { parameters: { retry_after: number } }).parameters.retry_after
      }

      if (newAttempts >= 5) {
        // Mark DEAD
        await db.outbox.update({
          where: { id: row.id },
          data: {
            attempts: newAttempts,
            status: "DEAD",
            lastError: errorMsg,
          },
        })
        dead++
      } else {
        // Exponential backoff: 2^attempts minutes (capped at 32 mins) unless 429 specified seconds
        const delayMs =
          retryAfterSec !== null
            ? retryAfterSec * 1000
            : Math.min(Math.pow(2, newAttempts), 32) * 60 * 1000

        const nextRun = new Date(Date.now() + delayMs)

        await db.outbox.update({
          where: { id: row.id },
          data: {
            attempts: newAttempts,
            status: "FAILED",
            runAfter: nextRun,
            lastError: errorMsg,
          },
        })
        failed++
      }
    }
  }

  return { processed, failed, dead }
}
