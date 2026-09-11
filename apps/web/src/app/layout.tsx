import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"
import { getLocale } from "next-intl/server"
import "./globals.css"

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vazirmatn",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "تیراژه صنعت خاک | مرجع خرید سیمان و مصالح ساختمانی",
    template: "%s | تیراژه صنعت خاک",
  },
  description: "خرید سیمان، مصالح ساختمانی و مواد اولیه از بهترین کارخانه‌ها با تحویل سراسری",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://tirajeconcrete.com"),
  icons: {
    icon: [
      { url: "/tirajeh-icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    siteName: "تیراژه صنعت خاک",
    locale: "fa_IR",
    type: "website",
    images: [{ url: "/og-image.png", width: 2000, height: 1600, alt: "تیراژه صنعت خاک" }],
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
