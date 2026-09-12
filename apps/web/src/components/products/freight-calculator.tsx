"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Truck, Loader2 } from "lucide-react"
import { formatToman } from "@tirajeh/shared"
import { getFreightQuotesAction } from "@/actions/shipping"
import type { FreightQuote } from "@tirajeh/shared"
import styles from "./FreightCalculator.module.css"

const PROVINCES = [
  "تهران", "اصفهان", "فارس", "خراسان رضوی", "مازندران", "آذربایجان شرقی",
  "آذربایجان غربی", "کرمانشاه", "خوزستان", "البرز", "گیلان", "قم",
  "کرمان", "هرمزگان", "سیستان و بلوچستان", "لرستان", "همدان", "گلستان",
  "مرکزی", "زنجان", "بوشهر", "اردبیل", "قزوین", "کهگیلویه و بویراحمد",
  "خراسان جنوبی", "خراسان شمالی", "چهارمحال و بختیاری", "سمنان", "ایلام",
  "یزد",
]

interface FreightCalculatorProps {
  onSelect?: (quote: FreightQuote) => void
  className?: string
}

export function FreightCalculator({ onSelect, className }: FreightCalculatorProps) {
  const t = useTranslations("freight")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()
  const [quotes, setQuotes] = useState<FreightQuote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [calculated, setCalculated] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await getFreightQuotesAction(formData)
      if (result.success) {
        setQuotes(result.data)
        setCalculated(true)
      } else {
        setError(result.error)
        setCalculated(false)
      }
    })
  }

  return (
    <div className={`${styles["web-freight-calc__root"]}${className ? ` ${className}` : ""}`}>
      <div className={styles["web-freight-calc__header"]}>
        <Truck
          className={styles["web-freight-calc__headerIcon"]}
          style={{ width: "1.25rem", height: "1.25rem" }}
          aria-hidden="true"
        />
        <h2 className={styles["web-freight-calc__headerTitle"]}>{t("title")}</h2>
      </div>

      <form onSubmit={handleSubmit} className={styles["web-freight-calc__form"]}>
        <div className={styles["web-freight-calc__row"]}>
          {/* Province */}
          <div className={styles["web-freight-calc__field"]}>
            <label htmlFor="freight-province" className={styles["web-freight-calc__label"]}>{t("province")}</label>
            <select
              id="freight-province"
              name="province"
              required
              className={styles["web-freight-calc__select"]}
            >
              <option value="">انتخاب استان</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className={styles["web-freight-calc__field"]}>
            <label htmlFor="freight-city" className={styles["web-freight-calc__label"]}>{t("city")}</label>
            <input
              id="freight-city"
              name="city"
              type="text"
              required
              placeholder="نام شهر"
              className={styles["web-freight-calc__input"]}
            />
          </div>

          {/* Weight */}
          <div className={styles["web-freight-calc__field"]}>
            <label htmlFor="freight-weight" className={styles["web-freight-calc__label"]}>{t("weight")}</label>
            <input
              id="freight-weight"
              name="totalWeightTon"
              type="number"
              step="0.5"
              min="0.5"
              max="26"
              required
              placeholder="۱"
              className={styles["web-freight-calc__input"]}
            />
          </div>
        </div>

        <button type="submit" disabled={isPending} className={styles["web-freight-calc__btn"]}>
          {isPending ? (
            <>
              <Loader2
                className={styles["web-freight-calc__spinner"]}
                style={{ width: "1rem", height: "1rem" }}
                aria-hidden="true"
              />
              در حال محاسبه...
            </>
          ) : (
            t("calculate")
          )}
        </button>
      </form>

      {error && (
        <p className={styles["web-freight-calc__error"]} role="alert">{error}</p>
      )}

      {calculated && quotes.length === 0 && !error && (
        <p className={styles["web-freight-calc__noResults"]}>{tCommon("noResults")}</p>
      )}

      {quotes.length > 0 && (
        <div className={styles["web-freight-calc__results"]}>
          <p className={styles["web-freight-calc__resultsLabel"]}>{t("result")}</p>
          <div className={styles["web-freight-calc__tableWrap"]}>
            <table className={styles["web-freight-calc__table"]}>
              <thead>
                <tr>
                  <th>{t("truckType")}</th>
                  <th>{t("delivery")}</th>
                  <th>{t("cost")}</th>
                  {onSelect && <th />}
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote, i) => (
                  <tr key={`${quote.truckType}-${i}`}>
                    <td className={styles["web-freight-calc__tdBold"]}>
                      {t(quote.truckType as Parameters<typeof t>[0])}
                    </td>
                    <td className={styles["web-freight-calc__tdMuted"]}>
                      {quote.estimatedDaysMin === quote.estimatedDaysMax
                        ? `${quote.estimatedDaysMin} ${tCommon("day")}`
                        : `${quote.estimatedDaysMin}–${quote.estimatedDaysMax} ${tCommon("day")}`}
                    </td>
                    <td className={styles["web-freight-calc__tdPrice"]}>
                      {formatToman(quote.freightCost)}
                    </td>
                    {onSelect && (
                      <td>
                        <button
                          type="button"
                          onClick={() => onSelect(quote)}
                          className={styles["web-freight-calc__selectBtn"]}
                        >
                          {t("select")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
