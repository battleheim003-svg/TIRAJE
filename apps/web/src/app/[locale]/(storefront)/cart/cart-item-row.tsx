"use client"

import { useState, useTransition } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { updateCartItemAction, removeFromCartAction } from "@/actions/cart"
import styles from "./Cart.module.css"

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
    const validQty = Math.max(minOrderQty, newQty)
    setQty(validQty)
    startTransition(() => {
      void updateCartItemAction(itemId, validQty)
    })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) {
      handleUpdate(val)
    }
  }

  function handleRemove() {
    startTransition(() => {
      void removeFromCartAction(itemId)
    })
  }

  return (
    <div className={styles["web-cart__controls"]}>
      <div className={styles["web-cart__stepper"]}>
        <button
          type="button"
          disabled={isPending || qty <= minOrderQty}
          onClick={() => handleUpdate(qty - 1)}
          className={styles["web-cart__step-btn"]}
          aria-label={fa ? "کاهش تعداد" : "Decrease quantity"}
        >
          <Minus style={{ width: "0.875rem", height: "0.875rem" }} />
        </button>
        <input
          type="number"
          min={minOrderQty}
          value={qty}
          onChange={handleInputChange}
          className={styles["web-cart__qty-input"]}
          aria-label={fa ? "تعداد" : "Quantity"}
          disabled={isPending}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleUpdate(qty + 1)}
          className={styles["web-cart__step-btn"]}
          aria-label={fa ? "افزایش تعداد" : "Increase quantity"}
        >
          <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
        </button>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleRemove}
        className={styles["web-cart__remove-btn"]}
        aria-label={fa ? "حذف از سبد خرید" : "Remove from cart"}
      >
        <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
        <span>{fa ? "حذف" : "Remove"}</span>
      </button>
    </div>
  )
}
