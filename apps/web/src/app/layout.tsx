import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"
import { getLocale } from "next-intl/server"
import "./globals.css"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: {
    default: "تیراژه | مرجع خرید سیمان و مصالح ساختمانی",
    template: "%s | تیراژه",
  },
  description: "خرید سیمان، مصالح ساختمانی و مواد اولیه از بهترین کارخانه‌ها با تحویل سراسری",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://tirajeh.ir"),
  openGraph: {
    siteName: "تیراژه",
    locale: "fa_IR",
    type: "website",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const dir = locale === "fa" ? "rtl" : "ltr"

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={vazirmatn.variable}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={vazirmatn.className}>{children}</body>
    </html>
  )
}
