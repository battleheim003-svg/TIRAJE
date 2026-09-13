import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      order: {
        findMany: vi.fn(),
      },
      quoteRequest: {
        findMany: vi.fn(),
      },
      contact: {
        findMany: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
      },
      $queryRaw: vi.fn(),
    },
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

import { getTodayTasks } from "../../lib/admin-today-tasks"

describe("T2.2 TodayQueue - getTodayTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty array if any db query throws error (safe fallback)", async () => {
    mockDb.order.findMany.mockRejectedValue(new Error("Database disconnected"))
    mockDb.quoteRequest.findMany.mockResolvedValue([])
    mockDb.contact.findMany.mockResolvedValue([])
    mockDb.product.findMany.mockResolvedValue([])
    mockDb.$queryRaw.mockResolvedValue([])

    const tasks = await getTodayTasks()
    expect(tasks).toEqual([])
  })

  it("flags order older than 4 hours as urgent priority", async () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
    mockDb.order.findMany.mockResolvedValue([
      {
        id: "ord-1",
        orderNumber: 1050,
        status: "PENDING",
        createdAt: fiveHoursAgo,
        shippingAddress: { city: "تهران" },
        shippingProvince: "تهران",
      },
    ])
    mockDb.quoteRequest.findMany.mockResolvedValue([])
    mockDb.contact.findMany.mockResolvedValue([])
    mockDb.product.findMany.mockResolvedValue([])
    mockDb.$queryRaw.mockResolvedValue([])

    const tasks = await getTodayTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.kind).toBe("order")
    expect(tasks[0]?.priority).toBe("urgent")
    expect(tasks[0]?.label).toContain("#1050")
    expect(tasks[0]?.subLabel).toContain("تهران")
    expect(tasks[0]?.href).toBe("/admin/orders/ord-1")
  })

  it("includes low stock product (stockQty <= lowStockThreshold) with warning priority", async () => {
    mockDb.order.findMany.mockResolvedValue([])
    mockDb.quoteRequest.findMany.mockResolvedValue([])
    mockDb.contact.findMany.mockResolvedValue([])
    mockDb.product.findMany.mockResolvedValue([])
    mockDb.$queryRaw.mockResolvedValue([
      {
        id: "prod-low",
        name_fa: "سیمان تیپ ۲ کیسه",
        slug: "cement-type-2-bag",
        stock_qty: 5,
        low_stock_threshold: 10,
      },
    ])

    const tasks = await getTodayTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.kind).toBe("stock")
    expect(tasks[0]?.priority).toBe("warning")
    expect(tasks[0]?.label).toContain("سیمان تیپ ۲ کیسه")
    expect(tasks[0]?.subLabel).toContain("۵")
    expect(tasks[0]?.href).toBe("/admin/products/prod-low")
  })

  it("sorts tasks by priority: urgent -> warning -> info", async () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000)

    mockDb.order.findMany.mockResolvedValue([
      {
        id: "ord-1",
        orderNumber: 1001,
        status: "PENDING",
        createdAt: fiveHoursAgo, // urgent
        shippingAddress: null,
        shippingProvince: null,
      },
    ])
    mockDb.quoteRequest.findMany.mockResolvedValue([
      {
        id: "quote-1",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // warning
        deliveryCity: "شیراز",
        product: { nameFa: "سیمان پرتلند" },
      },
    ])
    mockDb.contact.findMany.mockResolvedValue([
      {
        id: "ticket-1",
        subject: "سوال درباره نحوه ارسال", // info
        createdAt: new Date(),
      },
    ])
    mockDb.product.findMany.mockResolvedValue([
      {
        id: "prod-stale",
        nameFa: "سیمان سفید", // info
        slug: "white-cement",
        lastPriceUpdate: thirtyHoursAgo,
      },
    ])
    mockDb.$queryRaw.mockResolvedValue([
      {
        id: "prod-stock",
        name_fa: "سیمان پوزولانی", // warning
        slug: "pozzolan-cement",
        stock_qty: 2,
        low_stock_threshold: 10,
      },
    ])

    const tasks = await getTodayTasks()
    expect(tasks.length).toBe(5)

    // First task should be urgent
    expect(tasks[0]?.priority).toBe("urgent")
    expect(tasks[0]?.kind).toBe("order")

    // Next two tasks should be warning
    expect(tasks[1]?.priority).toBe("warning")
    expect(tasks[2]?.priority).toBe("warning")

    // Last two tasks should be info
    expect(tasks[3]?.priority).toBe("info")
    expect(tasks[4]?.priority).toBe("info")
  })
})
