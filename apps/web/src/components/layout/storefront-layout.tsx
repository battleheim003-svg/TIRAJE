import { getLocale } from "next-intl/server"
import { PriceTicker } from "./price-ticker"
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { getCartCountAction } from "@/actions/cart"

interface StorefrontLayoutProps {
  children: React.ReactNode
}

export async function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const cartCount = await getCartCountAction()

  return (
    <>
      <a href="#main-content" className="web-skip-link">
        {fa ? "پرش به محتوای اصلی" : "Skip to main content"}
      </a>
      <PriceTicker locale={locale} />
      <Navbar cartCount={cartCount} />
      <main id="main-content" style={{ minHeight: "calc(100dvh - 4rem)" }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}

