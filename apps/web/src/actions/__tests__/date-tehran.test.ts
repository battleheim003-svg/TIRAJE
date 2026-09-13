import { describe, it, expect } from "vitest"
import {
  TEHRAN_TZ,
  tehranDayStart,
  tehranDateKey,
  formatJalali,
  formatRelativeFa,
} from "@tirajeh/shared"

describe("T1.6 Tehran Timezone & Jalali Utilities", () => {
  it("TEHRAN_TZ is Asia/Tehran", () => {
    expect(TEHRAN_TZ).toBe("Asia/Tehran")
  })

  describe("tehranDayStart", () => {
    it("returns UTC moment that corresponds to 00:00:00 in Tehran", () => {
      const d = new Date("2026-09-13T12:00:00Z")
      const start = tehranDayStart(d)

      // Format `start` in Tehran timezone
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: TEHRAN_TZ,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      const timeStr = fmt.format(start)
      expect(timeStr).toBe("00:00:00")
    })

    it("correctly handles evening UTC crossing into next Tehran day", () => {
      // 2026-09-13 22:00:00 UTC is 2026-09-14 01:30:00 in Tehran
      const d = new Date("2026-09-13T22:00:00Z")
      const start = tehranDayStart(d)

      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: TEHRAN_TZ,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      expect(fmt.format(start)).toBe("00:00:00")

      // It should be midnight of Sept 14 (which is 2026-09-13T20:30:00Z in UTC)
      expect(start.toISOString()).toBe("2026-09-13T20:30:00.000Z")
    })
  })

  describe("tehranDateKey", () => {
    it("formats jalali date key YYYY-MM-DD", () => {
      const d = new Date("2026-09-13T12:00:00Z")
      const key = tehranDateKey(d)
      expect(key).toBe("1405-06-22")
    })

    it("returns the next Jalali day for late UTC moments when Tehran has crossed midnight", () => {
      // At UTC 21:00 on 2026-09-13, Tehran is 00:30 on 2026-09-14 (Shahrivar 23)
      const dLateUtc = new Date("2026-09-13T21:00:00Z")
      expect(tehranDateKey(dLateUtc)).toBe("1405-06-23")

      // At UTC 00:00 on 2026-09-14, Tehran is 03:30 on 2026-09-14
      const dMidnightUtc = new Date("2026-09-14T00:00:00Z")
      expect(tehranDateKey(dMidnightUtc)).toBe("1405-06-23")
    })
  })

  describe("formatJalali", () => {
    it("formats date in Persian", () => {
      const d = new Date("2026-09-13T12:00:00Z")
      const result = formatJalali(d)
      expect(result).toContain("شهریور")
      expect(result).toContain("۱۴۰۵")
    })

    it("includes time when opts.withTime is true", () => {
      const d = new Date("2026-09-13T12:00:00Z")
      const result = formatJalali(d, { withTime: true })
      expect(result).toContain("شهریور")
      expect(result).toContain("۱۴۰۵")
      // 12:00 UTC is 15:30 in Tehran
      expect(result).toMatch(/۱۵:۳۰|15:30/)
    })
  })

  describe("formatRelativeFa", () => {
    it("returns همین الان for very recent timestamps", () => {
      const now = new Date()
      expect(formatRelativeFa(now)).toBe("همین الان")
    })

    it("formats minutes ago", () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
      const result = formatRelativeFa(fiveMinsAgo)
      expect(result).toContain("دقیقه پیش")
    })

    it("formats hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000)
      const result = formatRelativeFa(twoHoursAgo)
      expect(result).toContain("ساعت پیش")
    })

    it("formats days ago", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000)
      const result = formatRelativeFa(twoDaysAgo)
      expect(result).toMatch(/پریروز|۲ روز پیش|روز پیش/)

      const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000)
      expect(formatRelativeFa(threeDaysAgo)).toMatch(/۳ روز پیش|روز پیش/)
    })
  })
})
