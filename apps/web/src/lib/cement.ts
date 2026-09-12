/**
 * Display maps and helpers for cement-domain Prisma enums.
 * Shared across product cards, filters, and detail pages.
 */

export {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
  STOCK_VARIANT,
  PRICE_UNIT,
} from "@tirajeh/shared"

// ─── Price formatting ──────────────────────────────────────────────────────

export { formatToman } from "@tirajeh/shared"

// ─── Relative time (server-safe, no external deps) ─────────────────────────

export function formatRelativeTime(date: Date | string, locale: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(diffMs / 3_600_000)
  const days = Math.floor(diffMs / 86_400_000)
  const months = Math.floor(days / 30)

  if (locale === "fa") {
    if (minutes < 5) return "همین الان"
    if (hours < 1) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`
    if (days < 1) return `${hours.toLocaleString("fa-IR")} ساعت پیش`
    if (days === 1) return "دیروز"
    if (days < 30) return `${days.toLocaleString("fa-IR")} روز پیش`
    if (months < 12) return `${months.toLocaleString("fa-IR")} ماه پیش`
    return `${Math.floor(months / 12).toLocaleString("fa-IR")} سال پیش`
  }
  if (minutes < 5) return "just now"
  if (hours < 1) return `${minutes}m ago`
  if (days < 1) return `${hours}h ago`
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}yr ago`
}

// ─── Weight display ────────────────────────────────────────────────────────

export function formatWeight(kg: unknown, locale: string): string {
  const num = Number(kg)
  if (isNaN(num)) return "—"
  const formatted = locale === "fa" ? num.toLocaleString("fa-IR") : num.toLocaleString("en-US")
  return `${formatted} kg`
}
