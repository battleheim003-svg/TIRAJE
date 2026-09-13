import { cache } from "react"
import { db, Prisma } from "@tirajeh/database"

export interface SiteSettings {
  siteNameFa: string
  siteNameEn: string
  siteDescriptionFa: string
  supportPhone: string
  supportEmail: string
  addressFa: string
  workingHoursFa: string
  telegramChannel: string
  telegramBotUsername: string
  defaultLowStockThreshold: number
  defaultMinOrderQty: number
  orderAutoCancelMinutes: number
  nationalId: string
  economicCode: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteNameFa: "تیراژه بتن",
  siteNameEn: "Tirajeh Concrete",
  siteDescriptionFa: "سامانه تأمین و فروش سیمان و مصالح ساختمانی ساخت ایران",
  supportPhone: "۰۲۱-۸۸۸۸۸۸۸۸",
  supportEmail: "info@tirajeconcrete.com",
  addressFa: "تهران، خیابان ولیعصر، پلاک ۱",
  workingHoursFa: "شنبه تا چهارشنبه ۸:۰۰ تا ۱۷:۰۰ — پنج‌شنبه ۸:۰۰ تا ۱۳:۰۰",
  telegramChannel: "@TirajehConcrete",
  telegramBotUsername: "@TirajehBot",
  defaultLowStockThreshold: 50,
  defaultMinOrderQty: 1,
  orderAutoCancelMinutes: 60,
  nationalId: "",
  economicCode: "",
}

const SETTINGS_KEY = "site_settings"

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await db.setting.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!row || !row.value || typeof row.value !== "object") {
      return DEFAULT_SITE_SETTINGS
    }

    return {
      ...DEFAULT_SITE_SETTINGS,
      ...(row.value as Record<string, unknown>),
    }
  } catch (err) {
    console.error("[getSiteSettings] Error fetching settings:", err)
    return DEFAULT_SITE_SETTINGS
  }
})

export async function updateSiteSettings(
  partial: Partial<SiteSettings>
): Promise<SiteSettings> {
  const current = await getSiteSettings()
  const merged: SiteSettings = {
    ...current,
    ...partial,
  }

  await db.setting.upsert({
    where: { key: SETTINGS_KEY },
    update: {
      value: merged as unknown as Prisma.InputJsonValue,
    },
    create: {
      key: SETTINGS_KEY,
      value: merged as unknown as Prisma.InputJsonValue,
    },
  })

  return merged
}
