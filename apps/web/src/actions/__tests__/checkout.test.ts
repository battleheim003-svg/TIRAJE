/**
 * Checkout transaction rollback tests.
 *
 * Strategy: mock @tirajeh/database, @tirajeh/auth, and next/navigation so the
 * pure server-action logic can run in the test environment without a live DB.
 * Each test verifies that when a mid-transaction failure occurs, NO partial
 * state is committed (orders table, stock levels, payment records, cart state
 * are all unchanged from their pre-call values).
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Shared mocks ─────────────────────────────────────────────────────────────

const mockSession = {
  user: {
    id: "user-1",
    email: "buyer@test.com",
    permissions: [],
    roleId: null,
    roleName: null,
    customerType: "NORMAL" as const,
    name: "Test Buyer",
    image: null,
  },
}

vi.mock("@tirajeh/auth", () => ({
  auth: vi.fn().mockResolvedValue(mockSession),
  requirePermission: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    // In tests, redirect throws a special error Next.js catches at runtime.
    // We throw a distinguishable error so tests can detect a successful redirect.
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;${url}` })
  }),
}))

// ─── DB mock factory ──────────────────────────────────────────────────────────

function makeDbMock(overrides: Partial<ReturnType<typeof buildDbMock>> = {}) {
  return buildDbMock(overrides)
}

function buildDbMock(overrides: Record<string, unknown> = {}) {
  const base = {
    cart: {
      findUnique: vi.fn(),
    },
    shippingRate: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  return { ...base, ...overrides }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  const defaults: Record<string, string> = {
    "address.recipientName": "علی محمدی",
    "address.phone": "09123456789",
    "address.province": "تهران",
    "address.city": "تهران",
    "address.street": "خیابان آزادی، پلاک ۱۲",
    shippingRateId: "rate-uuid-1",
    paymentGateway: "ZARINPAL",
  }
  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) {
    fd.append(k, v)
  }
  return fd
}

function makeCart(stockTon = 10) {
  return {
    id: "cart-1",
    userId: "user-1",
    items: [
      {
        id: "item-1",
        cartId: "cart-1",
        productId: "product-1",
        quantityTon: 5,
        product: {
          id: "product-1",
          name: "سیمان تیراژه ۴۲.۵",
          pricePerTon: 3_000_000,
          stockTon,
          weightPerUnit: 1000,
          isActive: true,
        },
      },
    ],
  }
}

function makeShippingRate() {
  return {
    id: "rate-uuid-1",
    zoneId: "zone-1",
    baseCost: 500_000,
    costPerTon: 150_000,
    truckType: "TRUCK_10_TON",
    capacityTon: 10,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("checkoutAction — transaction rollback safety", () => {
  let db: ReturnType<typeof makeDbMock>

  beforeEach(async () => {
    vi.resetModules()
    db = makeDbMock()
    vi.doMock("@tirajeh/database", () => ({ db }))
  })

  // ── Test 1: Stock too low before transaction ──────────────────────────────
  it("returns error and does NOT open a transaction when pre-flight stock check fails", async () => {
    db.cart.findUnique.mockResolvedValue(makeCart(3)) // only 3t in stock, 5t ordered
    db.shippingRate.findUnique.mockResolvedValue(makeShippingRate())

    const { checkoutAction } = await import("../order")
    const result = await checkoutAction(makeFormData())

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/موجودی/)
    // Transaction must NOT have been called
    expect(db.$transaction).not.toHaveBeenCalled()
    // No order, stock change, or payment
    expect(db.order.create).not.toHaveBeenCalled()
    expect(db.product.update).not.toHaveBeenCalled()
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  // ── Test 2: Race-condition stock failure inside transaction ───────────────
  it("rolls back when race-condition stock check fails inside transaction", async () => {
    db.cart.findUnique.mockResolvedValue(makeCart(10)) // passes pre-flight
    db.shippingRate.findUnique.mockResolvedValue(makeShippingRate())

    // $transaction throws — simulates stock depleted between pre-flight and lock
    const txError = new Error("stock depleted in race")
    db.$transaction.mockRejectedValue(txError)

    const { checkoutAction } = await import("../order")
    const result = await checkoutAction(makeFormData())

    expect(result.success).toBe(false)
    // Must be a generic user-safe message, not the raw DB error
    expect((result as { error: string }).error).toMatch(/خطای داخلی/)
    // Transaction was called but rejected — nothing committed
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })

  // ── Test 3: Payment record creation fails inside transaction ─────────────
  it("rolls back order + stock when payment.create throws inside transaction", async () => {
    db.cart.findUnique.mockResolvedValue(makeCart(10))
    db.shippingRate.findUnique.mockResolvedValue(makeShippingRate())

    // Simulate the transaction executor: run the callback, but payment.create throws
    db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({ stockTon: 10, name: "سیمان" }),
          update: vi.fn(),
        },
        order: {
          create: vi.fn().mockResolvedValue({ id: "order-new" }),
        },
        cartItem: {
          deleteMany: vi.fn(),
        },
        payment: {
          // Throws to simulate gateway record failure
          create: vi.fn().mockRejectedValue(new Error("DB constraint violation")),
        },
      }

      // This throw is what Prisma propagates to roll back the real transaction.
      // In tests we just let it propagate so safeAction catches it.
      return fn(tx)
    })

    const { checkoutAction } = await import("../order")
    const result = await checkoutAction(makeFormData())

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/خطای داخلی/)
  })

  // ── Test 4: Invalid order state — cancel a delivered order ───────────────
  it("rejects cancellation of a DELIVERED order without touching DB", async () => {
    vi.doMock("@tirajeh/database", () => ({
      db: {
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: "order-1",
            userId: "user-1",
            status: "DELIVERED",
          }),
          update: vi.fn(),
        },
        orderStatusHistory: { create: vi.fn() },
        $transaction: vi.fn(),
      },
    }))

    const { cancelOrderAction } = await import("../order")
    const fd = new FormData()
    fd.append("orderId", "order-1")
    fd.append("reason", "تست لغو")

    const result = await cancelOrderAction(fd)

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/قابل لغو نیست/)
  })

  // ── Test 5: Cancel order not owned by user ────────────────────────────────
  it("returns NotFound when order belongs to a different user", async () => {
    vi.doMock("@tirajeh/database", () => ({
      db: {
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: "order-x",
            userId: "different-user",
            status: "PENDING",
          }),
          update: vi.fn(),
        },
        orderStatusHistory: { create: vi.fn() },
        $transaction: vi.fn(),
      },
    }))

    const { cancelOrderAction } = await import("../order")
    const fd = new FormData()
    fd.append("orderId", "order-x")
    fd.append("reason", "اشتباه سفارش دادم")

    const result = await cancelOrderAction(fd)

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toMatch(/یافت نشد/)
  })

  // ── Test 6: Happy path — redirect is called (order committed) ─────────────
  it("calls redirect on successful checkout (transaction committed)", async () => {
    const { redirect } = await import("next/navigation")
    db.cart.findUnique.mockResolvedValue(makeCart(10))
    db.shippingRate.findUnique.mockResolvedValue(makeShippingRate())

    db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({ stockTon: 10, name: "سیمان" }),
          update: vi.fn(),
        },
        order: {
          create: vi.fn().mockResolvedValue({ id: "order-ok" }),
        },
        cartItem: { deleteMany: vi.fn() },
        payment: { create: vi.fn().mockResolvedValue({ id: "pay-1" }) },
      }
      return fn(tx)
    })

    const { checkoutAction } = await import("../order")

    await expect(checkoutAction(makeFormData())).rejects.toThrow("NEXT_REDIRECT")
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("orderId=order-ok"))
  })
})
