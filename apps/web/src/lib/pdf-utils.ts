import path from "path"
import { Font } from "@react-pdf/renderer"

export function toJalali(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(d)
}

export function toJalaliShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tehran",
  }).format(d)
}

let fontRegistered = false

export function registerPdfFonts() {
  if (fontRegistered) return

  const fontDir = path.resolve(
    process.cwd(),
    "../../packages/integrations/src/telegram/assets/fonts"
  )

  Font.register({
    family: "Vazirmatn",
    fonts: [
      {
        src: path.join(fontDir, "Vazirmatn-Regular.ttf"),
        fontWeight: "normal",
      },
      {
        src: path.join(fontDir, "Vazirmatn-Bold.ttf"),
        fontWeight: "bold",
      },
    ],
  })

  fontRegistered = true
}
