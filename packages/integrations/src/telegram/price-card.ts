/**
 * Renders the daily price bulletin as a branded PNG using @napi-rs/canvas.
 *
 * Why this instead of next/og (Satori) or a headless browser:
 *  - Satori (next/og's ImageResponse) has an incomplete bidi/RTL implementation
 *    and repeatedly scrambled multi-word Persian strings in this project.
 *  - A headless browser (Edge/Chrome) works but isn't portable — most
 *    deployment targets for this app don't ship a browser binary.
 *  - @napi-rs/canvas is a native Node addon (Skia + real text shaping) with
 *    prebuilt binaries for common server platforms, no browser required, and
 *    it shapes/orders Persian text correctly (verified against known-bad
 *    strings before this file was written — see project history).
 *
 * Every position in this file is an absolute pixel coordinate we compute
 * ourselves — there is no flexbox reflow that could silently reorder
 * anything, which is what made the Satori version fragile.
 */
import fs from "fs"
import path from "path"
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas"

// ─── palette — exact tokens from apps/web/src/app/globals.css ─────────────
const NAVY = "#0c1420"
const NAVY_2 = "#162338"
const GOLD = "#f5cb5c"
const CREAM = "#f4efe3"
const CREAM_2 = "#ece2cd"
const INK = "#101c2b"
const INK_MUTED = "#6a5c40"
const INK_FAINT = "#8a7d5f"
const LINE = "#d9cdb4"
const LINE_2 = "#e7dcc3"
const ROW_ALT = "#ece4d1"
const UP_BG = "#f7dede"
const UP_TX = "#8f1e17"
const DOWN_BG = "#dcecdf"
const DOWN_TX = "#1f5e3a"
const GOLD_TEXT = "#9a6c1f"

// ─── fonts ──────────────────────────────────────────────────────────────
let fontsRegistered = false
function ensureFonts() {
  if (fontsRegistered) return
  const dir = resolveAssetDir()
  const weights: Array<[string, string]> = [
    ["Vazirmatn-Regular.ttf", "Vazirmatn"],
    ["Vazirmatn-Medium.ttf", "Vazirmatn Medium"],
    ["Vazirmatn-Bold.ttf", "Vazirmatn Bold"],
    ["Vazirmatn-ExtraBold.ttf", "Vazirmatn ExtraBold"],
  ]
  for (const [file, family] of weights) {
    try {
      GlobalFonts.registerFromPath(path.join(dir, "fonts", file), family)
    } catch (err) {
      console.warn(`[price-card] failed to register font ${file}:`, err)
    }
  }
  fontsRegistered = true
}

function resolveAssetDir(): string {
  const candidates = [
    path.join(process.cwd(), "packages/integrations/src/telegram/assets"),
    path.join(process.cwd(), "../../packages/integrations/src/telegram/assets"),
    path.join(__dirname, "assets"),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]!
}

// ─── public types ───────────────────────────────────────────────────────
export interface PriceCardItem {
  id: string
  name: string
  price: number
  previousPrice: number | null
}

export interface PriceCardGroup {
  title: string
  items: PriceCardItem[]
}

export interface PriceCardData {
  dateLabel: string // already-formatted Persian date string, e.g. "چهارشنبه ۱۸ شهریور ۱۴۰۵"
  groups: PriceCardGroup[]
  sitePhone: string
  siteDomain: string // without protocol, e.g. "tirajeconcrete.com"
  channelHandle: string // e.g. "@tirajeconcrete"
}

// ─── grouping helper (used by the caller building PriceCardData) ──────────
const GROUP_TITLES = {
  bagged: "سیمان پاکتی",
  special: "سیمان تخصصی و صادراتی",
  aggregate: "شن و ماسه",
  other: "سایر مصالح",
} as const

export function classifyGroupTitle(params: {
  name: string
  packagingType?: string | null
  categoryNames?: string[]
}): string {
  const nameLower = params.name.toLowerCase()
  if (params.packagingType === "BAG_50KG") return GROUP_TITLES.bagged

  const specialKeywords = [
    "آنتی‌سولفات", "انتی سولفات", "آنتی سولفات", "سولفات",
    "صادراتی", "حفاری", "چاه نفت", "نوع ۵", "نوع 5", "m500",
  ]
  if (specialKeywords.some((kw) => nameLower.includes(kw))) return GROUP_TITLES.special

  const sandKeywords = ["ماسه", "شن", "سنگ"]
  const hasSandInName = sandKeywords.some((kw) => nameLower.includes(kw))
  const hasSandInCategory = (params.categoryNames ?? []).some((c) => c.includes("شن") || c.includes("ماسه"))
  if (hasSandInName || hasSandInCategory) return GROUP_TITLES.aggregate

  return GROUP_TITLES.other
}

/** Every item in a group repeats the group's own first word — drop it so the name column isn't noisy. */
export function stripGroupPrefix(name: string, groupTitle: string): string {
  const leadWord = groupTitle.split(" ")[0]
  if (leadWord && name.startsWith(`${leadWord} `)) {
    return name.slice(leadWord.length + 1).trim()
  }
  return name
}

