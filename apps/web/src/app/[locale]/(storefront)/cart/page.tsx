import Image from "next/image"
import Link from "next/link"
import { cookies } from "next/headers"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { ShoppingCart } from "lucide-react"
import { formatPrice } from "@/lib/cement"
import CartItemRow from "./cart-item-row"

export const metadata: Metadata = { title: "سبد خرید | تیراژه" }

export default async function CartPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session_id")?.value

  const items: any[] = await db.cartItem.findMany({
    where: session?.user
      ? { userId: (session.user as any).id }
      : sessionId
      ? { sessionId }
      : { id: "never" },
    include: { product: { include: { images: { where: { isPrimary: true } } } } },
  })

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.product.price) * item.quantity,
    0
  )

  return (
    <>
      <div className="cart-root">
        <h1 className="cart-title">{fa ? "سبد خرید" : "Shopping Cart"}</h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart
              style={{ width: "3rem", height: "3rem", color: "var(--color-text-muted)", opacity: 0.5 }}
              aria-hidden="true"
            />
            <p className="cart-empty__msg">
              {fa ? "سبد خرید شما خالی است" : "Your cart is empty"}
            </p>
            <Link href={`/${locale}/products`} className="cart-empty__cta">
              {fa ? "مشاهده محصولات" : "Browse Products"}
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items">
              {items.map((item: any) => {
                const product = item.product
                const img = product.images?.[0]
                const name = fa ? product.nameFa : (product.nameEn ?? product.nameFa)
                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__img-wrap">
                      {img ? (
                        <Image
                          src={img.url}
                          alt={fa ? (img.altFa ?? name) : (img.altEn ?? name)}
                          fill
                          className="cart-item__img"
                          sizes="80px"
                        />
                      ) : (
                        <div className="cart-item__img-placeholder" aria-hidden="true" />
                      )}
                    </div>
                    <div className="cart-item__body">
                      <Link
                        href={`/${locale}/products/${product.slug}`}
                        className="cart-item__name"
                      >
                        {name}
                      </Link>
                      <p className="cart-item__price">{formatPrice(product.price, locale)}</p>
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

            {/* Summary */}
            <aside className="cart-summary">
              <h2 className="cart-summary__title">{fa ? "خلاصه سفارش" : "Order Summary"}</h2>

              <div className="cart-summary__row">
                <span>{fa ? "جمع کالاها" : "Subtotal"}</span>
                <span className="cart-summary__val">{formatPrice(subtotal, locale)}</span>
              </div>
              <div className="cart-summary__row">
                <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
                <span className="cart-summary__note">
                  {fa ? "محاسبه در مرحله بعد" : "Calculated at checkout"}
                </span>
              </div>

              <hr className="cart-summary__divider" />

              <div className="cart-summary__row cart-summary__total">
                <span>{fa ? "مجموع" : "Total"}</span>
                <span className="cart-summary__total-val">{formatPrice(subtotal, locale)}</span>
              </div>

              <Link href={`/${locale}/checkout`} className="cart-checkout-btn">
                {fa ? "ادامه فرآیند خرید" : "Proceed to Checkout"}
              </Link>
              <Link href={`/${locale}/products`} className="cart-continue-btn">
                {fa ? "ادامه خرید" : "Continue Shopping"}
              </Link>
            </aside>
          </div>
        )}
      </div>

      <style>{`
        .cart-root {
          max-width: 56rem;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .cart-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        /* Empty state */
        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 1rem;
          text-align: center;
          gap: 1rem;
        }
        .cart-empty__msg {
          font-size: 1.0625rem;
          color: var(--color-text-muted);
        }
        .cart-empty__cta {
          display: inline-block;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.625rem 1.75rem;
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: background-color var(--transition-fast);
        }
        .cart-empty__cta:hover { background-color: var(--color-accent-hover); }

        /* Layout */
        .cart-layout {
          display: grid;
          gap: 2rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 1024px) {
          .cart-layout { grid-template-columns: 1fr 20rem; }
        }

        /* Item */
        .cart-items { display: flex; flex-direction: column; gap: 0.875rem; }
        .cart-item {
          display: flex;
          gap: 1rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1rem;
        }
        .cart-item__img-wrap {
          position: relative;
          width: 5rem;
          height: 5rem;
          flex-shrink: 0;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background-color: var(--color-background);
          border: 1px solid var(--color-border-subtle);
        }
        .cart-item__img {
          object-fit: contain;
          padding: 0.25rem;
        }
        .cart-item__img-placeholder {
          width: 100%;
          height: 100%;
          background-color: var(--color-border-subtle);
        }
        .cart-item__body { flex: 1; min-width: 0; }
        .cart-item__name {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text);
          text-decoration: none;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
        }
        .cart-item__name:hover { color: var(--color-accent); }
        .cart-item__price {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-accent);
          margin-top: 0.25rem;
          font-variant-numeric: tabular-nums;
        }

        /* Summary */
        .cart-summary {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          position: sticky;
          top: 5.5rem;
          align-self: start;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .cart-summary__title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-text);
        }
        .cart-summary__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }
        .cart-summary__val {
          font-weight: 600;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
        }
        .cart-summary__note {
          color: var(--color-text-muted);
          font-size: 0.8125rem;
        }
        .cart-summary__divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: 0.25rem 0;
        }
        .cart-summary__total {
          font-weight: 700;
          color: var(--color-text);
        }
        .cart-summary__total-val {
          font-size: 1.0625rem;
          font-weight: 800;
          color: var(--color-accent);
          font-variant-numeric: tabular-nums;
        }
        .cart-checkout-btn {
          display: block;
          width: 100%;
          text-align: center;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.6875rem 1rem;
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: background-color var(--transition-fast);
          margin-top: 0.25rem;
        }
        .cart-checkout-btn:hover { background-color: var(--color-accent-hover); }
        .cart-continue-btn {
          display: block;
          width: 100%;
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .cart-continue-btn:hover { color: var(--color-text-secondary); }
      `}</style>
    </>
  )
}
