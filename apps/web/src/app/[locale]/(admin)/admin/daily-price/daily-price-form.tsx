"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Package,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Clock,
  User,
} from "lucide-react"
import { submitDailyPriceAction } from "@/actions/admin-daily-price"
import { useToast } from "@/components/admin/Toast"
import styles from "./DailyPrice.module.css"

export interface PricingProduct {
  id: string
  nameFa: string
  nameEn: string | null
  price: number | string | { toString(): string }
  lastPriceUpdate: Date
  packagingType: string
  cementType: string | null
  brand: { nameFa: string } | null
}

export interface ActiveBulletin {
  id: string
  date: Date
  source: string
  createdAt: Date
  publisher: { name: string } | null
  items: Array<{
    id: string
    price: number | string | { toString(): string }
    previousPrice: number | string | { toString(): string }
    customName: string | null
    product: {
      id: string
      nameFa: string
      slug: string
      packagingType: string
    } | null
  }>
}

interface DailyPriceFormProps {
  products: PricingProduct[]
  activeBulletin: ActiveBulletin | null
  locale: string
}

function formatToman(val: number | string): string {
  const num = typeof val === "string" ? parseInt(val.replace(/\D/g, ""), 10) : val
  if (isNaN(num) || num === null || num === undefined) return ""
  return num.toLocaleString("fa-IR")
}

function parseRawNumber(val: string): number {
  // Convert Persian digits to English digits and remove commas
  const p2e = val
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/\D/g, "")
  return parseInt(p2e, 10) || 0
}

