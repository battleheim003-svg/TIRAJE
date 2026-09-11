/**
 * Display maps and labels for cement-domain Prisma enums.
 * Shared across frontend, admin, and integrations (Telegram).
 */

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

export const PACKAGING_LABEL: Record<string, { fa: string; en: string; short: string }> = {
  BAG_50KG:     { fa: "کیسه ۵۰ کیلوگرم",     en: "50 kg Bag",        short: "50kg"    },
  JUMBO_1500KG: { fa: "جامبوبگ ۱۵۰۰ کیلوگرم", en: "1,500 kg Jumbo Bag", short: "1.5t"  },
  BULK:         { fa: "فله",                   en: "Bulk",              short: "فله"    },
}

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

export const PRICE_UNIT: Record<string, { fa: string; en: string }> = {
  BAG_50KG:     { fa: "/ هر کیسه", en: "/ bag"  },
  JUMBO_1500KG: { fa: "/ هر تن",   en: "/ ton"  },
  BULK:         { fa: "/ هر تن",   en: "/ ton"  },
}
