/**
 * Display maps and helpers for cement-domain Prisma enums.
 * Shared across product cards, filters, and detail pages.
 */

// ─── CementType ────────────────────────────────────────────────────────────

export const CEMENT_TYPE_LABEL: Record<string, { fa: string; en: string }> = {
  TYPE_1_325:  { fa: "تیپ ۱ — ۳۲۵",   en: "Type I — 325"    },
  TYPE_1_425:  { fa: "تیپ ۱ — ۴۲۵",   en: "Type I — 425"    },
  TYPE_2:      { fa: "تیپ ۲",          en: "Type II"          },
  TYPE_3:      { fa: "تیپ ۳",          en: "Type III"         },
  TYPE_5:      { fa: "تیپ ۵",          en: "Type V"           },
  WHITE:       { fa: "سفید",           en: "White"            },
  POZZOLANIC:  { fa: "پوزولانی",       en: "Pozzolanic"       },
  SLAG:        { fa: "سرباره",          en: "Slag"             },
  OIL_WELL:    { fa: "چاه نفت",        en: "Oil Well"         },
  COMPOSITE:   { fa: "کامپوزیت",       en: "Composite"        },
}

// ─── PackagingType ─────────────────────────────────────────────────────────

export const PACKAGING_LABEL: Record<string, { fa: string; en: string; short: string }> = {
  BAG_50KG:     { fa: "کیسه ۵۰ کیلوگرم",     en: "50 kg Bag",        short: "50kg"    },
  JUMBO_1500KG: { fa: "جامبوبگ ۱۵۰۰ کیلوگرم", en: "1,500 kg Jumbo Bag", short: "1.5t"  },
  BULK:         { fa: "فله",                   en: "Bulk",              short: "فله"    },
}

// ─── StockStatus ───────────────────────────────────────────────────────────

export const STOCK_LABEL: Record<string, { fa: string; en: string }> = {
  IN_STOCK:     { fa: "موجود",       en: "In Stock"     },
  LOW_STOCK:    { fa: "رو به اتمام", en: "Low Stock"    },
  OUT_OF_STOCK: { fa: "ناموجود",     en: "Out of Stock" },
  DISCONTINUED: { fa: "متوقف‌شده",   en: "Discontinued" },
}

export const STOCK_VARIANT: Record<string, "in" | "low" | "out"> = {
  IN_STOCK:     "in",
  LOW_STOCK:    "low",
  OUT_OF_STOCK: "out",
  DISCONTINUED: "out",
}

// ─── Price formatting ──────────────────────────────────────────────────────

export function formatPrice(price: unknown, locale: string): string {
  const num = Number(price)
  if (isNaN(num) || num === 0) return locale === "fa" ? "تماس بگیرید" : "Contact Us"
  return locale === "fa"
    ? `${num.toLocaleString("fa-IR")} تومان`
    : `${num.toLocaleString("en-US")} T`
}

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

// ─── Price unit label (per bag / per ton) ──────────────────────────────────

export const PRICE_UNIT: Record<string, { fa: string; en: string }> = {
  BAG_50KG:     { fa: "/ هر کیسه", en: "/ bag"  },
  JUMBO_1500KG: { fa: "/ هر تن",   en: "/ ton"  },
  BULK:         { fa: "/ هر تن",   en: "/ ton"  },
}

// ─── Weight display ────────────────────────────────────────────────────────

export function formatWeight(kg: unknown, locale: string): string {
  const num = Number(kg)
  if (isNaN(num)) return "—"
  const formatted = locale === "fa" ? num.toLocaleString("fa-IR") : num.toLocaleString("en-US")
  return `${formatted} kg`
}
