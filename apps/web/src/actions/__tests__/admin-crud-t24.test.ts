import { describe, it, expect, vi } from "vitest"
import { IRAN_PROVINCES, IRAN_PROVINCE_NAMES_FA, PERMISSIONS } from "@tirajeh/shared"
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings"

describe("T2.4 Missing Admin Pages & CRUD", () => {
  it("exports 31 Iranian provinces in @tirajeh/shared", () => {
    expect(IRAN_PROVINCES.length).toBe(31)
    expect(IRAN_PROVINCE_NAMES_FA).toContain("تهران")
    expect(IRAN_PROVINCE_NAMES_FA).toContain("اصفهان")
    expect(IRAN_PROVINCE_NAMES_FA).toContain("خوزستان")
  })

  it("contains new required admin permissions", () => {
    expect(PERMISSIONS.SHIPPING_MANAGE).toBe("shipping:manage")
    expect(PERMISSIONS.FACTORIES_MANAGE).toBe("factories:manage")
    expect(PERMISSIONS.SETTINGS_MANAGE).toBe("settings:manage")
  })

  it("provides valid default site settings", () => {
    expect(DEFAULT_SITE_SETTINGS.siteNameFa).toBe("تیراژه بتن")
    expect(DEFAULT_SITE_SETTINGS.defaultLowStockThreshold).toBeGreaterThan(0)
    expect(DEFAULT_SITE_SETTINGS.orderAutoCancelMinutes).toBe(60)
  })
})
