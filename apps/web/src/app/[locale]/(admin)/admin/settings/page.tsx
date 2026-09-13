import React from "react"
import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/settings"
import { SettingsForm } from "./SettingsForm"

export const metadata: Metadata = {
  title: "تنظیمات عمومی سامانه | پنل مدیریت تیراژه",
}

export default async function AdminSettingsPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const settings = await getSiteSettings()

  const telegramEnv = {
    botTokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    channelConfigured: Boolean(process.env.TELEGRAM_CHANNEL_USERNAME),
    chatIdConfigured: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID),
  }

  return (
    <SettingsForm
      locale={locale}
      fa={fa}
      settings={settings}
      telegramEnv={telegramEnv}
    />
  )
}
