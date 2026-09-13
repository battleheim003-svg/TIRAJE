import { describe, it, expect, vi, beforeEach } from "vitest"
import { enqueue, type PrismaTx } from "../outbox/publish"
import { drainOutbox } from "../outbox/worker"
import { channelHandlers } from "../outbox/handlers"
import { db } from "@tirajeh/database"

const mockDb = vi.hoisted(() => ({
  outbox: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(mockDb)),
}))

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

describe("Outbox Pattern (T1.8)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("1. enqueue creates a PENDING row in the outbox table within domain transaction", async () => {
    const mockTx = {
      outbox: {
        create: vi.fn().mockResolvedValue({ id: "outbox-1" }),
      },
    }

    await enqueue(mockTx as unknown as PrismaTx, {
      event: "order.paid",
      channel: "tg_admin",
      payload: { orderNumber: "1001", amount: 500000 },
    })

    expect(mockTx.outbox.create).toHaveBeenCalledWith({
      data: {
        event: "order.paid",
        channel: "tg_admin",
        payload: { orderNumber: "1001", amount: 500000 },
        status: "PENDING",
        runAfter: expect.any(Date),
      },
    })
  })

  it("2. drainOutbox updates row to SENT when handler succeeds", async () => {
    const row = {
      id: "outbox-1",
      event: "test.event",
      channel: "mock_success_channel",
      payload: { hello: "world" },
      status: "PROCESSING",
      attempts: 0,
      run_after: new Date(Date.now() - 1000),
      last_error: null,
      sent_at: null,
      created_at: new Date(),
    }

    mockDb.$queryRaw.mockResolvedValueOnce([row])
    mockDb.outbox.update.mockResolvedValueOnce({ ...row, status: "SENT", sentAt: new Date() })

    const handlerSpy = vi.fn().mockResolvedValue(undefined)
    channelHandlers["mock_success_channel"] = handlerSpy

    const res = await drainOutbox(25)

    expect(handlerSpy).toHaveBeenCalledWith({ hello: "world" })
    expect(mockDb.outbox.update).toHaveBeenCalledWith({
      where: { id: "outbox-1" },
      data: {
        status: "SENT",
        sentAt: expect.any(Date),
      },
    })
    expect(res).toEqual({ processed: 1, failed: 0, dead: 0 })
  })

  it("3. handler failure increments attempts, marks FAILED, and sets future runAfter", async () => {
    const row = {
      id: "outbox-2",
      event: "order.paid",
      channel: "mock_fail_channel",
      payload: { orderNumber: "1002" },
      status: "PROCESSING",
      attempts: 1,
      run_after: new Date(Date.now() - 1000),
      last_error: null,
      sent_at: null,
      created_at: new Date(),
    }

    mockDb.$queryRaw.mockResolvedValueOnce([row])
    mockDb.outbox.update.mockResolvedValueOnce({ ...row, status: "FAILED", attempts: 2 })

    channelHandlers["mock_fail_channel"] = vi.fn().mockRejectedValue(new Error("Telegram network timeout"))

    const beforeCall = Date.now()
    const res = await drainOutbox(25)

    expect(mockDb.outbox.update).toHaveBeenCalledWith({
      where: { id: "outbox-2" },
      data: {
        attempts: 2,
        status: "FAILED",
        runAfter: expect.any(Date),
        lastError: "Telegram network timeout",
      },
    })

    const updateCall = mockDb.outbox.update.mock.calls[0][0]
    const scheduledRunAfter = updateCall.data.runAfter.getTime()
    // attempts = 2 => backoff: 2^2 = 4 minutes = 240,000ms
    expect(scheduledRunAfter).toBeGreaterThanOrEqual(beforeCall + 230_000)
    expect(res).toEqual({ processed: 0, failed: 1, dead: 0 })
  })

  it("4. after 5 failures marks row DEAD", async () => {
    const row = {
      id: "outbox-3",
      event: "order.paid",
      channel: "mock_dead_channel",
      payload: { orderNumber: "1003" },
      status: "PROCESSING",
      attempts: 4, // 4 previous attempts + 1 new = 5 => DEAD
      run_after: new Date(Date.now() - 1000),
      last_error: "Previous error",
      sent_at: null,
      created_at: new Date(),
    }

    mockDb.$queryRaw.mockResolvedValueOnce([row])
    mockDb.outbox.update.mockResolvedValueOnce({ ...row, status: "DEAD", attempts: 5 })

    channelHandlers["mock_dead_channel"] = vi.fn().mockRejectedValue(new Error("Permanent failure"))

    const res = await drainOutbox(25)

    expect(mockDb.outbox.update).toHaveBeenCalledWith({
      where: { id: "outbox-3" },
      data: {
        attempts: 5,
        status: "DEAD",
        lastError: "Permanent failure",
      },
    })
    expect(res).toEqual({ processed: 0, failed: 0, dead: 1 })
  })

  it("5. DEAD rows are never selected by query (FOR UPDATE only picks PENDING or FAILED with run_after <= now)", async () => {
    mockDb.$queryRaw.mockResolvedValueOnce([])

    const res = await drainOutbox(25)

    expect(res).toEqual({ processed: 0, failed: 0, dead: 0 })
    expect(mockDb.outbox.update).not.toHaveBeenCalled()
  })
})
