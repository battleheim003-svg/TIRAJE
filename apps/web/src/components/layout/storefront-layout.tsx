import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { CartDrawer } from "@/components/cart/cart-drawer"

interface StorefrontLayoutProps {
  children: React.ReactNode
}

export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100dvh - 4rem)" }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
