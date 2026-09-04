"use client"

import { useState, useTransition } from "react"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { addToCartAction } from "@/actions/cart"

interface AddToCartButtonProps {
  productId: string
  minOrderQty: number
  stockStatus: string
  locale: string
}

export default function AddToCartButton({
  productId,
  minOrderQty,
  stockStatus,
  locale,
}: AddToCartButtonProps) {
  const fa = locale === "fa"
  const isOutOfStock = stockStatus === "OUT_OF_STOCK" || stockStatus === "DISCONTINUED"
  const [quantity, setQuantity] = useState(minOrderQty)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleAdd() {
    startTransition(async () => {
      try {
        await addToCartAction(productId, quantity)
        setFeedback({
          ok: true,
          msg: fa ? "به سبد خرید اضافه شد." : "Added to cart.",
        })
      } catch {
        setFeedback({
          ok: false,
          msg: fa ? "خطا رخ داد. مجدد تلاش کنید." : "Something went wrong. Please try again.",
        })
      }
      setTimeout(() => setFeedback(null), 3000)
    })
  }

  return (
    <div className="atc-wrap">
      {/* Quantity stepper */}
      <div className="atc-qty">
        <span className="atc-qty__label">{fa ? "تعداد:" : "Qty:"}</span>
        <div className="atc-qty__control">
          <button
            type="button"
            disabled={isOutOfStock || quantity <= minOrderQty}
            onClick={() => setQuantity((q) => Math.max(minOrderQty, q - 1))}
            className="atc-qty__btn"
            aria-label={fa ? "کاهش" : "Decrease"}
          >
            <Minus style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
          </button>
          <span className="atc-qty__val tabular" aria-live="polite" aria-atomic="true">
            {fa ? quantity.toLocaleString("fa-IR") : quantity}
          </span>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => setQuantity((q) => q + 1)}
            className="atc-qty__btn"
            aria-label={fa ? "افزایش" : "Increase"}
          >
            <Plus style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
          </button>
        </div>
        {minOrderQty > 1 && (
          <span className="atc-qty__min">
            {fa ? `حداقل: ${minOrderQty.toLocaleString("fa-IR")}` : `Min: ${minOrderQty}`}
          </span>
        )}
      </div>

      {/* Add to cart button */}
      <button
        type="button"
        disabled={isOutOfStock || isPending}
        onClick={handleAdd}
        className="atc-btn"
        aria-busy={isPending}
      >
        <ShoppingCart style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
        {isPending
          ? (fa ? "در حال افزودن..." : "Adding...")
          : isOutOfStock
          ? (fa ? "ناموجود" : "Out of Stock")
          : (fa ? "افزودن به سبد خرید" : "Add to Cart")}
      </button>

      {/* Feedback toast */}
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={`atc-feedback ${feedback.ok ? "atc-feedback--ok" : "atc-feedback--err"}`}
        >
          {feedback.msg}
        </p>
      )}

      <style>{`
        .atc-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .atc-qty {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .atc-qty__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .atc-qty__control {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--color-surface);
        }
        .atc-qty__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          color: var(--color-text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .atc-qty__btn:hover:not(:disabled) {
          background-color: var(--color-border-subtle);
          color: var(--color-text);
        }
        .atc-qty__btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .atc-qty__btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }
        .atc-qty__val {
          min-width: 3rem;
          text-align: center;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
          border-inline: 1px solid var(--color-border);
          padding-block: 0.25rem;
        }
        .atc-qty__min {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }

        .atc-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }
        .atc-btn:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .atc-btn:active:not(:disabled) { transform: scale(0.98); }
        .atc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .atc-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }

        .atc-feedback {
          font-size: 0.8125rem;
          text-align: center;
          border-radius: var(--radius-md);
          padding: 0.5rem 1rem;
        }
        .atc-feedback--ok { background-color: var(--color-success-subtle); color: var(--color-success); }
        .atc-feedback--err { background-color: var(--color-danger-subtle); color: var(--color-danger); }
      `}</style>
    </div>
  )
}