export function DailyPriceForm({ products, activeBulletin, locale }: DailyPriceFormProps) {
  const fa = locale === "fa"
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // State: selected product IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // If active bulletin exists for today, pre-select its products
    if (activeBulletin) {
      const ids = activeBulletin.items
        .map((i) => i.product?.id)
        .filter((id): id is string => Boolean(id))
      if (ids.length > 0) return new Set(ids)
    }
    // Default: select all active products
    return new Set(products.map((p) => p.id))
  })

  // State: prices map [productId -> formatted string or number]
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    products.forEach((p) => {
      const pNum = Number(p.price) || 0
      init[p.id] = pNum > 0 ? String(pNum) : ""
    })
    return init
  })

  const [sendToTelegram, setSendToTelegram] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Check if today already has a bulletin
  const isTodayBulletin = Boolean(
    activeBulletin &&
      new Date(activeBulletin.date).toDateString() === new Date().toDateString()
  )

  const todayJalali = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeZone: "Asia/Tehran",
  }).format(new Date())

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // If price is empty, prefill with current product price
        if (!prices[id]) {
          const prod = products.find((p) => p.id === id)
          if (prod && Number(prod.price) > 0) {
            setPrices((p) => ({ ...p, [id]: String(Number(prod.price)) }))
          }
        }
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(products.map((p) => p.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handlePriceChange = (productId: string, rawVal: string) => {
    const num = parseRawNumber(rawVal)
    setPrices((prev) => ({
      ...prev,
      [productId]: num > 0 ? String(num) : "",
    }))
  }

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.nameFa.toLowerCase().includes(q) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.brand?.nameFa && p.brand.nameFa.toLowerCase().includes(q))
    )
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const itemsToSubmit: Array<{ productId: string; price: number }> = []

    for (const id of Array.from(selectedIds)) {
      const priceVal = parseRawNumber(prices[id] || "")
      if (priceVal <= 0) {
        const prod = products.find((p) => p.id === id)
        toast.error(`لطفاً قیمت معتبری برای «${prod?.nameFa || "محصول"}» وارد کنید.`)
        return
      }
      itemsToSubmit.push({ productId: id, price: priceVal })
    }

    if (itemsToSubmit.length === 0) {
      toast.error("حداقل یک محصول را برای اعلام قیمت انتخاب کنید.")
      return
    }

    startTransition(async () => {
      try {
        const res = await submitDailyPriceAction({
          items: itemsToSubmit,
          sendToTelegram,
        })

        if (res.success) {
          if (res.telegramSent) {
            toast.success("✅ قیمت روز با موفقیت ثبت شد و به کانال تلگرام ارسال گردید.")
          } else if (res.telegramError) {
            toast.success("✅ قیمت‌ها در سایت ثبت شدند (خطا در ارسال تلگرام).")
          } else {
            toast.success("✅ قیمت روز با موفقیت در سایت ثبت و منتشر شد.")
          }
          router.refresh()
        } else {
          toast.error(res.error || "خطا در ثبت قیمت‌ها")
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "خطای غیرمنتظره در ثبت قیمت"
        toast.error(message)
      }
    })
  }

  return (
    <div className={`${styles.dpWrapper}`}>
      {/* Header Banner */}
      <div className={`${styles.dpHeaderCard}`}>
        <div className={`${styles.dpHeaderMain}`}>
          <div className={`${styles.dpHeaderIconBox}`}>
            <TrendingUp style={{ width: "1.75rem", height: "1.75rem" }} />
          </div>
          <div>
            <h1 className={`${styles.dpTitle}`}>{fa ? "اعلام قیمت روز محصولات" : "Daily Price Declaration"}</h1>
            <p className={`${styles.dpSubtitle}`}>
              {fa
                ? "ثبت و انتشار قیمت‌های رسمی سیمان و مصالح در نوار بالای سایت و کانال تلگرام"
                : "Submit official daily prices to the storefront ticker and Telegram channel"}
            </p>
          </div>
        </div>

        <div className={`${styles.dpDateBadge}`}>
          <Calendar style={{ width: "1rem", height: "1rem" }} />
          <span>{todayJalali}</span>
        </div>
      </div>

      {/* Warning if already submitted today */}
      {isTodayBulletin && (
        <div className={`${styles.dpWarningAlert}`} role="alert">
          <AlertTriangle style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
          <div className={`${styles.dpWarningText}`}>
            <strong>{fa ? "توجه:" : "Notice:"}</strong>{" "}
            {fa
              ? "قیمت روز برای امروز قبلاً ثبت شده است. ثبت مجدد، مقادیر قبلی را جایگزین کرده و پیام جدید به کانال می‌فرستد."
              : "Daily prices were already published today. Re-submitting will overwrite previous entries."}
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className={`${styles.dpFormCard}`}>
        {/* Controls Bar */}
        <div className={`${styles.dpControlsBar}`}>
          <div className={`${styles.dpSearchBox}`}>
            <Search style={{ width: "1rem", height: "1rem" }} />
            <input
              type="text"
              placeholder={fa ? "جستجوی محصول یا کارخانه..." : "Search product or brand..."}
              aria-label={fa ? "جستجوی محصول یا کارخانه" : "Search product or brand"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${styles.dpSearchInput}`}
            />
          </div>

          <div className={`${styles.dpSelectionActions}`}>
            <button
              type="button"
              onClick={selectAll}
              className={`${styles.dpBtnSecondary}`}
            >
              <CheckSquare style={{ width: "0.875rem", height: "0.875rem" }} />
              <span>{fa ? "انتخاب همه" : "Select All"}</span>
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className={`${styles.dpBtnSecondary}`}
            >
              <Square style={{ width: "0.875rem", height: "0.875rem" }} />
              <span>{fa ? "لغو همه" : "Deselect"}</span>
            </button>
            <div className={`${styles.dpCountPill}`}>
              {fa
                ? `${selectedIds.size} از ${products.length} محصول انتخاب شده`
                : `${selectedIds.size} of ${products.length} selected`}
            </div>
          </div>
        </div>

        {/* Product Pricing Table */}
        <div className={`${styles.dpTableContainer}`}>
          <table className={`${styles.dpTable}`}>
            <thead>
              <tr>
                <th style={{ width: "3.5rem", textAlign: "center" }}>
                  {fa ? "انتخاب" : "Select"}
                </th>
                <th>{fa ? "نام محصول و مشخصات" : "Product & Specs"}</th>
                <th style={{ width: "12rem" }}>{fa ? "برند / کارخانه" : "Brand"}</th>
                <th style={{ width: "15rem" }}>{fa ? "قیمت روز (تومان)" : "Daily Price (Toman)"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => {
                const isSelected = selectedIds.has(prod.id)
                const currentVal = prices[prod.id] || ""
                const numVal = parseRawNumber(currentVal)
                const originalPrice = Number(prod.price) || 0
                const isChanged = numVal > 0 && numVal !== originalPrice

                return (
                  <tr
                    key={prod.id}
                    className={`${styles.dpTableRow} ${isSelected ? styles.dpTableRowSelected : ""}`}
                    onClick={() => toggleSelect(prod.id)}
                  >
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <label className={styles.dpCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(prod.id)}
                          className={styles.dpCheckbox}
                          aria-label={`${fa ? "انتخاب" : "Select"} ${prod.nameFa}`}
                        />
                      </label>
                    </td>

                    <td>
                      <div className={styles.dpProdInfo}>
                        <span className={styles.dpProdName}>{prod.nameFa}</span>
                        <div className={styles.dpProdMeta}>
                          {prod.packagingType === "BAG_50KG" && (
                            <span className={`${styles.dpBadge} ${styles.dpBadgeBag}`}>کیسه ۵۰kg</span>
                          )}
                          {prod.packagingType === "JUMBO_1500KG" && (
                            <span className={`${styles.dpBadge} ${styles.dpBadgeJumbo}`}>جامبوبگ</span>
                          )}
                          {prod.packagingType === "BULK" && (
                            <span className={`${styles.dpBadge} ${styles.dpBadgeBulk}`}>فله</span>
                          )}
                          {prod.cementType && (
                            <span className={styles.dpBadge}>{prod.cementType}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={styles.dpBrandName}>
                        {prod.brand?.nameFa || "—"}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div className={styles.dpPriceInputWrapper}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={currentVal ? formatToman(currentVal) : ""}
                          onChange={(e) => handlePriceChange(prod.id, e.target.value)}
                          placeholder={formatToman(originalPrice) || "۰"}
                          disabled={!isSelected}
                          aria-label={`${fa ? "قیمت روز برای" : "Daily price for"} ${prod.nameFa}`}
                          className={`${styles.dpPriceInput} ${!isSelected ? styles.dpPriceInputDisabled : ""}`}
                        />
                        <span className={styles.dpPriceUnit}>{fa ? "تومان" : "Toman"}</span>
                      </div>
                      {isChanged && (
                        <div className={`${styles.dpPriceChangeHint}`}>
                          {fa
                            ? `قیمت قبلی: ${formatToman(originalPrice)} تومان`
                            : `Prev: ${originalPrice.toLocaleString()} Toman`}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className={`${styles.dpEmptyRow}`}>
                    <Package style={{ width: "2rem", height: "2rem", opacity: 0.4 }} />
                    <span>{fa ? "هیچ محصول فعالی یافت نشد" : "No active products found"}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Submit & Telegram Options Footer */}
        <div className={`${styles.dpFormFooter}`}>
          <label className={`${styles.dpTelegramToggle}`}>
            <input
              type="checkbox"
              checked={sendToTelegram}
              onChange={(e) => setSendToTelegram(e.target.checked)}
              className={`${styles.dpCheckbox}`}
              aria-label={fa ? "ارسال همزمان به کانال رسمی تلگرام" : "Post simultaneously to Telegram channel"}
            />
            <Send style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-info)" }} />
            <span className={`${styles.dpTelegramText}`}>
              {fa
                ? "ارسال همزمان به کانال رسمی تلگرام (@tirajeconcrete)"
                : "Post simultaneously to Telegram channel"}
            </span>
          </label>

          <button
            type="submit"
            disabled={isPending || selectedIds.size === 0}
            className={`${styles.dpBtnSubmit}`}
          >
            {isPending ? (
              <>
                <RefreshCw style={{ width: "1.25rem", height: "1.25rem" }} className={`${styles.dpSpin}`} />
                <span>{fa ? "در حال ثبت و انتشار..." : "Publishing..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} />
                <span>
                  {fa
                    ? `ثبت و انتشار قیمت روز (${selectedIds.size} محصول)`
                    : `Publish Daily Prices (${selectedIds.size})`}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Last Bulletin Summary Card */}
      {activeBulletin && (
        <div className={`${styles.dpHistoryCard}`}>
          <div className={`${styles.dpHistoryHeader}`}>
            <div className={`${styles.dpHistoryTitleBox}`}>
              <Clock style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent-text)" }} />
              <h2 className={`${styles.dpHistoryTitle}`}>
                {fa ? "آخرین اعلام قیمت ثبت‌شده در سایت" : "Latest Published Bulletin"}
              </h2>
            </div>
            <div className={`${styles.dpHistoryMeta}`}>
              <span className={`${styles.dpHistoryDate}`}>
                {new Intl.DateTimeFormat("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Tehran",
                }).format(new Date(activeBulletin.createdAt))}
              </span>
              {activeBulletin.publisher?.name && (
                <span className={`${styles.dpHistoryPublisher}`}>
                  <User style={{ width: "0.875rem", height: "0.875rem" }} />
                  {activeBulletin.publisher.name}
                </span>
              )}
            </div>
          </div>

          <div className={`${styles.dpHistoryGrid}`}>
            {activeBulletin.items.map((item) => (
              <div key={item.id} className={`${styles.dpHistoryItem}`}>
                <div className={`${styles.dpHistoryItemName}`}>
                  {item.product?.nameFa || item.customName || "—"}
                </div>
                <div className={`${styles.dpHistoryItemPrice}`}>
                  <strong>{formatToman(Number(item.price))}</strong>{" "}
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    تومان
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoped Styles */}
      
    </div>
  )
}
