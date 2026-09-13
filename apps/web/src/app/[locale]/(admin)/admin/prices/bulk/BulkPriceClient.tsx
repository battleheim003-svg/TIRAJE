"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Eye,
  Check,
  Loader2,
} from "lucide-react"
import {
  adminBulkAdjustPreviewAction,
  adminBulkAdjustConfirmAction,
  BulkPreviewItem,
} from "@/actions/admin-prices"
import { useToast } from "@/components/admin/Toast"
import { formatToman } from "@/lib/cement"
import styles from "./BulkPrice.module.css"

interface BrandOption {
  id: string
  nameFa: string
}

interface CategoryOption {
  id: string
  nameFa: string
}

interface BulkPriceClientProps {
  brands: BrandOption[]
  categories: CategoryOption[]
  locale: string
  fa: boolean
}

export function BulkPriceClient({
  brands,
  categories,
  locale,
  fa,
}: BulkPriceClientProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [brandId, setBrandId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [percent, setPercent] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [previewItems, setPreviewItems] = useState<BulkPreviewItem[]>([])

  const { toast } = useToast()

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandId && !categoryId) {
      toast.error(fa ? "حداقل یکی از موارد برند یا دسته‌بندی را انتخاب کنید." : "Select at least a brand or category.")
      return
    }

    const pctNum = parseFloat(percent)
    if (isNaN(pctNum) || pctNum < -50 || pctNum > 200) {
      toast.error(fa ? "درصد تغییر باید بین -۵۰ تا +۲۰۰ باشد." : "Percentage must be between -50 and +200.")
      return
    }

    if (!reason.trim() || reason.trim().length < 3) {
      toast.error(fa ? "دلیل تغییر قیمت باید حداقل ۳ کاراکتر باشد." : "Reason must be at least 3 characters.")
      return
    }

    setLoadingPreview(true)
    try {
      const res = await adminBulkAdjustPreviewAction({
        brandId: brandId || null,
        categoryId: categoryId || null,
        percent: pctNum,
        reason: reason.trim(),
      })

      if (res && "error" in res && res.error) {
        toast.error(typeof res.error === "string" ? res.error : (fa ? "خطا در بررسی پیش‌نمایش" : "Error fetching preview"))
      } else if (res && "data" in res && res.data) {
        if (res.data.items.length === 0) {
          toast.error(fa ? "هیچ محصول فعالی با این فیلترها یافت نشد." : "No active products found with these filters.")
        } else {
          setPreviewItems(res.data.items)
          setStep(2)
        }
      }
    } catch {
      toast.error(fa ? "خطای سیستمی در محاسبه پیش‌نمایش" : "System error fetching preview")
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleConfirm = async () => {
    if (confirming) return
    const pctNum = parseFloat(percent)

    setConfirming(true)
    try {
      const res = await adminBulkAdjustConfirmAction({
        brandId: brandId || null,
        categoryId: categoryId || null,
        percent: pctNum,
        reason: reason.trim(),
      })

      if (res && "error" in res && res.error) {
        toast.error(typeof res.error === "string" ? res.error : (fa ? "خطا در اعمال قیمت‌ها" : "Error applying prices"))
      } else if (res && "data" in res && res.data) {
        toast.success(
          fa
            ? `قیمت ${res.data.updatedCount} محصول با موفقیت به‌روزرسانی شد.`
            : `Successfully updated prices for ${res.data.updatedCount} products.`
        )
        // Reset state & go back to step 1
        setStep(1)
        setPercent("")
        setReason("")
        setPreviewItems([])
      }
    } catch {
      toast.error(fa ? "خطای سیستمی در اعمال تغییرات گروهی" : "System error applying bulk adjustments")
    } finally {
      setConfirming(false)
    }
  }

  const selectedBrand = brands.find((b) => b.id === brandId)
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const pctNum = parseFloat(percent) || 0

  return (
    <div className={styles["bp-wrapper"]}>
      {/* Header Card */}
      <div className={styles["bp-headerCard"]}>
        <div className={styles["bp-headerMain"]}>
          <div className={styles["bp-headerIconBox"]}>
            <TrendingUp style={{ width: "1.75rem", height: "1.75rem" }} />
          </div>
          <div>
            <h1 className={styles["bp-title"]}>
              {fa ? "تنظیم گروهی قیمت" : "Bulk Price Adjustment"}
            </h1>
            <p className={styles["bp-subtitle"]}>
              {fa
                ? "تغییر درصدی قیمت محصولات بر اساس برند و دسته‌بندی با ثبت در تاریخچه و لاگ سیستم"
                : "Percentage price adjustments by brand and category with audit trail"}
            </p>
          </div>
        </div>

        {/* Wizard Steps indicator */}
        <div className={styles["bp-steps"]}>
          <div
            className={[
              styles["bp-stepBadge"],
              step === 1 ? styles["bp-stepBadge--active"] : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>۱</span>
            <span>{fa ? "فیلتر و درصد" : "Filter & Percentage"}</span>
          </div>
          <ArrowLeft
            style={{
              width: "1rem",
              height: "1rem",
              color: "var(--color-text-muted)",
              transform: fa ? "none" : "rotate(180deg)",
            }}
          />
          <div
            className={[
              styles["bp-stepBadge"],
              step === 2 ? styles["bp-stepBadge--active"] : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>۲</span>
            <span>{fa ? "پیش‌نمایش و تأیید" : "Preview & Confirm"}</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handlePreview} className={styles["bp-card"]}>
          <h2 className={styles["bp-cardTitle"]}>
            {fa ? "مرحله ۱: انتخاب دامنه محصولات و درصد تغییر" : "Step 1: Target Products & Percentage"}
          </h2>

          <div className={styles["bp-grid"]}>
            {/* Brand Filter */}
            <div className={styles["bp-field"]}>
              <label htmlFor="bp-brand" className={styles["bp-label"]}>
                {fa ? "برند (کارخانه)" : "Brand"}
              </label>
              <select
                id="bp-brand"
                className={styles["bp-select"]}
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">{fa ? "— همه برندها یا انتخاب کنید —" : "— Select Brand —"}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameFa}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className={styles["bp-field"]}>
              <label htmlFor="bp-category" className={styles["bp-label"]}>
                {fa ? "دسته‌بندی" : "Category"}
              </label>
              <select
                id="bp-category"
                className={styles["bp-select"]}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">{fa ? "— همه دسته‌ها یا انتخاب کنید —" : "— Select Category —"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameFa}
                  </option>
                ))}
              </select>
            </div>

            {/* Percentage Input */}
            <div className={styles["bp-field"]}>
              <label htmlFor="bp-percent" className={styles["bp-label"]}>
                {fa ? "درصد تغییر قیمت (مثبت یا منفی)" : "Percentage Change (+/-)"}
              </label>
              <input
                id="bp-percent"
                type="number"
                step="0.5"
                min="-50"
                max="200"
                required
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder={fa ? "مثلاً ۵ برای افزایش یا -۳ برای کاهش" : "e.g. 5 for +5%, -3 for -3%"}
                className={styles["bp-input"]}
              />
              <span className={styles["bp-helpText"]}>
                {fa
                  ? "مجاز بین ۵۰- درصد (کاهش) تا ۲۰۰+ درصد (افزایش)"
                  : "Allowed range: -50% to +200%"}
              </span>
            </div>
          </div>

          {/* Reason Field */}
          <div className={styles["bp-field"]}>
            <label htmlFor="bp-reason" className={styles["bp-label"]}>
              {fa ? "دلیل و بابت تغییر قیمت (الزامی)" : "Reason for Adjustment (Required)"}
            </label>
            <textarea
              id="bp-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={fa ? "مثال: افزایش نرخ رسمی انجمن صنفی کارفرمایان صنعت سیمان" : "Reason description..."}
              className={styles["bp-textarea"]}
            />
            <span className={styles["bp-helpText"]}>
              {fa
                ? "این دلیل در تاریخچه قیمت محصولات و لاگ بازرسی سیستم ثبت می‌شود."
                : "Recorded in product price history and system audit log."}
            </span>
          </div>

          <div className={styles["bp-actionsRow"]}>
            <button
              type="submit"
              disabled={loadingPreview}
              className={`${styles["bp-btn"]} ${styles["bp-btn--primary"]}`}
            >
              {loadingPreview ? (
                <>
                  <Loader2
                    style={{
                      width: "1rem",
                      height: "1rem",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>{fa ? "در حال محاسبه..." : "Calculating..."}</span>
                </>
              ) : (
                <>
                  <Eye style={{ width: "1rem", height: "1rem" }} />
                  <span>{fa ? "مشاهده پیش‌نمایش تغییرات" : "Preview Changes"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className={styles["bp-card"]}>
          <div className={styles["bp-previewMeta"]}>
            <div>
              <h2 className={styles["bp-cardTitle"]}>
                {fa ? "مرحله ۲: تأیید نهایی تغییرات" : "Step 2: Review & Confirmation"}
              </h2>
              <p className={styles["bp-subtitle"]}>
                {fa ? (
                  <>
                    دامنه: <strong>{selectedBrand?.nameFa ?? "همه برندها"}</strong> |{" "}
                    <strong>{selectedCategory?.nameFa ?? "همه دسته‌ها"}</strong> | درصد:{" "}
                    <strong>{pctNum > 0 ? `+${pctNum}%` : `${pctNum}%`}</strong>
                  </>
                ) : (
                  <>
                    Scope: <strong>{selectedBrand?.nameFa ?? "All Brands"}</strong> |{" "}
                    <strong>{selectedCategory?.nameFa ?? "All Categories"}</strong> | Percent:{" "}
                    <strong>{pctNum > 0 ? `+${pctNum}%` : `${pctNum}%`}</strong>
                  </>
                )}
              </p>
            </div>

            <div className={styles["bp-alertBox--warning"]}>
              <AlertTriangle style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
              <span>
                {fa
                  ? `تعداد ${previewItems.length} محصول تحت تأثیر قرار خواهند گرفت.`
                  : `${previewItems.length} products will be updated.`}
              </span>
            </div>
          </div>

          <div className={styles["bp-tableWrap"]}>
            <table className={styles["bp-table"]}>
              <thead>
                <tr>
                  <th>{fa ? "نام محصول" : "Product"}</th>
                  <th>{fa ? "برند" : "Brand"}</th>
                  <th>{fa ? "قیمت فعلی" : "Current Price"}</th>
                  <th>{fa ? "قیمت جدید محاسبه‌شده" : "Calculated New Price"}</th>
                  <th>{fa ? "اختلاف" : "Difference"}</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nameFa}</td>
                    <td>{item.brandNameFa}</td>
                    <td className={styles["bp-num"]}>
                      {formatToman(item.oldPrice, locale as "fa" | "en")}
                    </td>
                    <td className={styles["bp-num"]}>
                      {formatToman(item.newPrice, locale as "fa" | "en")}
                    </td>
                    <td>
                      <span
                        className={
                          item.diff > 0
                            ? styles["bp-diff--positive"]
                            : item.diff < 0
                            ? styles["bp-diff--negative"]
                            : styles["bp-diff--zero"]
                        }
                      >
                        {item.diff > 0
                          ? `+${formatToman(item.diff, locale as "fa" | "en")}`
                          : item.diff < 0
                          ? `-${formatToman(Math.abs(item.diff), locale as "fa" | "en")}`
                          : "۰"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles["bp-actionsRow"]}>
            <button
              type="button"
              disabled={confirming}
              onClick={() => setStep(1)}
              className={`${styles["bp-btn"]} ${styles["bp-btn--secondary"]}`}
            >
              <ArrowRight
                style={{
                  width: "1rem",
                  height: "1rem",
                  transform: fa ? "none" : "rotate(180deg)",
                }}
              />
              <span>{fa ? "بازگشت به ویرایش" : "Back to Edit"}</span>
            </button>

            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className={`${styles["bp-btn"]} ${styles["bp-btn--primary"]}`}
            >
              {confirming ? (
                <>
                  <Loader2
                    style={{
                      width: "1rem",
                      height: "1rem",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>{fa ? "در حال اعمال تغییرات..." : "Applying..."}</span>
                </>
              ) : (
                <>
                  <Check style={{ width: "1rem", height: "1rem" }} />
                  <span>{fa ? "تأیید و اعمال نهایی قیمت‌ها" : "Confirm & Apply Prices"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
