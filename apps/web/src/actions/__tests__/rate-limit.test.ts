import { describe, it, expect, vi, beforeEach } from "vitest"
import * as integrations from "@tirajeh/integrations"
import { contactAction } from "../contact"
import { createQuoteAction } from "../quote"
import { loginAction, registerAction } from "../auth"
import { db } from "@tirajeh/database"

const { mockHeaders } = vi.hoisted(() => {
  return {
    mockHeaders: vi.fn().mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "x-forwarded-for") return "203.0.113.195, 10.0.0.1"
        return null
      }),
    }),
  }
})

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}))

vi.mock("@tirajeh/database", () => ({
  db: {
    contact: {
      create: vi.fn().mockResolvedValue({ id: "mock-contact-id" }),
    },
    quoteRequest: {
      create: vi.fn().mockResolvedValue({
        id: "mock-quote-id",
        name: "تست",
        product: { nameFa: "سیمان پرتلند" },
        quantityTon: 10,
        phone: "09123456789",
        customerType: "NORMAL",
      }),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("@tirajeh/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  signIn: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../cart", () => ({
  mergeCartAction: vi.fn().mockResolvedValue(undefined),
}))

describe("T1.7 Rate Limiting & Honeypot", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue({
      get: (name: string) => {
        if (name === "x-forwarded-for") return "203.0.113.195, 10.0.0.1"
        return null
      },
    })
  })

  describe("Honeypot protection", () => {
    it("contactAction bails out and returns success without inserting to db when _hp is filled", async () => {
      vi.spyOn(integrations, "rateLimit").mockResolvedValue({
        ok: true,
        remaining: 5,
        retryAfterSec: 0,
      })

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const formData = new FormData()
      formData.append("name", "اسپمر")
      formData.append("email", "spammer@bot.com")
      formData.append("subject", "تبلیغات")
      formData.append("message", "پیام تبلیغاتی ربات")
      formData.append("_hp", "bot-filled-field")

      const res = await contactAction(formData)

      expect(res).toEqual({ success: true, data: undefined })
      expect(db.contact.create).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "honeypot triggered — contact",
        expect.objectContaining({ ip: "203.0.113.195" })
      )
    })

    it("createQuoteAction bails out and returns success without inserting to db when _hp is filled", async () => {
      vi.spyOn(integrations, "rateLimit").mockResolvedValue({
        ok: true,
        remaining: 5,
        retryAfterSec: 0,
      })

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const formData = new FormData()
      formData.append("name", "اسپمر استعلام")
      formData.append("phone", "09123456789")
      formData.append("productId", "00000000-0000-0000-0000-000000000001")
      formData.append("quantityTon", "50")
      formData.append("_hp", "spam-bot")

      const res = await createQuoteAction(formData)

      expect(res.success).toBe(true)
      expect(db.quoteRequest.create).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "honeypot triggered — quote",
        expect.objectContaining({ ip: "203.0.113.195" })
      )
    })
  })

  describe("Server actions rate limit rejection", () => {
    it("contactAction rejects with standard message and retryAfterSec when rate limited", async () => {
      vi.spyOn(integrations, "rateLimit").mockResolvedValue({
        ok: false,
        remaining: 0,
        retryAfterSec: 1800,
      })

      const formData = new FormData()
      formData.append("name", "کاربر")
      formData.append("email", "user@test.com")
      formData.append("subject", "استفسار")
      formData.append("message", "متن درخواست استفسار")

      const res = await contactAction(formData)

      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe("تعداد درخواستهای شما بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.")
        expect(res.retryAfterSec).toBe(1800)
      }
      expect(db.contact.create).not.toHaveBeenCalled()
    })

    it("loginAction rejects when IP rate limited", async () => {
      vi.spyOn(integrations, "rateLimit").mockResolvedValueOnce({
        ok: false,
        remaining: 0,
        retryAfterSec: 600,
      })

      const formData = new FormData()
      formData.append("email", "admin@test.com")
      formData.append("password", "secret123")

      const res = await loginAction(formData)

      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe("تعداد درخواستهای شما بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.")
        expect(res.retryAfterSec).toBe(600)
      }
    })

    it("registerAction rejects when IP rate limited", async () => {
      vi.spyOn(integrations, "rateLimit").mockResolvedValueOnce({
        ok: false,
        remaining: 0,
        retryAfterSec: 3200,
      })

      const formData = new FormData()
      formData.append("name", "کاربر جدید")
      formData.append("email", "new@test.com")
      formData.append("password", "Pass123456")

      const res = await registerAction(formData)

      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe("تعداد درخواستهای شما بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.")
        expect(res.retryAfterSec).toBe(3200)
      }
    })
  })
})
