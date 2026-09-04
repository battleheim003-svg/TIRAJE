"use client"

import { useState, useTransition } from "react"
import { ShoppingCart, Minus, Plus, PhoneCall, Scale, Calculator } from "lucide-react"
import { addToCartAction } from "@/actions/cart"

interface AddToCartButtonProps {
  productId: string
  minOrderQty: number
  stockStatus: string
  locale: string
  unitPrice?: number
  unitWeightKg?: number
}

export default function AddToCartButton({
  productId,
  minOrderQty,
  stockStatus,
  locale,
  unitPrice = 0,
  unitWeightKg = 50,
}: AddToCartButtonProps) {
  const fa = locale === "fa"
  const isOutOfStock = stockStatus === "OUT_OF_STOCK" || stockStatus === "DISCONTINUED"
  const [quantity, setQuantity] = useState(Math.max(1, minOrderQty))
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const totalWeightKg = quantity * unitWeightKg
  const totalTonnage = (totalWeightKg / 1000).toFixed(2)
  const totalPrice = quantity * unitPrice

  function handleAdd() {
    startTransition(async () => {
      try {
        const res = await addToCartAction(productId, quantity)
        if (res.success) {
          setFeedback({
            ok: true,
            msg: fa ? `${quantity} کیسه به سبد خرید اضافه شد.` : `Added ${quantity} items to cart.`,
          })
        } else {
          setFeedback({
            ok: false,
            msg: res.error || (fa ? "خطا رخ داد. مجدد تلاش کنید." : "Failed to add to cart."),
          })
        }
      } catch {
        setFeedback({
          ok: false,
          msg: fa ? "خطای اتصال به سرور." : "Network error. Please try again.",
        })
      }
      setTimeout(() => setFeedback(null), 4000)
    })
  }

  return (
    <div className="atc-container">
      {/* Live Calculation Box */}
      <div className="atc-calc-card">
        <div className="atc-calc-row">
          <div className="atc-calc-item">
            <span className="atc-calc-label">
              <Scale style={{ width: "0.875rem", height: "0.875rem" }} />
              {fa ? "وزن کل بار:" : "Total Weight:"}
            </span>
            <span className="atc-calc-val tabular">
              {fa
                ? `${Number(totalTonnage).toLocaleString("fa-IR")} تن (${totalWeightKg.toLocaleString("fa-IR")} کیلوگرم)`
                : `${totalTonnage} Tons (${totalWeightKg} kg)`}
            </span>
          </div>

          {unitPrice > 0 && (
            <div className="atc-calc-item">
              <span className="atc-calc-label">
                <Calculator style={{ width: "0.875rem", height: "0.875rem" }} />
                {fa ? "مبلغ سفارش:" : "Total Price:"}
              </span>
              <span className="atc-calc-price tabular">
                {fa
                  ? `${totalPrice.toLocaleString("fa-IR")} تومان`
                  : `${totalPrice.toLocaleString()} Tomans`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selector & Add Button */}
      <div className="atc-action-row">
        <div className="atc-qty-box">
          <button
            type="button"
            disabled={isOutOfStock || quantity <= minOrderQty}
            onClick={() => setQuantity((q) => Math.max(minOrderQty, q - (q > 50 ? 10 : 1)))}
            className="atc-qty-btn"
            aria-label={fa ? "کاهش تعداد" : "Decrease"}
          >
            <Minus style={{ width: "1rem", height: "1rem" }} />
          </button>
          <div className="atc-qty-display">
            <span className="atc-qty-number tabular">
              {fa ? quantity.toLocaleString("fa-IR") : quantity}
            </span>
            <span className="atc-qty-unit">{fa ? "کیسه" : "bags"}</span>
          </div>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => setQuantity((q) => q + (q >= 50 ? 10 : 1))}
            className="atc-qty-btn"
            aria-label={fa ? "افزایش تعداد" : "Increase"}
          >
            <Plus style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>

        <button
          type="button"
          disabled={isOutOfStock || isPending}
          onClick={handleAdd}
          className="atc-submit-btn"
          aria-busy={isPending}
        >
          <ShoppingCart style={{ width: "1.25rem", height: "1.25rem" }} />
          <span>
            {isPending
              ? (fa ? "در حال ثبت در سبد..." : "Adding...")
              : isOutOfStock
              ? (fa ? "ناموجود در این انبار" : "Out of Stock")
              : (fa ? "افزودن به سبد خرید" : "Add to Cart")}
          </span>
        </button>
      </div>

      {/* Bulk Order / Consultation Phone CTA */}
      <a href="tel:05138331904" className="atc-call-btn">
        <PhoneCall style={{ width: "1.125rem", height: "1.125rem" }} />
        <div className="atc-call-text">
          <span className="atc-call-title">
            {fa ? "سفارش تناژ بالا و استعلام قیمت لحظه‌ای کارخانه" : "High-Tonnage Order & Inquiry"}
          </span>
          <span className="atc-call-phone">۰۵۱-۳۸۳۳۱۹۰۴ (واحد فروش تیراژه)</span>
        </div>
      </a>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`atc-toast ${feedback.ok ? "atc-toast--success" : "atc-toast--error"}`}
        >
          {feedback.msg}
        </div>
      )}

      <style>{`
        .atc-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        .atc-calc-card {
          background-color: var(--color-surface, #1e293b);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg, 0.75rem);
          padding: 0.875rem 1rem;
        }
        .atc-calc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .atc-calc-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .atc-calc-label {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        .atc-calc-val {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .atc-calc-price {
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-accent);
        }
        .atc-action-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .atc-qty-box {
          display: inline-flex;
          align-items: center;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0.25rem;
          min-width: 9rem;
          justify-content: space-between;
        }
        .atc-qty-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-md);
          border: none;
          background-color: transparent;
          color: var(--color-text);
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .atc-qty-btn:hover:not(:disabled) {
          background-color: var(--color-background);
          color: var(--color-accent);
        }
        .atc-qty-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .atc-qty-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
          padding: 0 0.5rem;
        }
        .atc-qty-number {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-text);
        }
        .atc-qty-unit {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .atc-submit-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          min-width: 12rem;
          padding: 0.75rem 1.5rem;
          background-color: var(--color-accent);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--color-accent) 30%, transparent);
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .atc-submit-btn:hover:not(:disabled) {
          background-color: var(--color-accent-hover);
          transform: translateY(-1px);
        }
        .atc-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .atc-call-btn {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.03));
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-lg);
          color: var(--color-text);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .atc-call-btn:hover {
          border-color: rgba(16, 185, 129, 0.5);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(16, 185, 129, 0.06));
        }
        .atc-call-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .atc-call-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #10b981;
        }
        .atc-call-phone {
          font-size: 0.875rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .atc-toast {
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          animation: fadeIn 0.2s ease;
        }
        .atc-toast--success {
          background-color: #064e3b;
          color: #a7f3d0;
          border: 1px solid #059669;
        }
        .atc-toast--error {
          background-color: #7f1d1d;
          color: #fecaca;
          border: 1px solid #dc2626;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
