"use client"

import { useState, useTransition } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { updateCartItemAction, removeFromCartAction } from "@/actions/cart"

interface CartItemRowProps {
  itemId: string
  quantity: number
  minOrderQty: number
  locale: string
}

export default function CartItemRow({ itemId, quantity, minOrderQty, locale }: CartItemRowProps) {
  const fa = locale === "fa"
  const [qty, setQty] = useState(quantity)
  const [isPending, startTransition] = useTransition()

  function handleUpdate(newQty: number) {
    setQty(newQty)
    startTransition(() => { void updateCartItemAction(itemId, newQty) })
  }

  function handleRemove() {
    startTransition(() => { void removeFromCartAction(itemId) })
  }

  return (
    <>
      <div className="cir-root">
        <div className="cir-stepper">
          <button
            type="button"
            disabled={isPending || qty <= minOrderQty}
            onClick={() => handleUpdate(Math.max(minOrderQty, qty - 1))}
            className="cir-step-btn"
            aria-label={fa ? "کاهش" : "Decrease"}
          >
            <Minus style={{ width: "0.875rem", height: "0.875rem" }} />
          </button>
          <span className="cir-qty">
            {fa ? qty.toLocaleString("fa-IR") : qty}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleUpdate(qty + 1)}
            className="cir-step-btn"
            aria-label={fa ? "افزایش" : "Increase"}
          >
            <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
          </button>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleRemove}
          className="cir-remove"
          aria-label={fa ? "حذف از سبد" : "Remove from cart"}
        >
          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
          <span>{fa ? "حذف" : "Remove"}</span>
        </button>
      </div>

      <style>{`
        .cir-root {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.625rem;
        }
        .cir-stepper {
          display: flex;
          align-items: center;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .cir-step-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-secondary);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .cir-step-btn:hover:not(:disabled) {
          background-color: var(--color-border-subtle);
          color: var(--color-text);
        }
        .cir-step-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cir-qty {
          width: 2.5rem;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
        }
        .cir-remove {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-danger);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.375rem;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }
        .cir-remove:hover:not(:disabled) { background-color: var(--color-danger-subtle); }
        .cir-remove:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </>
  )
}
