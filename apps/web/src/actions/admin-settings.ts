"use server"

import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"
import { z } from "zod"
import { updateSiteSettings, getSiteSettings, SiteSettings } from "@/lib/settings"

const SettingsSchema = z.object({
  siteNameFa: z.string().min(1, "نام سامانه الزامی است").transform((s) => s.trim()),
  siteNameEn: z.string().default("").transform((s) => s.trim()),
  siteDescriptionFa: z.string().default("").transform((s) => s.trim()),
  supportPhone: z.string().min(1, "شماره تماس الزامی است").transform((s) => s.trim()),
  supportEmail: z.string().email("ایمیل نامعتبر است").transform((s) => s.trim()),
  addressFa: z.string().default("").transform((s) => s.trim()),
  workingHoursFa: z.string().default("").transform((s) => s.trim()),
  telegramChannel: z.string().default("").transform((s) => s.trim()),
  telegramBotUsername: z.string().default("").transform((s) => s.trim()),
  defaultLowStockThreshold: z.coerce.number().int().nonnegative().default(50),
  defaultMinOrderQty: z.coerce.number().int().positive().default(1),
  orderAutoCancelMinutes: z.coerce.number().int().positive().default(60),
})

export async function adminUpdateSettingsAction(
  formData: FormData
): Promise<{ ok: true; settings: SiteSettings }> {
  const user = await requireAdminPerm(PERMISSIONS.SETTINGS_MANAGE)

  const raw = Object.fromEntries(formData.entries())
  const parsed = SettingsSchema.safeParse(raw)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های تنظیمات نامعتبر است")
  }

  const oldSettings = await getSiteSettings()
  const newSettings = await updateSiteSettings(parsed.data)

  await audit({
    userId: user.id,
    action: "setting.update",
    resource: "Setting",
    resourceId: "site_settings",
    before: oldSettings as unknown as Record<string, unknown>,
    after: newSettings as unknown as Record<string, unknown>,
  })

  revalidatePath("/admin/settings")
  return { ok: true, settings: newSettings }
}
