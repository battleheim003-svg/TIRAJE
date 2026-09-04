import Link from "next/link"
import { getLocale } from "next-intl/server"
import { CheckCircle } from "lucide-react"

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams
  const orderNumber = sp.order ?? ""

  return (
    <>
      <div className="cs-root">
        <CheckCircle className="cs-icon" aria-hidden="true" />
        <h1 className="cs-title">{fa ? "سفارش شما ثبت شد!" : "Order Placed!"}</h1>
        {orderNumber && (
          <p className="cs-num">
            {fa ? `شماره سفارش: ${orderNumber}` : `Order #${orderNumber}`}
          </p>
        )}
        <p className="cs-msg">
          {fa
            ? "با شما تماس میگیریم تا جزئیات تحویل را هماهنگ کنیم."
            : "We'll contact you to coordinate delivery details."}
        </p>
        <div className="cs-actions">
          <Link href={`/${locale}/account/orders`} className="cs-btn cs-btn--primary">
            {fa ? "مشاهده سفارشهایم" : "My Orders"}
          </Link>
          <Link href={`/${locale}/products`} className="cs-btn cs-btn--secondary">
            {fa ? "ادامه خرید" : "Continue Shopping"}
          </Link>
        </div>
      </div>

      <style>{`
        .cs-root {
          min-height: 60vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 3rem 1rem; gap: 1rem;
        }
        .cs-icon { width: 4rem; height: 4rem; color: var(--color-success, #16a34a); }
        .cs-title { font-size: 1.75rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em; }
        .cs-num { font-size: 1rem; font-weight: 700; color: var(--color-accent); font-variant-numeric: tabular-nums; }
        .cs-msg { font-size: 0.9375rem; color: var(--color-text-muted); max-width: 28rem; line-height: 1.7; }
        .cs-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
        .cs-btn { display: inline-block; font-size: 0.9375rem; font-weight: 700; padding: 0.625rem 1.5rem; border-radius: var(--radius-lg); text-decoration: none; transition: background-color var(--transition-fast); }
        .cs-btn--primary { background-color: var(--color-accent); color: #fff; }
        .cs-btn--primary:hover { background-color: var(--color-accent-hover); }
        .cs-btn--secondary { background-color: var(--color-surface); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
        .cs-btn--secondary:hover { border-color: var(--color-accent); color: var(--color-accent); }
      `}</style>
    </>
  )
}
