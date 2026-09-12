"use client"

import { useState, useTransition } from "react"
import { Truck } from "lucide-react"
import { Card, Button, Input, Label, Select } from "@tirajeh/ui"
import { calculateShippingCostAction } from "@/actions/shipping"
import { formatToman } from "@/lib/cement"
import styles from "./Freight.module.css"

const PROVINCES = [
  "تهران", "اصفهان", "فارس", "خراسان رضوی", "مازندران", "آذربایجان شرقی",
  "آذربایجان غربی", "کرمانشاه", "خوزستان", "البرز", "گیلان", "قم",
  "کرمان", "هرمزگان", "سیستان و بلوچستان", "لرستان", "همدان", "گلستان",
  "مرکزی", "زنجان", "بوشهر", "اردبیل", "قزوین", "کهگیلویه و بویراحمد",
  "خراسان جنوبی", "خراسان شمالی", "چهارمحال و بختیاری", "سمنان", "ایلام",
  "یزد",
]

const TRUCK_TYPES_FA = [
  { value: "TRAILER_22T", label: "تریلی کفی (ظرفیت تا ۲۶ تن)" },
  { value: "TRUCK_10T", label: "کامیون جفت / ۱۰ چرخ (ظرفیت تا ۱۵ تن)" },
  { value: "TRUCK_6T", label: "کامیون تک / ۶ چرخ (ظرفیت تا ۱۰ تن)" },
  { value: "PICKUP_3T", label: "خاور / کامیونت (ظرفیت تا ۵ تن)" },
]

const TRUCK_TYPES_EN = [
  { value: "TRAILER_22T", label: "Flatbed Trailer (up to 26t)" },
  { value: "TRUCK_10T", label: "10-Wheeler Truck (up to 15t)" },
  { value: "TRUCK_6T", label: "6-Wheeler Truck (up to 10t)" },
  { value: "PICKUP_3T", label: "Light Truck / Khavar (up to 5t)" },
]

interface FreightCalcFormProps {
  locale: string
}

export function FreightCalcForm({ locale }: FreightCalcFormProps) {
  const fa = locale === "fa"
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)

  const truckOptions = fa ? TRUCK_TYPES_FA : TRUCK_TYPES_EN
  const provinceOptions = PROVINCES.map((p) => ({ value: p, label: p }))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await calculateShippingCostAction(formData)
      if (result.success && result.data) {
        setEstimatedCost(result.data.freightCost)
      } else if (!result.success) {
        setError(result.error || "خطای ناشناخته در استعلام هزینه")
        setEstimatedCost(null)
      }
    })
  }

  return (
    <Card variant="outlined" className={styles["web-frgt__card"]}>
      <div className={styles["web-frgt__card-header"]}>
        <Truck
          className={styles["web-frgt__card-icon"]}
          style={{ width: "1.75rem", height: "1.75rem" }}
          aria-hidden="true"
        />
        <h2 className={styles["web-frgt__card-title"]}>
          {fa ? "مشخصات محموله و مسیر حمل" : "Cargo & Route Details"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className={styles["web-frgt__form"]}>
        {error && (
          <div className={styles["web-frgt__error"]} role="alert">
            {error}
          </div>
        )}

        <div className={styles["web-frgt__grid"]}>
          {/* Origin City */}
          <div className={styles["web-frgt__field"]}>
            <Label htmlFor="originCity" required>
              {fa ? "شهر مبدا (بارگیری)" : "Origin City"}
            </Label>
            <Input
              id="originCity"
              name="originCity"
              type="text"
              required
              defaultValue={fa ? "تهران (انبار مرکزی تیراژه)" : "Tehran"}
            />
          </div>

          {/* Destination Province */}
          <div className={styles["web-frgt__field"]}>
            <Label htmlFor="province" required>
              {fa ? "استان مقصد" : "Destination Province"}
            </Label>
            <Select
              id="province"
              name="province"
              required
              options={provinceOptions}
              placeholder={fa ? "انتخاب استان..." : "Select province..."}
            />
          </div>

          {/* Destination City */}
          <div className={styles["web-frgt__field"]}>
            <Label htmlFor="city" required>
              {fa ? "شهر مقصد (تخلیه)" : "Destination City"}
            </Label>
            <Input
              id="city"
              name="city"
              type="text"
              required
              placeholder={fa ? "مثال: کرج، اصفهان..." : "e.g. Karaj"}
            />
          </div>

          {/* Cargo Weight */}
          <div className={styles["web-frgt__field"]}>
            <Label htmlFor="totalWeightTon" required>
              {fa ? "وزن محموله (تن)" : "Cargo Weight (Tons)"}
            </Label>
            <Input
              id="totalWeightTon"
              name="totalWeightTon"
              type="number"
              step="0.5"
              min="0.5"
              max="26"
              required
              defaultValue="25"
              dir="ltr"
            />
          </div>

          {/* Truck Type */}
          <div className={[styles["web-frgt__field"], styles["web-frgt__field--full"]].join(" ")}>
            <Label htmlFor="truckType" required>
              {fa ? "نوع ناوگان باربری" : "Truck Type"}
            </Label>
            <Select
              id="truckType"
              name="truckType"
              required
              options={truckOptions}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending}
          className={styles["web-frgt__submit-btn"]}
        >
          {isPending
            ? fa
              ? "در حال استعلام نرخ باربری..."
              : "Calculating..."
            : fa
            ? "محاسبه آنلاین کرایه حمل"
            : "Calculate Freight Cost"}
        </Button>
      </form>

      {/* Result Display */}
      {estimatedCost !== null && (
        <div className={styles["web-frgt__result-box"]}>
          <span className={styles["web-frgt__result-label"]}>
            {fa ? "کرایه حمل برآوردی (یک سرویس):" : "Estimated Freight Cost:"}
          </span>
          <span className={styles["web-frgt__result-val"]}>
            {formatToman(estimatedCost, locale as "fa" | "en")}
          </span>
          <span className={styles["web-frgt__result-note"]}>
            {fa
              ? "نرخ فوق شامل بیمه باربری دولتی و صدور بارنامه رسمی تمبردار می‌باشد."
              : "Includes freight transit insurance and official waybill fees."}
          </span>
        </div>
      )}
    </Card>
  )
}
