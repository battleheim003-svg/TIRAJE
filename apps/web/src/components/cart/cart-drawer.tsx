"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { X, Trash2, Loader2, ShoppingBag } from "lucide-react"
import { toast } from "@/components/ui/toaster"
import { formatToman } from "@tirajeh/shared"
import { useUIStore } from "@/stores/ui"
import {
  getCartAction,
  removeFromCartAction,
  updateCartItemAction,
  type CartLine,
} from "@/actions/cart"
import styles from "./CartDrawer.module.css"

interface PriceDisplayProps {
  toman: number
  compareToman?: number | null
  size?: "sm" | "md" | "lg"
  locale: "fa" | "en"
}

function PriceDisplay({ toman, compareToman, size = "md", locale }: PriceDisplayProps) {
  const sizeCls =
    size === "sm"
      ? styles["web-cart-drawer__priceSm"]
      : size === "lg"
        ? styles["web-cart-drawer__priceLg"]
        : styles["web-cart-drawer__priceMd"]
  return (
    <span className={styles["web-cart-drawer__priceWrap"]}>
      <span className={`${styles["web-cart-drawer__priceMain"]} ${sizeCls}`}>
        {formatToman(toman, locale)}
      </span>
      {compareToman != null && compareToman > toman && (
        <span className={styles["web-cart-drawer__priceCompare"]}>
          {formatToman(compareToman, locale)}
        </span>
      )}
    </span>
  )
}

export function CartDrawer() {
  const t = useTranslations("cart")
  const tCommon = useTranslations("common")
  const locale = useLocale() as "fa" | "en"
  const fa = locale === "fa"

  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore()
  const [items, setItems] = useState<CartLine[]>([])
  const [subtotalToman, setSubtotalToman] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadCart = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCartAction()
      setItems(data.items)
      setSubtotalToman(data.subtotalToman)
      setTotalCount(data.totalCount)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (cartDrawerOpen) {
      loadCart()
    }
  }, [cartDrawerOpen, loadCart])

  const handleClose = () => {
    setCartDrawerOpen(false)
  }

  const handleRemove = (itemId: string) => {
    startTransition(async () => {
      const result = await removeFromCartAction(itemId)
      if (result.success) {
        await loadCart()
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
    const newQty = currentQty + delta
    if (newQty < 1) return
    startTransition(async () => {
      const result = await updateCartItemAction(itemId, newQty)
      if (result.success) {
        await loadCart()
      } else {
        toast({
          title: tCommon("error"),
          description: result.error,
          variant: "error",
        })
      }
    })
  }

  return (
    <>
      {cartDrawerOpen && (
        <div
          className={styles["web-cart-drawer__backdrop"]}
          aria-hidden="true"
          onClick={handleClose}
        />
      )}

      <aside
        role="dialog"
        aria-label={t("title")}
        aria-modal="true"
        className={`${styles["web-cart-drawer__drawer"]} ${
          cartDrawerOpen ? styles["web-cart-drawer__drawerOpen"] : styles["web-cart-drawer__drawerClosed"]
        }`}
      >
        {/* Header */}
        <div className={styles["web-cart-drawer__header"]}>
          <h2 className={styles["web-cart-drawer__title"]}>
            {t("title")}
            {totalCount > 0 && (
              <span className={styles["web-cart-drawer__titleCount"]}>
                ({t("itemCount", { count: totalCount })})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={tCommon("close")}
            className={styles["web-cart-drawer__close"]}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className={styles["web-cart-drawer__body"]}>
          {isLoading && items.length === 0 ? (
            <div className={styles["web-cart-drawer__empty"]}>
              <Loader2
                className={styles["web-cart-drawer__spinner"]}
                style={{ width: "2.5rem", height: "2.5rem" }}
                aria-hidden="true"
              />
            </div>
          ) : items.length === 0 ? (
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
                onClick={handleClose}
                className={styles["web-cart-drawer__continueBtn"]}
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <ul className={styles["web-cart-drawer__list"]} role="list">
              {items.map((item) => {
                const name = fa ? item.productNameFa : (item.productNameEn ?? item.productNameFa)
                return (
                  <li key={item.id} className={styles["web-cart-drawer__item"]}>
                    {/* Thumbnail */}
                    <div className={styles["web-cart-drawer__thumb"]}>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={name}
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
                        href={`/${locale}/products/${item.slug}`}
                        onClick={handleClose}
                        className={styles["web-cart-drawer__productLink"]}
                      >
                        {name}
                      </Link>
                      <PriceDisplay
                        toman={item.unitPriceToman}
                        compareToman={item.comparePriceToman}
                        size="sm"
                        locale={locale}
                      />

                      {/* Quantity controls */}
                      <div className={styles["web-cart-drawer__qty"]} role="group" aria-label={fa ? "تنظیم مقدار" : "Quantity"}>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          disabled={isPending || item.quantity <= item.minOrderQty}
                          aria-label={fa ? "کاهش مقدار" : "Decrease quantity"}
                          className={styles["web-cart-drawer__qtyBtn"]}
                        >
                          −
                        </button>
                        <span className={styles["web-cart-drawer__qtyVal"]}>
                          {item.quantity} {fa ? "عدد" : "qty"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          disabled={isPending || item.quantity >= item.stockQty}
                          aria-label={fa ? "افزایش مقدار" : "Increase quantity"}
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
                      aria-label={fa ? `حذف ${name} از سبد` : `Remove ${name}`}
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
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles["web-cart-drawer__footer"]}>
            <div className={styles["web-cart-drawer__subtotal"]}>
              <span className={styles["web-cart-drawer__subtotalLabel"]}>{t("subtotal")}</span>
              <PriceDisplay toman={subtotalToman} size="md" locale={locale} />
            </div>
            <Link
              href={`/${locale}/checkout`}
              onClick={handleClose}
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

