"use client"

import { useState, useTransition } from "react"
import { PlusCircle, Trash2, CheckCircle2 } from "lucide-react"
import { Card, Button, Input, Label, Select, Textarea } from "@tirajeh/ui"
import { createQuoteAction } from "@/actions/quote"
import styles from "./Quote.module.css"

interface Product {
  id: string
  nameFa: string
  nameEn: string | null
}

interface QuoteFormProps {
  products: Product[]
  locale: string
}

interface LineItem {
  id: string
  productId: string
  packaging: string
  quantityTon: string
}

const CUSTOMER_TYPES_FA = [
  { value: "NORMAL", label: "خریدار عادی / شخصی" },
  { value: "CONTRACTOR", label: "پیمانکار ساختمانی" },
  { value: "COMPANY", label: "شرکت / سازمان حقوقی" },
]

const CUSTOMER_TYPES_EN = [
  { value: "NORMAL", label: "Individual Buyer" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "COMPANY", label: "Corporate / Company" },
]

const PACKAGING_OPTIONS_FA = [
  { value: "BAG_50", label: "کیسه ۵۰ کیلویی" },
  { value: "BULK", label: "فله (حمل با بونکر)" },
  { value: "JUMBO", label: "جامبوبگ ۱.۵ تنی" },
]

const PACKAGING_OPTIONS_EN = [
  { value: "BAG_50", label: "50kg Bag" },
  { value: "BULK", label: "Bulk (Pneumatic Tanker)" },
  { value: "JUMBO", label: "1.5-ton Jumbo Bag" },
]

