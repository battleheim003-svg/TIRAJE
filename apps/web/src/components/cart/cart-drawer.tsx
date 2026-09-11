"use client"

import { useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { X, Trash2, Loader2, ShoppingBag } from "lucide-react"
import { toast } from "@/components/ui/toaster"
import { formatToman } from "@/lib/ui"
import { useCartStore } from "@/stores/cart"
import { removeFromCartAction, updateCartItemAction } from "@/actions/cart"
import styles from "./CartDrawer.module.css"

interface PriceDisplayProps {
  rial: number
  compareRial?: number
  size?: "sm" | "md" | "lg"
}

function PriceDisplay({ rial, compareRial, size = "md" }: PriceDisplayProps) {
  const sizeCls =
    size === "sm"
      ? styles["web-cart-drawer__priceSm"]
      : size === "lg"
        ? styles["web-cart-drawer__priceLg"]
        : styles["web-cart-drawer__priceMd"]
  return (
    <span className={styles["web-cart-drawer__priceWrap"]}>
      <span className={`${styles["web-cart-drawer__priceMain"]} ${sizeCls}`}>{formatToman(rial)}</span>
      {compareRial != null && compareRial > rial && (
        <span className={styles["web-cart-drawer__priceCompare"]}>{formatToman(compareRial)}</span>
      )}
    </span>
  )
}

export function CartDrawer() {
  const t = useTranslations("cart")
  const tCommon = useTranslations("common")
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalRial } =
    useCartStore()
  const [isPending, startTransition] = useTransition()

  const handleRemove = (itemId: string) => {
    startTransition(async () => {
      const result = await removeFromCartAction(itemId)
      if (result.success) {
        removeItem(itemId)
      } else {
        toast({
          title: tCommon("error"),
          description: result.error,
          variant: "error",
        })
      }
    })
  }

  const handleQuantityChange = (itemId: string, currentQty: number, delta: number) => {
    const newQty = Math.round((currentQty + delta) * 2) / 2
    if (newQty < 0.5) return
    startTransition(async () => {
      const result = await updateCartItemAction(itemId, newQty)
      if (result.success) {
        updateQuantity(itemId, newQty)
      } else {
        toast({
          title: tCommon("error"),
          description: result.error,
          variant: "error",
        })
      }
    })
  }

  const total = totalRial()

  return (
    <>
      {isOpen && (
        <div
          className={styles["web-cart-drawer__backdrop"]}
          aria-hidden="true"
          onClick={closeCart}
        />
      )}

      <aside
        role="dialog"
        aria-label={t("title")}
        aria-modal="true"
        className={`${styles["web-cart-drawer__drawer"]} ${
          isOpen ? styles["web-cart-drawer__drawerOpen"] : styles["web-cart-drawer__drawerClosed"]
        }`}
      >
        {/* Header */}
        <div className={styles["web-cart-drawer__header"]}>
          <h2 className={styles["web-cart-drawer__title"]}>
            {t("title")}
            {items.length > 0 && (
              <span className={styles["web-cart-drawer__titleCount"]}>
                ({t("itemCount", { count: items.length })})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={tCommon("close")}
            className={styles["web-cart-drawer__close"]}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className={styles["web-cart-drawer__body"]}>
          {items.length === 0 ? (
            <div className={styles["web-cart-drawer__empty"]}>
              <ShoppingBag
                className={styles["web-cart-drawer__emptyIcon"]}
                style={{ width: "3rem", height: "3rem" }}
                aria-hidden="true"
              />
              <div>
                <p className={styles["web-cart-drawer__emptyTitle"]}>{t("empty")}</p>
                <p className={styles["web-cart-drawer__emptyHint"]}>{t("emptyHint")}</p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className={styles["web-cart-drawer__continueBtn"]}
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <ul className={styles["web-cart-drawer__list"]} role="list">
              {items.map((item) => (
                <li key={item.id} className={styles["web-cart-drawer__item"]}>
                  {/* Thumbnail */}
                  <div className={styles["web-cart-drawer__thumb"]}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        width={64}
                        height={64}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div className={styles["web-cart-drawer__thumbPlaceholder"]}>
                        <ShoppingBag
                          className={styles["web-cart-drawer__emptyIcon"]}
                          style={{ width: "1.5rem", height: "1.5rem" }}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles["web-cart-drawer__details"]}>
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className={styles["web-cart-drawer__productLink"]}
                    >
                      {item.productName}
                    </Link>
                    <PriceDisplay rial={item.pricePerTonRial} size="sm" />

                    {/* Quantity controls */}
                    <div className={styles["web-cart-drawer__qty"]} role="group" aria-label="تنظیم مقدار">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantityTon, -0.5)}
                        disabled={isPending || item.quantityTon <= item.minOrderTon}
                        aria-label="کاهش مقدار"
                        className={styles["web-cart-drawer__qtyBtn"]}
                      >
                        −
                      </button>
                      <span className={styles["web-cart-drawer__qtyVal"]}>
                        {item.quantityTon} {tCommon("ton")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantityTon, 0.5)}
                        disabled={isPending}
                        aria-label="افزایش مقدار"
                        className={styles["web-cart-drawer__qtyBtn"]}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    aria-label={`حذف ${item.productName} از سبد`}
                    className={styles["web-cart-drawer__remove"]}
                  >
                    {isPending ? (
                      <Loader2
                        className={styles["web-cart-drawer__spinner"]}
                        style={{ width: "1rem", height: "1rem" }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2
                        style={{ width: "1rem", height: "1rem" }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles["web-cart-drawer__footer"]}>
            <div className={styles["web-cart-drawer__subtotal"]}>
              <span className={styles["web-cart-drawer__subtotalLabel"]}>{t("subtotal")}</span>
              <PriceDisplay rial={total} size="md" />
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className={styles["web-cart-drawer__checkoutBtn"]}
            >
              {t("checkout")}
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
