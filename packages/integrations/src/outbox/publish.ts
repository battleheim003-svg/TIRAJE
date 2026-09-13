import { db, type Prisma } from "@tirajeh/database"

export type PrismaTx = Parameters<Parameters<typeof db.$transaction>[0]>[0]


export interface OutboxEnqueueParams {
  event: string
  channel: string
  payload: Record<string, unknown>
  runAfter?: Date // پیشفرض: now
}

/**
 * باید داخل همان تراکنش دامنه فراخوانی شود.
 * هرگز خارج از transaction مستقل صدا نزن.
 */
export async function enqueue(
  tx: PrismaTx,
  params: OutboxEnqueueParams
): Promise<void> {
  await tx.outbox.create({
    data: {
      event: params.event,
      channel: params.channel,
      payload: params.payload as Prisma.InputJsonValue,
      status: "PENDING",
      runAfter: params.runAfter ?? new Date(),
    },
  })
}