export function QuoteForm({ products, locale }: QuoteFormProps) {
  const fa = locale === "fa"
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "row-1",
      productId: products[0]?.id ?? "",
      packaging: "BAG_50",
      quantityTon: "25",
    },
  ])

  const customerTypes = fa ? CUSTOMER_TYPES_FA : CUSTOMER_TYPES_EN
  const packagingOptions = fa ? PACKAGING_OPTIONS_FA : PACKAGING_OPTIONS_EN
  const productOptions = products.map((p) => ({
    value: p.id,
    label: fa ? p.nameFa : p.nameEn ?? p.nameFa,
  }))

  function handleAddRow() {
    setLineItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        productId: products[0]?.id ?? "",
        packaging: "BAG_50",
        quantityTon: "25",
      },
    ])
  }

  function handleRemoveRow(id: string) {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleItemChange(id: string, field: keyof LineItem, val: string) {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Ensure primary product and quantity are set from first line item
    const primary = lineItems[0]
    if (primary) {
      formData.set("productId", primary.productId)
      formData.set("quantityTon", primary.quantityTon)
    }

    // If multiple line items exist, append summary to message
    if (lineItems.length > 1) {
      const lineDetails = lineItems
        .map((item, idx) => {
          const prodName = products.find((p) => p.id === item.productId)?.nameFa ?? item.productId
          const packName = packagingOptions.find((o) => o.value === item.packaging)?.label ?? item.packaging
          return `ردیف ${idx + 1}: ${prodName} - بسته‌بندی: ${packName} - تناژ: ${item.quantityTon} تن`
        })
        .join("\n")

      const userNote = (formData.get("message") as string) || ""
      formData.set("message", `${userNote}\n\n[اقلام درخواستی استعلام]:\n${lineDetails}`.trim())
    }

    startTransition(async () => {
      const result = await createQuoteAction(formData)
      if (result.success) {
        setSuccess(true)
      } else {
        setGlobalError(result.error)
        if ("fieldErrors" in result && result.fieldErrors) {
          setFieldErrors(result.fieldErrors as Record<string, string[]>)
        }
      }
    })
  }

  if (success) {
    return (
      <Card variant="raised" className={styles["web-rfq__card"]}>
        <div className={styles["web-rfq__success"]}>
          <CheckCircle2
            className={styles["web-rfq__success-icon"]}
            style={{ width: "3.5rem", height: "3.5rem" }}
            aria-hidden="true"
          />
          <h2 className={styles["web-rfq__success-title"]}>
            {fa ? "درخواست استعلام قیمت شما با موفقیت ثبت شد" : "Quote Request Successfully Submitted"}
          </h2>
          <p className={styles["web-rfq__success-desc"]}>
            {fa
              ? "پیش‌فاکتور رسمی و بهترین قیمت روز پس از بررسی توسط واحد فروش، ظرف حداکثر ۲۴ ساعت کاری ارسال خواهد شد."
              : "Our commercial team will review your requirements and provide an official quotation within 24 business hours."}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSuccess(false)}
          >
            {fa ? "ثبت درخواست استعلام دیگر" : "Submit Another RFQ"}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="raised" className={styles["web-rfq__card"]}>
      <form onSubmit={handleSubmit} className={styles["web-rfq__form"]} noValidate>
        {globalError && (
          <div className={styles["web-rfq__error-banner"]} role="alert">
            {globalError}
          </div>
        )}

        {/* Section 1: Customer Info */}
        <h3 className={styles["web-rfq__section-title"]}>
          {fa ? "۱. اطلاعات متقاضی و خریدار" : "1. Buyer & Contact Information"}
        </h3>

        <div className={styles["web-rfq__grid"]}>
          <div className={styles["web-rfq__field"]}>
            <Label htmlFor="qf-name" required>
              {fa ? "نام و نام خانوادگی" : "Full Name"}
            </Label>
            <Input
              id="qf-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder={fa ? "علی محمدی" : "Ali Mohammadi"}
              error={!!fieldErrors.name}
              errorText={fieldErrors.name?.[0]}
            />
          </div>

          <div className={styles["web-rfq__field"]}>
            <Label htmlFor="qf-phone" required>
              {fa ? "شماره تلفن همراه" : "Mobile Phone"}
            </Label>
            <Input
              id="qf-phone"
              name="phone"
              type="tel"
              required
              dir="ltr"
              autoComplete="tel"
              placeholder="09123456789"
              error={!!fieldErrors.phone}
              errorText={fieldErrors.phone?.[0]}
            />
          </div>

          <div className={styles["web-rfq__field"]}>
            <Label htmlFor="qf-email">
              {fa ? "پست الکترونیک" : "Email"}
            </Label>
            <Input
              id="qf-email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@company.com"
              error={!!fieldErrors.email}
              errorText={fieldErrors.email?.[0]}
            />
          </div>

          <div className={styles["web-rfq__field"]}>
            <Label htmlFor="qf-company">
              {fa ? "نام شرکت / پروژه ساختمانی" : "Company or Project Name"}
            </Label>
            <Input
              id="qf-company"
              name="companyName"
              type="text"
              placeholder={fa ? "شرکت عمران سازه پیشرو" : "Omran Sazeh Co."}
            />
          </div>

          <div className={styles["web-rfq__field"]}>
            <Label htmlFor="qf-type" required>
              {fa ? "نوع مشتری" : "Customer Type"}
            </Label>
            <Select
              id="qf-type"
              name="customerType"
              required
              options={customerTypes}
            />
          </div>

          <div className={styles["web-rfq__field"]}>
            <Label htmlFor="qf-city">
              {fa ? "شهر و محل پروژه جهت تحویل" : "Delivery City / Location"}
            </Label>
            <Input
              id="qf-city"
              name="deliveryCity"
              type="text"
              placeholder={fa ? "مثال: تهران / اصفهان" : "e.g. Tehran"}
            />
          </div>
        </div>

        {/* Section 2: Dynamic Line Items */}
        <h3 className={styles["web-rfq__section-title"]}>
          {fa ? "۲. مشخصات اقلام و تناژ درخواستی" : "2. Product Requirements & Tonnage"}
        </h3>

        <div className={styles["web-rfq__items-container"]}>
          {lineItems.map((item, index) => (
            <div key={item.id} className={styles["web-rfq__line-item"]}>
              <div className={styles["web-rfq__field"]}>
                <Label htmlFor={`prod-${item.id}`} required>
                  {fa ? `محصول (${index + 1})` : `Product (${index + 1})`}
                </Label>
                <Select
                  id={`prod-${item.id}`}
                  options={productOptions}
                  value={item.productId}
                  onChange={(e) => handleItemChange(item.id, "productId", e.target.value)}
                />
              </div>

              <div className={styles["web-rfq__field"]}>
                <Label htmlFor={`pack-${item.id}`}>
                  {fa ? "نوع بسته‌بندی" : "Packaging"}
                </Label>
                <Select
                  id={`pack-${item.id}`}
                  options={packagingOptions}
                  value={item.packaging}
                  onChange={(e) => handleItemChange(item.id, "packaging", e.target.value)}
                />
              </div>

              <div className={styles["web-rfq__field"]}>
                <Label htmlFor={`qty-${item.id}`} required>
                  {fa ? "مقدار (تن)" : "Qty (Tons)"}
                </Label>
                <Input
                  id={`qty-${item.id}`}
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  dir="ltr"
                  value={item.quantityTon}
                  onChange={(e) => handleItemChange(item.id, "quantityTon", e.target.value)}
                />
              </div>

              <button
                type="button"
                disabled={lineItems.length <= 1}
                onClick={() => handleRemoveRow(item.id)}
                className={styles["web-rfq__remove-btn"]}
                aria-label={fa ? "حذف این ردیف" : "Remove item row"}
              >
                <Trash2 style={{ width: "1.125rem", height: "1.125rem" }} />
              </button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            onClick={handleAddRow}
            className={styles["web-rfq__add-row-btn"]}
          >
            <PlusCircle style={{ width: "1.125rem", height: "1.125rem" }} />
            <span>{fa ? "افزودن محصول دیگر به استعلام" : "Add Another Product"}</span>
          </Button>
        </div>

        {/* Section 3: Notes */}
        <div className={styles["web-rfq__field"]}>
          <Label htmlFor="qf-msg">
            {fa ? "توضیحات تکمیلی یا شرایط خاص تخلیه" : "Additional Notes or Unloading Conditions"}
          </Label>
          <Textarea
            id="qf-msg"
            name="message"
            rows={3}
            placeholder={fa ? "در صورت نیاز به زمان‌بندی خاص، شیوه پرداخت یا استانداردهای آزمایشگاهی، یادداشت فرمایید..." : "Specify special delivery schedule, payment terms or test certificates..."}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending}
          className={styles["web-rfq__submit-btn"]}
        >
          {isPending
            ? fa
              ? "در حال ثبت درخواست..."
              : "Submitting..."
            : fa
            ? "ارسال فرم استعلام قیمت"
            : "Submit Quote Request"}
        </Button>

        <p className={styles["web-rfq__footer-note"]}>
          {fa
            ? "با ارسال این فرم، درخواست شما مستقیماً در کارتابل واحد بازرگانی ثبت و پیگیری خواهد شد."
            : "Your RFQ will be processed directly by our commercial sales desk."}
        </p>
      </form>
    </Card>
  )
}
