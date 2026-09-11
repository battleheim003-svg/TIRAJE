"use client"

import { useState, useTransition } from "react"
import { adminUpdateQuoteAction } from "@/actions/admin-quotes"
import styles from "./QuoteDetail.module.css"

const QUOTE_STATUSES = [
  { value: "PENDING",  fa: "در انتظار",        en: "Pending"  },
  { value: "REVIEWED", fa: "بررسی شده",        en: "Reviewed" },
  { value: "QUOTED",   fa: "قیمت داده شده",    en: "Quoted"   },
  { value: "ACCEPTED", fa: "پذیرفته شده",      en: "Accepted" },
  { value: "REJECTED", fa: "رد شده",           en: "Rejected" },
]

interface Props {
  quoteId: string
  currentStatus: string
  currentQuotedPrice: number | null
  currentAdminNote: string | null
  fa: boolean
}

export default function QuoteUpdateForm({ quoteId, currentStatus, currentQuotedPrice, currentAdminNote, fa }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set("quoteId", quoteId)
    fd.set("status", status)

    startTransition(async () => {
      try {
        await adminUpdateQuoteAction(fd)
        setSuccess(true)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی" : "Save failed"))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles["web-adm-qt-d__form"]}>
      <div className={styles["web-adm-qt-d__row"]}>
        <div className={styles["web-adm-qt-d__field"]}>
          <label className={styles["web-adm-qt-d__label"]} htmlFor="quf-status">{fa ? "وضعیت" : "Status"}</label>
          <select
            id="quf-status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSuccess(false) }}
            className={styles["web-adm-qt-d__select"]}
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{fa ? s.fa : s.en}</option>
            ))}
          </select>
        </div>

        <div className={styles["web-adm-qt-d__field"]}>
          <label className={styles["web-adm-qt-d__label"]} htmlFor="quf-price">
            {fa ? "قیمت پیشنهادی (تومان/تن)" : "Quoted Price (Toman/ton)"}
          </label>
          <input
            id="quf-price"
            name="quotedPrice"
            type="number"
            min={0}
            defaultValue={currentQuotedPrice ?? ""}
            placeholder={fa ? "مثلاً ۳۵۰۰۰۰۰" : "e.g. 3500000"}
            className={styles["web-adm-qt-d__input"]}
            dir="ltr"
          />
        </div>

        <div className={styles["web-adm-qt-d__field"]}>
          <label className={styles["web-adm-qt-d__label"]} htmlFor="quf-expires">
            {fa ? "مهلت اعتبار پیشنهاد" : "Offer Expiration"}
          </label>
          <input
            id="quf-expires"
            name="expiresAt"
            type="date"
            className={styles["web-adm-qt-d__input"]}
            dir="ltr"
          />
        </div>
      </div>

      <div className={styles["web-adm-qt-d__fieldFull"]}>
        <label className={styles["web-adm-qt-d__label"]} htmlFor="quf-note">
          {fa ? "یادداشت مدیریت (داخلی)" : "Admin Note (internal)"}
        </label>
        <textarea
          id="quf-note"
          name="adminNote"
          defaultValue={currentAdminNote ?? ""}
          rows={3}
          placeholder={fa ? "یادداشت‌های داخلی در مورد این درخواست..." : "Internal notes about this request..."}
          className={styles["web-adm-qt-d__textarea"]}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <button type="submit" disabled={isPending} className={styles["web-adm-qt-d__btn"]}>
          {isPending ? (fa ? "در حال ذخیره..." : "Saving...") : (fa ? "ثبت تغییرات" : "Save Changes")}
        </button>
        {success && <span className={styles["web-adm-qt-d__success"]} role="status">{fa ? "تغییرات با موفقیت ذخیره شد." : "Changes saved."}</span>}
        {error && <span className={styles["web-adm-qt-d__error"]} role="alert">{error}</span>}
      </div>
    </form>
  )
}
