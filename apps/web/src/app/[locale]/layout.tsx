import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { Toaster } from "@/components/ui/toaster"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "fa" | "en")) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <Toaster />
    </NextIntlClientProvider>
  )
}
