import Image from "next/image"
import Link from "next/link"
import { cookies } from "next/headers"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { ShoppingCart } from "lucide-react"
import { Button } from "@tirajeh/ui"
import { formatToman } from "@/lib/cement"
import CartItemRow from "./cart-item-row"
import styles from "./Cart.module.css"

export const metadata: Metadata = { title: "سبد خرید | تیراژه" }

export default async function CartPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session_id")?.value

  const cartFilter = session?.user
    ? { userId: (session.user as any).id }
    : sessionId
    ? { sessionId }
    : null

  const items: any[] = cartFilter
    ? await db.cartItem.findMany({
        where: cartFilter,
        include: { product: { include: { images: { where: { isPrimary: true } } } } },
      })
    : []

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.product.price) * item.quantity,
    0
  )

  return (
    <div className={styles["web-cart__root"]}>
      <h1 className={styles["web-cart__title"]}>{fa ? "سبد خرید" : "Shopping Cart"}</h1>

      {items.length === 0 ? (
        <div className={styles["web-cart__empty"]}>
          <ShoppingCart
            className={styles["web-cart__empty-icon"]}
            style={{ width: "3.5rem", height: "3.5rem" }}
            aria-hidden="true"
          />
          <p className={styles["web-cart__empty-msg"]}>
            {fa ? "سبد خرید شما در حال حاضر خالی است" : "Your shopping cart is currently empty"}
          </p>
          <div className={styles["web-cart__empty-cta"]}>
            <Button asChild variant="primary" size="lg">
              <Link href={`/${locale}/products`}>
                {fa ? "مشاهده و انتخاب محصولات" : "Browse Products"}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles["web-cart__layout"]}>
          {/* Items List */}
          <div className={styles["web-cart__items"]}>
            {items.map((item: any) => {
              const product = item.product
              const img = product.images?.[0]
              const name = fa ? product.nameFa : (product.nameEn ?? product.nameFa)

              return (
                <div key={item.id} className={styles["web-cart__item"]}>
                  <div className={styles["web-cart__item-thumb"]}>
                    {img ? (
                      <Image
                        src={img.url}
                        alt={fa ? (img.altFa ?? name) : (img.altEn ?? name)}
                        fill
                        className={styles["web-cart__item-img"]}
                        sizes="64px"
                      />
                    ) : (
                      <div className={styles["web-cart__item-placeholder"]} aria-hidden="true" />
                    )}
                  </div>

                  <div className={styles["web-cart__item-info"]}>
                    <Link
                      href={`/${locale}/products/${product.slug}`}
                      className={styles["web-cart__item-name"]}
                    >
                      {name}
                    </Link>
                    <p className={styles["web-cart__item-price"]}>
                      {formatToman(product.price, locale as "fa" | "en")}
                    </p>
                    <CartItemRow
                      itemId={item.id}
                      quantity={item.quantity}
                      minOrderQty={product.minOrderQty}
                      locale={locale}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary Sidebar */}
          <aside className={styles["web-cart__summary"]}>
            <h2 className={styles["web-cart__summary-title"]}>
              {fa ? "خلاصه سفارش" : "Order Summary"}
            </h2>

            <div className={styles["web-cart__summary-row"]}>
              <span>{fa ? "جمع کالاها" : "Subtotal"}</span>
              <span className={styles["web-cart__summary-val"]}>
                {formatToman(subtotal, locale as "fa" | "en")}
              </span>
            </div>

            <div className={styles["web-cart__summary-row"]}>
              <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
              <span className={styles["web-cart__summary-note"]}>
                {fa ? "محاسبه در مرحله بعد" : "Calculated at checkout"}
              </span>
            </div>

            <div className={styles["web-cart__summary-row"]}>
              <span>{fa ? "تخفیف" : "Discount"}</span>
              <span className={styles["web-cart__summary-val"]}>
                {fa ? "۰ تومان" : "0 Toman"}
              </span>
            </div>

            <div className={styles["web-cart__summary-total"]}>
              <span>{fa ? "مبلغ قابل پرداخت" : "Total Amount"}</span>
              <span className={styles["web-cart__summary-total-val"]}>
                {formatToman(subtotal, locale as "fa" | "en")}
              </span>
            </div>

            <div className={styles["web-cart__summary-actions"]}>
              <Button asChild variant="success" size="lg" className={styles["web-cart__summary-btn"]}>
                <Link href={`/${locale}/checkout`}>
                  {fa ? "ادامه فرآیند خرید" : "Proceed to Checkout"}
                </Link>
              </Button>

              <Link href={`/${locale}/products`} className={styles["web-cart__continue-link"]}>
                {fa ? "ادامه خرید محصولات" : "Continue Shopping"}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
