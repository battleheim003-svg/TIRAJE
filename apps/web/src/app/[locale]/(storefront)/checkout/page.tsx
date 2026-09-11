import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import CheckoutForm from "./CheckoutForm"
import styles from "./Checkout.module.css"

export const metadata: Metadata = { title: "تکمیل خرید و پرداخت | تیراژه" }

export default async function CheckoutPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/checkout`)
  }

  const userId = (session.user as any).id

  const items = await db.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          nameFa: true,
          nameEn: true,
          price: true,
          stockQty: true,
          isActive: true,
        },
      },
    },
  })

  if (items.length === 0) {
    redirect(`/${locale}/cart`)
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  const serializedItems = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      nameFa: item.product.nameFa,
      nameEn: item.product.nameEn,
      price: Number(item.product.price),
    },
  }))

  return (
    <div className={styles["web-chk__root"]}>
      <h1 className={styles["web-chk__title"]}>
        {fa ? "تکمیل و نهایی‌سازی سفارش" : "Checkout & Order Confirmation"}
      </h1>

      <CheckoutForm
        subtotal={subtotal}
        items={serializedItems}
        locale={locale}
      />
    </div>
  )
}
