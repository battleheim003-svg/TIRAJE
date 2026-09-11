"use client"

import { useState, useTransition } from "react"
import { ShoppingCart, Minus, Plus, PhoneCall, Scale, Calculator } from "lucide-react"
import { Button } from "@tirajeh/ui"
import { addToCartAction } from "@/actions/cart"
import styles from "./AddToCart.module.css"

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
    <div className={styles["web-atc"]}>
      {/* Live Calculation Box */}
      <div className={styles["web-atc__calc-card"]}>
        <div className={styles["web-atc__calc-row"]}>
          <div className={styles["web-atc__calc-item"]}>
            <span className={styles["web-atc__calc-label"]}>
              <Scale style={{ width: "0.875rem", height: "0.875rem" }} />
              {fa ? "وزن کل بار:" : "Total Weight:"}
            </span>
            <span className={styles["web-atc__calc-val"]}>
              {fa
                ? `${Number(totalTonnage).toLocaleString("fa-IR")} تن (${totalWeightKg.toLocaleString("fa-IR")} کیلوگرم)`
                : `${totalTonnage} Tons (${totalWeightKg} kg)`}
            </span>
          </div>

          {unitPrice > 0 && (
            <div className={styles["web-atc__calc-item"]}>
              <span className={styles["web-atc__calc-label"]}>
                <Calculator style={{ width: "0.875rem", height: "0.875rem" }} />
                {fa ? "مبلغ سفارش:" : "Total Price:"}
              </span>
              <span className={styles["web-atc__calc-price"]}>
                {fa
                  ? `${totalPrice.toLocaleString("fa-IR")} تومان`
                  : `${totalPrice.toLocaleString()} Tomans`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selector & Add Button */}
      <div className={styles["web-atc__action-row"]}>
        <div className={styles["web-atc__qty-box"]}>
          <button
            type="button"
            disabled={isOutOfStock || quantity <= minOrderQty}
            onClick={() => setQuantity((q) => Math.max(minOrderQty, q - (q > 50 ? 10 : 1)))}
            className={styles["web-atc__qty-btn"]}
            aria-label={fa ? "کاهش تعداد" : "Decrease"}
          >
            <Minus style={{ width: "1rem", height: "1rem" }} />
          </button>
          <div className={styles["web-atc__qty-display"]}>
            <span className={styles["web-atc__qty-number"]}>
              {fa ? quantity.toLocaleString("fa-IR") : quantity}
            </span>
            <span className={styles["web-atc__qty-unit"]}>{fa ? "کیسه" : "bags"}</span>
          </div>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => setQuantity((q) => q + (q >= 50 ? 10 : 1))}
            className={styles["web-atc__qty-btn"]}
            aria-label={fa ? "افزایش تعداد" : "Increase"}
          >
            <Plus style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isOutOfStock || isPending}
          onClick={handleAdd}
          className={styles["web-atc__submit-btn"]}
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
        </Button>
      </div>

      {/* Bulk Order / Consultation Phone CTA */}
      <a href="tel:05138331904" className={styles["web-atc__call-btn"]}>
        <PhoneCall
          className={styles["web-atc__call-icon"]}
          style={{ width: "1.125rem", height: "1.125rem" }}
        />
        <div className={styles["web-atc__call-text"]}>
          <span className={styles["web-atc__call-title"]}>
            {fa ? "سفارش تناژ بالا و استعلام قیمت لحظه‌ای کارخانه" : "High-Tonnage Order & Inquiry"}
          </span>
          <span className={styles["web-atc__call-phone"]}>۰۵۱-۳۸۳۳۱۹۰۴ (واحد فروش تیراژه)</span>
        </div>
      </a>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`${styles["web-atc__toast"]} ${
            feedback.ok ? styles["web-atc__toast--success"] : styles["web-atc__toast--error"]
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  )
}