// ─── drawing helpers ────────────────────────────────────────────────────
const nf = new Intl.NumberFormat("fa-IR")
const fa = (n: number) => nf.format(Math.round(n))

function roundRectPath(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Renders the price bulletin PNG. Returns a PNG buffer.
 */
export function renderPriceCardPng(data: PriceCardData): Buffer {
  ensureFonts()

  const W = 1080
  const MARGIN = 44
  const RIGHT = W - MARGIN
  const LEFT = MARGIN
  const PRICE_W = 268
  const PRICE_LEFT = LEFT
  const PRICE_RIGHT = LEFT + PRICE_W
  const DIVIDER_X = PRICE_RIGHT + 18
  const NAME_LEFT = DIVIDER_X + 18
  const NAME_RIGHT = RIGHT

  const HEADER_H = 168
  const DATEBAR_H = 70
  const COLHEAD_H = 50
  const GROUP_H = 56
  const totalItems = data.groups.reduce((a, g) => a + g.items.length, 0)
  const isDense = totalItems > 16
  const ROW_H = isDense ? 58 : 68
  const nameFontSize = isDense ? 21 : 24
  const priceFontSize = isDense ? 22 : 26
  const LEGEND_H = 46
  const FOOTER_H = 126

  const bodyH = COLHEAD_H + data.groups.length * GROUP_H + totalItems * ROW_H + LEGEND_H + 24
  const H = HEADER_H + DATEBAR_H + bodyH + FOOTER_H

  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext("2d")
  ctx.direction = "rtl"

  const fillRect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }
  const pillShape = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    roundRectPath(ctx, x, y, w, h, r)
    ctx.fillStyle = color
    ctx.fill()
  }
  const textR = (str: string, x: number, y: number, font: string, color: string) => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText(str, x, y)
  }
  const textL = (str: string, x: number, y: number, font: string, color: string) => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(str, x, y)
  }
  // Pure-Latin strings (domain, @handle) can come out with edge symbols
  // displaced if drawn while ctx.direction is "rtl" — force ltr for these.
  const textLtr = (str: string, x: number, y: number, font: string, color: string, align: "left" | "center" | "right") => {
    const prevDir = ctx.direction
    ctx.direction = "ltr"
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = "middle"
    ctx.fillText(str, x, y)
    ctx.direction = prevDir
  }
  const measure = (str: string, font: string) => {
    ctx.font = font
    return ctx.measureText(str).width
  }
  const truncateToWidth = (str: string, font: string, maxWidth: number) => {
    if (measure(str, font) <= maxWidth) return str
    let lo = 0
    let hi = str.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      const cand = `${str.slice(0, mid).trimEnd()}…`
      if (measure(cand, font) <= maxWidth) lo = mid
      else hi = mid - 1
    }
    return `${str.slice(0, lo).trimEnd()}…`
  }

  // background
  fillRect(0, 0, W, H, CREAM)

  // ── header ──
  fillRect(0, 0, W, HEADER_H, NAVY)
  fillRect(0, HEADER_H - 3, W, 3, GOLD)
  const markSize = 92
  const markX = RIGHT - markSize
  const markY = (HEADER_H - 3 - markSize) / 2
  roundRectPath(ctx, markX, markY, markSize, markSize, 18)
  ctx.fillStyle = NAVY_2
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = "rgba(245,203,92,.45)"
  ctx.stroke()
  const barW = 14
  const gap = 10
  const baseY = markY + markSize - 26
  const bars = [
    { h: 30, x: markX + markSize / 2 - barW * 1.5 - gap },
    { h: 46, x: markX + markSize / 2 - barW / 2 },
    { h: 30, x: markX + markSize / 2 + barW / 2 + gap },
  ]
  for (const b of bars) {
    roundRectPath(ctx, b.x, baseY - b.h, barW, b.h, 3)
    ctx.fillStyle = GOLD
    ctx.fill()
  }
  const brandRight = markX - 22
  textR("تیراژه صنعت خاک", brandRight, 64, "700 34px Vazirmatn Bold", CREAM)
  textR("لیست قیمت روز مصالح ساختمانی", brandRight, 104, "500 19px Vazirmatn Medium", GOLD)

  // ── date bar ──
  const y0 = HEADER_H
  fillRect(0, y0, W, DATEBAR_H, CREAM_2)
  fillRect(0, y0 + DATEBAR_H - 1, W, 1, LINE)
  const dPillFont = "700 19px Vazirmatn Bold"
  const dPillW = measure(data.dateLabel, dPillFont) + 44
  pillShape(RIGHT - dPillW, y0 + (DATEBAR_H - 40) / 2, dPillW, 40, 20, GOLD)
  ctx.fillStyle = NAVY
  ctx.textAlign = "right"
  ctx.textBaseline = "middle"
  ctx.font = dPillFont
  ctx.fillText(data.dateLabel, RIGHT - 22, y0 + DATEBAR_H / 2 + 1)
  textL("معتبر تا اعلام بعدی", LEFT, y0 + DATEBAR_H / 2, "500 18px Vazirmatn Medium", INK_MUTED)

  // ── column header ──
  let y = HEADER_H + DATEBAR_H
  textR("محصول", NAME_RIGHT, y + COLHEAD_H / 2, "700 16px Vazirmatn Bold", INK_MUTED)
  textL("قیمت روز", PRICE_LEFT, y + COLHEAD_H / 2, "700 16px Vazirmatn Bold", INK_MUTED)
  fillRect(LEFT, y + COLHEAD_H - 1, W - MARGIN * 2, 2, INK)
  y += COLHEAD_H + 6

  // ── groups & rows ──
  for (const group of data.groups) {
    pillShape(LEFT, y, W - MARGIN * 2, GROUP_H - 8, 9, CREAM_2)
    const gMidY = y + (GROUP_H - 8) / 2
    textR(group.title, NAME_RIGHT, gMidY, "700 18px Vazirmatn Bold", GOLD_TEXT)
    const titleW = measure(group.title, "700 18px Vazirmatn Bold")
    fillRect(NAME_RIGHT - titleW - 22, gMidY - 4, 8, 8, GOLD_TEXT)
    textL(`(${fa(group.items.length)} قلم)`, LEFT + 18, gMidY, "500 15px Vazirmatn Medium", INK_FAINT)
    y += GROUP_H

    group.items.forEach((item, idx) => {
      if (idx % 2 === 1) fillRect(LEFT, y, W - MARGIN * 2, ROW_H, ROW_ALT)
      const midY = y + ROW_H / 2

      const nameFont = `500 ${nameFontSize}px Vazirmatn Medium`
      const nameMaxW = NAME_RIGHT - NAME_LEFT
      textR(truncateToWidth(item.name, nameFont, nameMaxW), NAME_RIGHT, midY, nameFont, INK)

      fillRect(DIVIDER_X, y + 10, 1, ROW_H - 20, LINE)

      const priceFont = `700 ${priceFontSize}px Vazirmatn Bold`
      const unitFont = "500 14px Vazirmatn Medium"
      textR(fa(item.price), PRICE_RIGHT, midY, priceFont, INK)
      const priceW = measure(fa(item.price), priceFont)
      textR("تومان", PRICE_RIGHT - priceW - 6, midY, unitFont, INK_FAINT)

      const delta = item.previousPrice != null ? item.price - item.previousPrice : 0
      if (item.previousPrice != null && delta !== 0) {
        const up = delta > 0
        const dText = `${up ? "+" : "−"}${fa(Math.abs(delta))}`
        const dFont = "700 15px Vazirmatn Bold"
        const dW = measure(dText, dFont) + 20
        const dH = 30
        pillShape(PRICE_LEFT, midY - dH / 2, dW, dH, 8, up ? UP_BG : DOWN_BG)
        ctx.fillStyle = up ? UP_TX : DOWN_TX
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = dFont
        ctx.fillText(dText, PRICE_LEFT + dW / 2, midY + 1)
      }

      fillRect(LEFT, y + ROW_H - 1, W - MARGIN * 2, 1, LINE_2)
      y += ROW_H
    })
  }

  // ── legend ──
  y += 16
  {
    let lx = NAME_RIGHT
    const midY = y + LEGEND_H / 2 - 6
    const legendItems: Array<[string, string | null, string?, string?]> = [
      ["بدون تغییر", null],
      ["ارزان‌تر از اعلام قبلی", DOWN_BG, DOWN_TX, "−"],
      ["گران‌تر از اعلام قبلی", UP_BG, UP_TX, "+"],
    ]
    for (const [label, bg, tx, sign] of legendItems) {
      const font = "500 15px Vazirmatn Medium"
      const labelW = measure(label, font)
      textR(label, lx, midY, font, INK_FAINT)
      lx -= labelW
      if (bg && tx && sign) {
        const chipFont = "700 14px Vazirmatn Bold"
        const chipW = measure(sign, chipFont) + 16
        lx -= 10
        pillShape(lx - chipW, midY - 13, chipW, 26, 7, bg)
        ctx.fillStyle = tx
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = chipFont
        ctx.fillText(sign, lx - chipW / 2, midY + 1)
        lx -= chipW
      }
      lx -= 26
    }
  }
  y += LEGEND_H

  // ── footer ──
  fillRect(0, H - FOOTER_H, W, FOOTER_H, NAVY)
  const fy1 = H - FOOTER_H + 34
  textR("مبالغ به تومان، درب کارخانه، بدون احتساب حمل و مالیات", NAME_RIGHT, fy1, "500 16px Vazirmatn Medium", "#cdd8e4")
  fillRect(LEFT, H - FOOTER_H + 54, W - MARGIN * 2, 1, "rgba(244,239,227,.15)")
  const fy2 = H - FOOTER_H + 92
  textR(`📞 ثبت سفارش: ${data.sitePhone}`, NAME_RIGHT, fy2, "700 20px Vazirmatn Bold", GOLD)
  textLtr(`${data.siteDomain} 🌐`, W / 2, fy2, "500 19px Vazirmatn Medium", CREAM, "center")
  textLtr(data.channelHandle, LEFT, fy2, "700 19px Vazirmatn Bold", GOLD, "left")

  return canvas.toBuffer("image/png")
}
