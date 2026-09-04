"use client"

import { useState, useTransition } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createQuoteAction } from "@/actions/quote"

interface Product {
  id: string
  nameFa: string
  nameEn: string | null
}

interface QuoteFormProps {
  products: Product[]
  locale: string
}

const CUSTOMER_TYPES_FA = [
  { value: "NORMAL", label: "خریدار عادی" },
  { value: "CONTRACTOR", label: "پیمانکار" },
  { value: "COMPANY", label: "شرکت / حقوقی" },
]
const CUSTOMER_TYPES_EN = [
  { value: "NORMAL", label: "Individual Buyer" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "COMPANY", label: "Company / Corporate" },
]

export function QuoteForm({ products, locale }: QuoteFormProps) {
  const fa = locale === "fa"
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  const customerTypes = fa ? CUSTOMER_TYPES_FA : CUSTOMER_TYPES_EN

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setFieldErrors({})
    setGlobalError(null)

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
      <div className="qf-success">
        <CheckCircle2 className="qf-success-icon" aria-hidden="true" />
        <p className="qf-success-title">
          {fa ? "درخواست شما ثبت شد" : "Your request has been submitted"}
        </p>
        <p className="qf-success-body">
          {fa
            ? "کارشناسان تیراژه ظرف ۲۴ ساعت کاری با شما تماس خواهند گرفت."
            : "Tirajeh specialists will contact you within 24 business hours."}
        </p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="qf-form" noValidate>
        {/* Row 1: name + phone */}
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="qf-name" className="qf-label">
              {fa ? "نام و نام خانوادگی" : "Full Name"} <span className="qf-req" aria-hidden="true">*</span>
            </label>
            <input
              id="qf-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className={`qf-input${fieldErrors.name ? " qf-input--error" : ""}`}
              placeholder={fa ? "علی محمدی" : "Ali Mohammadi"}
            />
            {fieldErrors.name && <p className="qf-field-error">{fieldErrors.name[0]}</p>}
          </div>

          <div className="qf-field">
            <label htmlFor="qf-phone" className="qf-label">
              {fa ? "شماره موبایل" : "Mobile Number"} <span className="qf-req" aria-hidden="true">*</span>
            </label>
            <input
              id="qf-phone"
              name="phone"
              type="tel"
              required
              dir="ltr"
              autoComplete="tel"
              className={`qf-input${fieldErrors.phone ? " qf-input--error" : ""}`}
              placeholder="09123456789"
            />
            {fieldErrors.phone && <p className="qf-field-error">{fieldErrors.phone[0]}</p>}
          </div>
        </div>

        {/* Row 2: email + companyName */}
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="qf-email" className="qf-label">
              {fa ? "ایمیل" : "Email"}
            </label>
            <input
              id="qf-email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              className={`qf-input${fieldErrors.email ? " qf-input--error" : ""}`}
              placeholder="ali@example.com"
            />
            {fieldErrors.email && <p className="qf-field-error">{fieldErrors.email[0]}</p>}
          </div>

          <div className="qf-field">
            <label htmlFor="qf-company" className="qf-label">
              {fa ? "نام شرکت" : "Company Name"}
            </label>
            <input
              id="qf-company"
              name="companyName"
              type="text"
              className="qf-input"
              placeholder={fa ? "شرکت ساختمانی نمونه" : "Example Construction Co."}
            />
          </div>
        </div>

        {/* Row 3: customerType + deliveryCity */}
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="qf-type" className="qf-label">
              {fa ? "نوع مشتری" : "Customer Type"} <span className="qf-req" aria-hidden="true">*</span>
            </label>
            <select id="qf-type" name="customerType" required className="qf-select">
              {customerTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="qf-field">
            <label htmlFor="qf-city" className="qf-label">
              {fa ? "شهر تحویل" : "Delivery City"}
            </label>
            <input
              id="qf-city"
              name="deliveryCity"
              type="text"
              className="qf-input"
              placeholder={fa ? "تهران" : "Tehran"}
            />
          </div>
        </div>

        {/* Row 4: productId + quantityTon */}
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="qf-product" className="qf-label">
              {fa ? "نوع محصول" : "Product"} <span className="qf-req" aria-hidden="true">*</span>
            </label>
            <select
              id="qf-product"
              name="productId"
              required
              className={`qf-select${fieldErrors.productId ? " qf-input--error" : ""}`}
            >
              <option value="">{fa ? "انتخاب محصول" : "Select product"}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {fa ? p.nameFa : (p.nameEn ?? p.nameFa)}
                </option>
              ))}
            </select>
            {fieldErrors.productId && <p className="qf-field-error">{fieldErrors.productId[0]}</p>}
          </div>

          <div className="qf-field">
            <label htmlFor="qf-qty" className="qf-label">
              {fa ? "مقدار تقریبی (تن)" : "Estimated Quantity (tons)"} <span className="qf-req" aria-hidden="true">*</span>
            </label>
            <input
              id="qf-qty"
              name="quantityTon"
              type="number"
              required
              min="1"
              max="10000"
              step="1"
              dir="ltr"
              className={`qf-input${fieldErrors.quantityTon ? " qf-input--error" : ""}`}
              placeholder="50"
            />
            {fieldErrors.quantityTon && <p className="qf-field-error">{fieldErrors.quantityTon[0]}</p>}
          </div>
        </div>

        {/* Message */}
        <div className="qf-field">
          <label htmlFor="qf-msg" className="qf-label">
            {fa ? "توضیحات" : "Notes"}
          </label>
          <textarea
            id="qf-msg"
            name="message"
            rows={4}
            className="qf-textarea"
            placeholder={fa ? "جزئیات بیشتر مانند نوع بسته‌بندی، زمان تحویل مطلوب..." : "Further details such as packaging, preferred delivery window..."}
          />
        </div>

        {globalError && (
          <p className="qf-global-error" role="alert">{globalError}</p>
        )}

        <div className="qf-footer">
          <button type="submit" disabled={isPending} className="qf-submit">
            {isPending ? (
              <>
                <Loader2 className="qf-spinner" aria-hidden="true" />
                {fa ? "در حال ارسال..." : "Submitting..."}
              </>
            ) : (
              fa ? "ارسال درخواست" : "Submit Request"
            )}
          </button>
          <p className="qf-footer-note">
            {fa ? "با ارسال این فرم، شرایط و قوانین تیراژه را می‌پذیرید." : "By submitting, you accept Tirajeh's terms and conditions."}
          </p>
        </div>
      </form>

      <style>{`
        .qf-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .qf-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 480px) { .qf-row { grid-template-columns: 1fr 1fr; } }

        .qf-field { display: flex; flex-direction: column; gap: 0.3125rem; }
        .qf-label {
          font-size: 0.8125rem; font-weight: 600; color: var(--color-text-secondary);
        }
        .qf-req { color: var(--color-danger); margin-inline-start: 0.125rem; }

        .qf-input, .qf-select, .qf-textarea {
          width: 100%; padding: 0.5625rem 0.75rem;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.9375rem; font-family: inherit;
          color: var(--color-text); outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .qf-input::placeholder, .qf-textarea::placeholder { color: var(--color-text-muted); }
        .qf-input:focus, .qf-select:focus, .qf-textarea:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
        }
        .qf-input--error { border-color: var(--color-danger); }
        .qf-input--error:focus {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 12%, transparent);
        }
        .qf-textarea { resize: vertical; min-height: 6rem; }

        .qf-field-error { font-size: 0.75rem; color: var(--color-danger); margin-top: 0.125rem; }
        .qf-global-error {
          font-size: 0.875rem; color: var(--color-danger);
          padding: 0.75rem 1rem;
          background-color: color-mix(in srgb, var(--color-danger) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent);
          border-radius: var(--radius-md);
        }

        .qf-footer { display: flex; flex-direction: column; gap: 0.625rem; }
        .qf-submit {
          display: inline-flex; align-items: center; gap: 0.375rem; align-self: flex-start;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.9375rem; font-weight: 700; font-family: inherit;
          padding: 0.625rem 1.75rem; border: none; border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color var(--transition-fast), opacity var(--transition-fast);
        }
        .qf-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .qf-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .qf-spinner { width: 1rem; height: 1rem; animation: qf-spin 0.8s linear infinite; }
        @keyframes qf-spin { to { transform: rotate(360deg); } }

        .qf-footer-note { font-size: 0.75rem; color: var(--color-text-muted); }

        .qf-success {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.75rem; text-align: center;
          padding: 3rem 2rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        .qf-success-icon { width: 2.5rem; height: 2.5rem; color: var(--color-success, #16a34a); }
        .qf-success-title { font-size: 1.125rem; font-weight: 700; color: var(--color-text); }
        .qf-success-body { font-size: 0.9375rem; color: var(--color-text-secondary); max-width: 36ch; line-height: 1.65; }
      `}</style>
    </>
  )
}
