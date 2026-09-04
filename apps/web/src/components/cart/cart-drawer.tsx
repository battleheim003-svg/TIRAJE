"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { X, Trash2, Loader2, ShoppingBag } from "lucide-react"
import { toast } from "@/components/ui/toaster"
import { formatToman } from "@/lib/ui"
import { useCartStore } from "@/stores/cart"
import { removeFromCartAction, updateCartItemAction } from "@/actions/cart"

interface PriceDisplayProps {
  rial: number
  compareRial?: number
  size?: "sm" | "md" | "lg"
}

function PriceDisplay({ rial, compareRial, size = "md" }: PriceDisplayProps) {
  const sizeCls =
    size === "sm" ? "cd-price--sm" : size === "lg" ? "cd-price--lg" : "cd-price--md"
  return (
    <span className="cd-price-wrap">
      <span className={`cd-price-main ${sizeCls}`}>{formatToman(rial)}</span>
      {compareRial != null && compareRial > rial && (
        <span className="cd-price-compare">{formatToman(compareRial)}</span>
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
      <style>{`
        .cd-backdrop {
          position: fixed; inset: 0; z-index: 40;
          background-color: rgb(0 0 0 / 0.4); backdrop-filter: blur(4px);
        }
        .cd-drawer {
          position: fixed; inset-block: 0; inset-inline-end: 0; z-index: 50;
          display: flex; flex-direction: column;
          width: 100%; max-width: 28rem;
          background-color: var(--color-surface);
          box-shadow: var(--shadow-lg);
          transition: transform 300ms ease-in-out;
        }
        .cd-drawer--open  { transform: translateX(0); }
        .cd-drawer--closed { transform: translateX(100%); }
        [dir="rtl"] .cd-drawer--closed { transform: translateX(-100%); }

        .cd-header {
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--color-border);
          padding: 1rem 1.25rem;
        }
        .cd-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }
        .cd-title-count { margin-inline-start: 0.5rem; font-size: 0.875rem; font-weight: 400; color: var(--color-text-muted); }
        .cd-close {
          display: flex; align-items: center; justify-content: center;
          padding: 0.375rem; border-radius: var(--radius-md);
          background: none; border: none; cursor: pointer;
          color: var(--color-text-muted);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .cd-close:hover { background-color: var(--color-border-subtle); color: var(--color-text); }
        .cd-close-icon { width: 1.25rem; height: 1.25rem; }

        .cd-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; }

        .cd-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem 0; text-align: center; gap: 1rem;
        }
        .cd-empty-icon { width: 3rem; height: 3rem; color: var(--color-text-disabled); }
        .cd-empty-title { font-weight: 500; color: var(--color-text-secondary); }
        .cd-empty-hint { margin-top: 0.25rem; font-size: 0.875rem; color: var(--color-text-muted); }
        .cd-continue-btn {
          margin-top: 0.5rem;
          font-size: 0.875rem; font-weight: 500; font-family: inherit;
          padding: 0.4375rem 1rem;
          background: none; border: 1px solid var(--color-border);
          border-radius: var(--radius-md); cursor: pointer;
          color: var(--color-text-secondary);
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .cd-continue-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

        .cd-list { display: flex; flex-direction: column; list-style: none; padding: 0; margin: 0; }
        .cd-item {
          display: flex; gap: 1rem; padding: 1rem 0;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .cd-item:last-child { border-bottom: none; }

        .cd-thumb {
          width: 4rem; height: 4rem; flex-shrink: 0;
          border-radius: var(--radius-lg);
          background-color: var(--color-border-subtle);
          overflow: hidden;
        }
        .cd-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cd-thumb-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .cd-thumb-icon { width: 1.5rem; height: 1.5rem; color: var(--color-text-disabled); }

        .cd-details { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
        .cd-product-link {
          font-size: 0.875rem; font-weight: 500; color: var(--color-text);
          text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color var(--transition-fast);
        }
        .cd-product-link:hover { color: var(--color-accent); }

        .cd-price-wrap { display: inline-flex; align-items: center; gap: 0.5rem; }
        .cd-price-main { color: var(--color-text); font-variant-numeric: tabular-nums; font-weight: 500; }
        .cd-price--sm { font-size: 0.8125rem; }
        .cd-price--md { font-size: 0.9375rem; }
        .cd-price--lg { font-size: 1.125rem; }
        .cd-price-compare { font-size: 0.75rem; color: var(--color-text-muted); text-decoration: line-through; }

        .cd-qty { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
        .cd-qty-btn {
          display: flex; align-items: center; justify-content: center;
          width: 1.75rem; height: 1.75rem;
          border: 1px solid var(--color-border); border-radius: var(--radius-sm);
          background: none; cursor: pointer; color: var(--color-text-secondary);
          font-size: 1rem; line-height: 1;
          transition: background-color var(--transition-fast);
        }
        .cd-qty-btn:hover:not(:disabled) { background-color: var(--color-border-subtle); }
        .cd-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cd-qty-val {
          min-width: 3.5rem; text-align: center; font-size: 0.875rem;
          font-variant-numeric: tabular-nums; color: var(--color-text);
        }

        .cd-remove {
          align-self: flex-start; margin-top: 0.125rem;
          display: flex; padding: 0.25rem; border-radius: var(--radius-sm);
          background: none; border: none; cursor: pointer;
          color: var(--color-text-muted);
          transition: color var(--transition-fast);
        }
        .cd-remove:hover:not(:disabled) { color: var(--color-danger); }
        .cd-remove:disabled { opacity: 0.4; cursor: not-allowed; }
        .cd-remove-icon { width: 1rem; height: 1rem; }
        .cd-spinner { width: 1rem; height: 1rem; animation: cd-spin 0.8s linear infinite; }
        @keyframes cd-spin { to { transform: rotate(360deg); } }

        .cd-footer {
          border-top: 1px solid var(--color-border);
          padding: 1rem 1.25rem;
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .cd-subtotal {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.875rem;
        }
        .cd-subtotal-label { color: var(--color-text-secondary); }
        .cd-checkout-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 0.625rem 1rem;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.9375rem; font-weight: 600; font-family: inherit;
          border: none; border-radius: var(--radius-md);
          text-decoration: none; cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .cd-checkout-btn:hover { background-color: var(--color-accent-hover); }
      `}</style>

      {isOpen && (
        <div
          className="cd-backdrop"
          aria-hidden="true"
          onClick={closeCart}
        />
      )}

      <aside
        role="dialog"
        aria-label={t("title")}
        aria-modal="true"
        className={`cd-drawer${isOpen ? " cd-drawer--open" : " cd-drawer--closed"}`}
      >
        {/* Header */}
        <div className="cd-header">
          <h2 className="cd-title">
            {t("title")}
            {items.length > 0 && (
              <span className="cd-title-count">
                ({t("itemCount", { count: items.length })})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={tCommon("close")}
            className="cd-close"
          >
            <X className="cd-close-icon" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="cd-body">
          {items.length === 0 ? (
            <div className="cd-empty">
              <ShoppingBag className="cd-empty-icon" aria-hidden="true" />
              <div>
                <p className="cd-empty-title">{t("empty")}</p>
                <p className="cd-empty-hint">{t("emptyHint")}</p>
              </div>
              <button type="button" onClick={closeCart} className="cd-continue-btn">
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <ul className="cd-list" role="list">
              {items.map((item) => (
                <li key={item.id} className="cd-item">
                  {/* Thumbnail */}
                  <div className="cd-thumb">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.productName} />
                    ) : (
                      <div className="cd-thumb-placeholder">
                        <ShoppingBag className="cd-thumb-icon" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="cd-details">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="cd-product-link"
                    >
                      {item.productName}
                    </Link>
                    <PriceDisplay rial={item.pricePerTonRial} size="sm" />

                    {/* Quantity controls */}
                    <div className="cd-qty" role="group" aria-label="تنظیم مقدار">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantityTon, -0.5)}
                        disabled={isPending || item.quantityTon <= item.minOrderTon}
                        aria-label="کاهش مقدار"
                        className="cd-qty-btn"
                      >
                        −
                      </button>
                      <span className="cd-qty-val">
                        {item.quantityTon} {tCommon("ton")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantityTon, 0.5)}
                        disabled={isPending}
                        aria-label="افزایش مقدار"
                        className="cd-qty-btn"
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
                    className="cd-remove"
                  >
                    {isPending ? (
                      <Loader2 className="cd-spinner" aria-hidden="true" />
                    ) : (
                      <Trash2 className="cd-remove-icon" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cd-footer">
            <div className="cd-subtotal">
              <span className="cd-subtotal-label">{t("subtotal")}</span>
              <PriceDisplay rial={total} size="md" />
            </div>
            <Link href="/checkout" onClick={closeCart} className="cd-checkout-btn">
              {t("checkout")}
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
