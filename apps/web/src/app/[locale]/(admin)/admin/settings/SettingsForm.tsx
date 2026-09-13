"use client"

import React, { useState, useTransition } from "react"
import { Save, Info, Bell, Phone, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/admin/Toast"
import { adminUpdateSettingsAction } from "@/actions/admin-settings"
import type { SiteSettings } from "@/lib/settings"
import styles from "@/components/admin/AdminCommon.module.css"

interface Props {
  locale: string
  fa: boolean
  settings: SiteSettings
  telegramEnv: {
    botTokenConfigured: boolean
    channelConfigured: boolean
    chatIdConfigured: boolean
  }
}

export function SettingsForm({
  fa,
  settings: initialSettings,
  telegramEnv,
}: Props) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState<SiteSettings>(initialSettings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set("siteNameFa", settings.siteNameFa)
    fd.set("siteNameEn", settings.siteNameEn)
    fd.set("siteDescriptionFa", settings.siteDescriptionFa)
    fd.set("supportPhone", settings.supportPhone)
    fd.set("supportEmail", settings.supportEmail)
    fd.set("addressFa", settings.addressFa)
    fd.set("workingHoursFa", settings.workingHoursFa)
    fd.set("telegramChannel", settings.telegramChannel)
    fd.set("telegramBotUsername", settings.telegramBotUsername)
    fd.set("defaultLowStockThreshold", String(settings.defaultLowStockThreshold))
    fd.set("defaultMinOrderQty", String(settings.defaultMinOrderQty))
    fd.set("orderAutoCancelMinutes", String(settings.orderAutoCancelMinutes))

    startTransition(async () => {
      try {
        const res = await adminUpdateSettingsAction(fd)
        setSettings(res.settings)
        toast.success(fa ? "تنظیمات با موفقیت ذخیره شد" : "Settings saved successfully")
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در ذخیره تنظیمات" : "Failed to save settings"))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {fa ? "تنظیمات عمومی سامانه" : "System Settings"}
          </h1>
          <p className={styles.subtitle}>
            {fa
              ? "مدیریت اطلاعات تماس، آستانه‌های انبار، و پیکربندی بات و کانال تلگرام"
              : "Manage site info, contact details, inventory thresholds, and Telegram configuration"}
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={styles.primaryBtn}
        >
          <Save style={{ width: "1rem", height: "1rem" }} />
          <span>{isPending ? (fa ? "در حال ذخیره..." : "Saving...") : (fa ? "ذخیره تغییرات" : "Save Changes")}</span>
        </button>
      </div>

      {/* Section 1: Contact & General Info */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          <Phone style={{ width: "1.2rem", height: "1.2rem", color: "var(--color-accent-text)" }} />
          <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 800, margin: 0 }}>
            {fa ? "اطلاعات تماس و هویت سامانه" : "Site Identity & Contact Information"}
          </h2>
        </div>

        <div className={styles.formGrid}>
          <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "نام سامانه (فارسی) *" : "Site Name (Fa) *"}</label>
              <input
                type="text"
                required
                dir="rtl"
                value={settings.siteNameFa}
                onChange={(e) => setSettings({ ...settings, siteNameFa: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "نام سامانه (انگلیسی)" : "Site Name (En)"}</label>
              <input
                type="text"
                dir="ltr"
                value={settings.siteNameEn}
                onChange={(e) => setSettings({ ...settings, siteNameEn: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{fa ? "توضیحات مختصر سامانه" : "Site Description"}</label>
            <input
              type="text"
              dir="rtl"
              value={settings.siteDescriptionFa}
              onChange={(e) => setSettings({ ...settings, siteDescriptionFa: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "شماره تلفن پشتیبانی *" : "Support Phone *"}</label>
              <input
                type="text"
                required
                dir="ltr"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "ایمیل پشتیبانی *" : "Support Email *"}</label>
              <input
                type="email"
                required
                dir="ltr"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "آدرس دفتر مرکزی" : "Office Address"}</label>
              <input
                type="text"
                dir="rtl"
                value={settings.addressFa}
                onChange={(e) => setSettings({ ...settings, addressFa: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "ساعات کاری" : "Working Hours"}</label>
              <input
                type="text"
                dir="rtl"
                value={settings.workingHoursFa}
                onChange={(e) => setSettings({ ...settings, workingHoursFa: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: System Limits & Thresholds */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          <Bell style={{ width: "1.2rem", height: "1.2rem", color: "var(--color-accent-text)" }} />
          <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 800, margin: 0 }}>
            {fa ? "آستانه‌های سیستمی و انبارداری" : "System Limits & Thresholds"}
          </h2>
        </div>

        <div className={`${styles.formGrid} ${styles.formGridThree}`}>
          <div className={styles.field}>
            <label className={styles.label}>{fa ? "آستانه پیش‌فرض هشدار موجودی کم (کیسه)" : "Default Low Stock Alert"}</label>
            <input
              type="number"
              min="0"
              required
              value={settings.defaultLowStockThreshold}
              onChange={(e) => setSettings({ ...settings, defaultLowStockThreshold: Number(e.target.value) || 0 })}
              className={styles.input}
            />
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              {fa ? "برای محصولاتی که آستانه اختصاصی ندارند" : "Fallback when not set per product"}
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{fa ? "حداقل پیش‌فرض سفارش (کیسه)" : "Default Min Order Qty"}</label>
            <input
              type="number"
              min="1"
              required
              value={settings.defaultMinOrderQty}
              onChange={(e) => setSettings({ ...settings, defaultMinOrderQty: Number(e.target.value) || 1 })}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{fa ? "مهلت پرداخت سفارش پیش از لغو خودکار (دقیقه)" : "Order Payment Timeout (min)"}</label>
            <input
              type="number"
              min="5"
              required
              value={settings.orderAutoCancelMinutes}
              onChange={(e) => setSettings({ ...settings, orderAutoCancelMinutes: Number(e.target.value) || 60 })}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Telegram Configuration & Diagnostics */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          <Info style={{ width: "1.2rem", height: "1.2rem", color: "var(--color-accent-text)" }} />
          <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 800, margin: 0 }}>
            {fa ? "پیکربندی تلگرام و متغیرهای محیطی" : "Telegram Integration & Environment Status"}
          </h2>
        </div>

        <div className={styles.formGrid}>
          <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "نام کاربری کانال تلگرام" : "Telegram Channel Username"}</label>
              <input
                type="text"
                dir="ltr"
                value={settings.telegramChannel}
                onChange={(e) => setSettings({ ...settings, telegramChannel: e.target.value })}
                placeholder="@TirajehConcrete"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{fa ? "نام کاربری بات تلگرام" : "Telegram Bot Username"}</label>
              <input
                type="text"
                dir="ltr"
                value={settings.telegramBotUsername}
                onChange={(e) => setSettings({ ...settings, telegramBotUsername: e.target.value })}
                placeholder="@TirajehBot"
                className={styles.input}
              />
            </div>
          </div>

          {/* Read-Only Status Badges */}
          <div style={{ marginTop: "var(--space-3)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)" }}>
            <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-2)" }}>
              {fa ? "وضعیت اتصال متغیرهای محیطی (.env):" : "Environment Variables Status:"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", fontSize: "var(--font-size-xs)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                <CheckCircle2 style={{ width: "1rem", height: "1rem", color: telegramEnv.botTokenConfigured ? "var(--color-success, #22c55e)" : "var(--color-danger, #ef4444)" }} />
                <span>TELEGRAM_BOT_TOKEN: <strong>{telegramEnv.botTokenConfigured ? (fa ? "تنظیم شده" : "Configured") : (fa ? "تنظیم نشده" : "Missing")}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                <CheckCircle2 style={{ width: "1rem", height: "1rem", color: telegramEnv.channelConfigured ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)" }} />
                <span>TELEGRAM_CHANNEL_USERNAME: <strong>{telegramEnv.channelConfigured ? (fa ? "تنظیم شده" : "Configured") : (fa ? "پیش‌فرض" : "Fallback")}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                <CheckCircle2 style={{ width: "1rem", height: "1rem", color: telegramEnv.chatIdConfigured ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)" }} />
                <span>TELEGRAM_ADMIN_CHAT_ID: <strong>{telegramEnv.chatIdConfigured ? (fa ? "تنظیم شده" : "Configured") : (fa ? "تنظیم نشده" : "Optional")}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
