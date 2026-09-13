export const TEHRAN_TZ = "Asia/Tehran"

/** نیمه‌شب تهران (شروع روز جلالی) به UTC */
export function tehranDayStart(d?: Date): Date {
  const base = d ?? new Date()
  const tehranStr = base.toLocaleString("en-CA", { timeZone: TEHRAN_TZ, hour12: false })
  const utcStr = base.toLocaleString("en-CA", { timeZone: "UTC", hour12: false })
  const offsetMs = new Date(utcStr).getTime() - new Date(tehranStr).getTime()
  const dayStr = base.toLocaleDateString("en-CA", { timeZone: TEHRAN_TZ })
  return new Date(new Date(dayStr + "T00:00:00Z").getTime() + offsetMs)
}

/** کلید روز جلالی: "1405-06-21" */
export function tehranDateKey(d?: Date): string {
  return (d ?? new Date()).toLocaleDateString("fa-IR-u-nu-latn", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "persian",
  }).replace(/\//g, "-")
}

/** نمایش تاریخ جلالی — Intl با fa-IR و تقویم جلالی */
export function formatJalali(
  d: Date | string,
  opts?: { withTime?: boolean }
): string {
  const date = typeof d === "string" ? new Date(d) : d
  const fmt = new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN_TZ,
    calendar: "persian",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(opts?.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
  return fmt.format(date)
}

/** نمایش زمان نسبی فارسی (جایگزین formatRelativeTime قدیمی) */
export function formatRelativeFa(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" })
  const diffMs = date.getTime() - Date.now()
  const diffSecs = Math.round(diffMs / 1000)
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)
  const diffMonths = Math.round(diffDays / 30)
  const diffYears = Math.round(diffDays / 365)

  if (Math.abs(diffSecs) < 60) return "همین الان"
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute")
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour")
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day")
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month")
  return rtf.format(diffYears, "year")
}
