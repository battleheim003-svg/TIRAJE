"use client"

import { useState, useTransition, useMemo } from "react"
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
  Eye,
  CornerDownLeft,
  X,
} from "lucide-react"
import { submitDailyPriceAction } from "@/actions/admin-daily-price"
import { useToast } from "@/components/admin/Toast"
import { formatToman } from "@tirajeh/shared"
import styles from "./DailyPrice.module.css"

export interface PricingProduct {
  id: string
  nameFa: string
  nameEn: string | null
  price: number
  yesterdayPrice: number | null
  lastPriceUpdate: Date
  packagingType: string
  cementType: string | null
  brand: { id?: string; nameFa: string } | null
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

function parseRawNumber(val: string): number {
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
    if (activeBulletin) {
      const ids = activeBulletin.items
        .map((i) => i.product?.id)
        .filter((id): id is string => Boolean(id))
      if (ids.length > 0) return new Set(ids)
    }
    return new Set(products.map((p) => p.id))
  })

  // State: prices map [productId -> formatted string or number]
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    products.forEach((p) => {
      // Default: if yesterdayPrice exists use it, else current product price
      const val = p.yesterdayPrice ?? p.price
      init[p.id] = val > 0 ? String(val) : ""
    })
    return init
  })

  const [sendToTelegram, setSendToTelegram] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("ALL")

  // PNG Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Check if today already has a bulletin
  const isTodayBulletin = Boolean(
    activeBulletin &&
      new Date(activeBulletin.date).toDateString() === new Date().toDateString()
  )

  const todayJalali = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeZone: "Asia/Tehran",
  }).format(new Date())

  // Brand list for filter
  const brandList = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) => {
      if (p.brand?.nameFa) {
        map.set(p.brand.nameFa, p.brand.nameFa)
      }
    })
    return Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "fa"))
  }, [products])

  // Count products with yesterdayPrice
  const hasAnyYesterdayPrice = useMemo(() => {
    return products.some((p) => p.yesterdayPrice !== null && p.yesterdayPrice > 0)
  }, [products])

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!prices[id]) {
          const prod = products.find((p) => p.id === id)
          const fallbackVal = prod ? (prod.yesterdayPrice ?? prod.price) : 0
          if (fallbackVal > 0) {
            setPrices((p) => ({ ...p, [id]: String(fallbackVal) }))
          }
        }
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredProducts.map((p) => p.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  // Copy yesterday's prices for products that have it
  const copyYesterdayPrices = () => {
    const nextPrices = { ...prices }
    const nextSelected = new Set(selectedIds)

    let copiedCount = 0
    products.forEach((p) => {
      if (p.yesterdayPrice !== null && p.yesterdayPrice > 0) {
        nextPrices[p.id] = String(p.yesterdayPrice)
        nextSelected.add(p.id)
        copiedCount++
      }
    })

    setPrices(nextPrices)
    setSelectedIds(nextSelected)

    if (copiedCount > 0) {
      toast.success(
        fa
          ? `قیمت دیروز برای ${copiedCount} محصول کپی و انتخاب شد.`
          : `Copied yesterday's prices for ${copiedCount} products.`
      )
    } else {
      toast.info(fa ? "قیمت روز قبل ثبت نشده است." : "No yesterday prices found.")
    }
  }

  const handlePriceChange = (productId: string, rawVal: string) => {
    const num = parseRawNumber(rawVal)
    setPrices((prev) => ({
      ...prev,
      [productId]: num > 0 ? String(num) : "",
    }))
  }

  // Filter products by search query and brand
  const filteredProducts = products.filter((p) => {
    if (selectedBrand !== "ALL" && p.brand?.nameFa !== selectedBrand) {
      return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.nameFa.toLowerCase().includes(q) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.brand?.nameFa && p.brand.nameFa.toLowerCase().includes(q))
    )
  })

  // Validation: are all selected products priced with a valid number > 0?
  const isFormValid = useMemo(() => {
    if (selectedIds.size === 0) return false
    for (const id of Array.from(selectedIds)) {
      const val = parseRawNumber(prices[id] || "")
      if (val <= 0) return false
    }
    return true
  }, [selectedIds, prices])

  // Open Preview Modal
  const handleOpenPreview = () => {
    if (selectedIds.size === 0) return

    const parts: string[] = []
    for (const id of Array.from(selectedIds)) {
      const p = parseRawNumber(prices[id] || "")
      if (p > 0) parts.push(`${id}:${p}`)
    }

    if (parts.length === 0) {
      toast.error(fa ? "لطفاً برای محصولات انتخاب شده قیمت وارد کنید." : "Please enter prices first.")
      return
    }

    const url = `/api/admin/price-card/preview?items=${encodeURIComponent(parts.join(","))}`
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

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
        toast.error(err instanceof Error ? err.message : "خطای ناشناخته در ارتباط با سرور")
      }
    })
  }

  return (
    <div className={`${styles.dpWrapper}`}>
      {/* Header Card */}
      <div className={`${styles.dpHeaderCard}`}>
        <div className={`${styles.dpHeaderMain}`}>
          <div className={`${styles.dpHeaderIconBox}`}>
            <TrendingUp style={{ width: "1.75rem", height: "1.75rem" }} />
          </div>
          <div>
            <h1 className={`${styles.dpTitle}`}>
              {fa ? "اعلام قیمت روز سیمان" : "Daily Cement Pricing"}
            </h1>
            <p className={`${styles.dpSubtitle}`}>
              {fa
                ? "به‌روزرسانی قیمت‌های روز، تیکر سایت، و انتشار خودکار به کانال رسمی تلگرام"
                : "Update daily prices, storefront ticker, and auto-broadcast to Telegram"}
            </p>
          </div>
        </div>

        <div className={`${styles.dpDateBadge}`}>
          <Calendar style={{ width: "1.125rem", height: "1.125rem" }} />
          <span>{todayJalali}</span>
        </div>
      </div>

      {/* Warning if already published today */}
      {isTodayBulletin && (
        <div className={`${styles.dpWarningAlert}`} role="alert">
          <AlertTriangle style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
          <div className={`${styles.dpWarningText}`}>
            <strong>{fa ? "توجه:" : "Notice:"}</strong>{" "}
            {fa
              ? "قیمت روز برای امروز قبلاً ثبت شده است. ثبت جدید جایگزین می‌شود."
              : "Daily prices were already published today. Re-submitting will overwrite previous entries."}
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className={`${styles.dpFormCard}`}>
        {/* Controls Bar */}
        <div className={`${styles.dpControlsBar}`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", flex: 1 }}>
            <div className={`${styles.dpSearchBox}`}>
              <Search style={{ width: "1rem", height: "1rem" }} />
              <input
                type="text"
                placeholder={fa ? "جستجو در نام محصول..." : "Search product name..."}
                aria-label={fa ? "جستجو در نام محصول" : "Search product name"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${styles.dpSearchInput}`}
              />
            </div>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={styles.dpBrandSelect}
              aria-label={fa ? "فیلتر برند" : "Filter by brand"}
            >
              <option value="ALL">{fa ? "همه برندها" : "All Brands"}</option>
              {brandList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.dpSelectionActions}`}>
            {/* Copy Yesterday Prices Button */}
            <button
              type="button"
              onClick={copyYesterdayPrices}
              disabled={!hasAnyYesterdayPrice}
              title={!hasAnyYesterdayPrice ? (fa ? "قیمت روز قبل ثبت نشده" : "No yesterday prices available") : undefined}
              className={`${styles.dpBtnSecondary}`}
            >
              <CornerDownLeft style={{ width: "0.875rem", height: "0.875rem" }} />
              <span>{fa ? "کپی قیمت‌های دیروز" : "Copy Yesterday"}</span>
            </button>

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
                ? `نمایش ${filteredProducts.length} از ${products.length} محصول (${selectedIds.size} انتخاب شده)`
                : `Showing ${filteredProducts.length} of ${products.length} (${selectedIds.size} selected)`}
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
                <th>{fa ? "محصول" : "Product"}</th>
                <th style={{ width: "10rem" }}>{fa ? "برند / کارخانه" : "Brand"}</th>
                <th style={{ width: "9rem" }}>{fa ? "قیمت دیروز" : "Yesterday"}</th>
                <th style={{ width: "13rem" }}>{fa ? "قیمت امروز (تومان)" : "Today's Price"}</th>
                <th style={{ width: "6.5rem", textAlign: "center" }}>{fa ? "تغییر" : "Change"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => {
                const isSelected = selectedIds.has(prod.id)
                const currentVal = prices[prod.id] || ""
                const numVal = parseRawNumber(currentVal)
                const yPrice = prod.yesterdayPrice

                // Calculate percentage change client-side
                let pctChange: number | null = null
                if (yPrice && numVal > 0) {
                  pctChange = ((numVal - yPrice) / yPrice) * 100
                }

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
                        </div>
                      </div>
                    </td>

                    <td style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
                      {prod.brand?.nameFa || "—"}
                    </td>

                    {/* Yesterday Price Column */}
                    <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--color-text-muted)" }}>
                      {yPrice ? formatToman(yPrice) : "—"}
                    </td>

                    {/* Today Price Input */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className={styles.dpPriceInputWrapper}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={currentVal ? Number(currentVal).toLocaleString("fa-IR") : ""}
                          onChange={(e) => handlePriceChange(prod.id, e.target.value)}
                          placeholder={yPrice ? Number(yPrice).toLocaleString("fa-IR") : (prod.price ? Number(prod.price).toLocaleString("fa-IR") : "0")}
                          className={`${styles.dpPriceInput} ${!isSelected ? styles.dpPriceInputDisabled : ""}`}
                          disabled={!isSelected}
                        />
                      </div>
                    </td>

                    {/* Percentage Change Column */}
                    <td style={{ textAlign: "center" }}>
                      {pctChange === null || Math.abs(pctChange) < 0.01 ? (
                        <span className={styles.dpPctNone}>—</span>
                      ) : pctChange > 0 ? (
                        <span className={styles.dpPctUp}>
                          ↑ {Math.abs(pctChange).toFixed(1)}٪
                        </span>
                      ) : (
                        <span className={styles.dpPctDown}>
                          ↓ {Math.abs(pctChange).toFixed(1)}٪
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${styles.dpEmptyRow}`}>
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
                ? "ارسال همزمان به کانال رسمی تلگرام (@TirajehConcrete)"
                : "Post simultaneously to Telegram channel"}
            </span>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {/* Preview PNG Button */}
            <button
              type="button"
              onClick={handleOpenPreview}
              disabled={selectedIds.size === 0}
              title={selectedIds.size === 0 ? (fa ? "ابتدا محصولات را انتخاب کنید" : "Select products first") : undefined}
              className={styles.dpBtnPreview}
            >
              <Eye style={{ width: "1.125rem", height: "1.125rem" }} />
              <span>{fa ? "پیش‌نمایش کارت قیمت" : "Preview Card"}</span>
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !isFormValid}
              title={!isFormValid ? (fa ? "لطفاً برای همه محصولات انتخاب‌شده قیمت وارد کنید" : "Please enter prices for all selected products") : undefined}
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
        </div>
      </form>

      {/* Preview Dialog / Modal */}
      {previewOpen && previewUrl && (
        <div className={styles.dpModalOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.dpModalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Eye style={{ width: "1.2rem", height: "1.2rem", color: "var(--color-accent-text)" }} />
                <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 800, margin: 0 }}>
                  {fa ? "پیش‌نمایش کارت قیمت تلگرام (PNG)" : "Telegram Price Card Preview"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className={styles.dpBtnSecondary}
                style={{ padding: "var(--space-1-5)" }}
              >
                <X style={{ width: "1.2rem", height: "1.2rem" }} />
              </button>
            </div>

            <div className={styles.dpPreviewImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Price Card Preview"
                className={styles.dpPreviewImage}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className={styles.dpBtnSecondary}
              >
                {fa ? "بستن پیش‌نمایش" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <strong>{formatToman(Number(item.price))}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
