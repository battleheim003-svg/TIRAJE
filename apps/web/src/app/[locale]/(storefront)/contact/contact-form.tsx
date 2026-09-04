"use client"

import { useTransition, useState } from "react"
import { contactAction } from "@/actions/contact"

interface Props {
  fa: boolean
}

export function ContactForm({ fa }: Props) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await contactAction(formData)
      if (res.success) {
        setResult({ success: true })
        ;(e.target as HTMLFormElement).reset()
        setFieldErrors({})
      } else {
        setResult({ success: false, error: res.error })
        setFieldErrors((res.fieldErrors as Record<string, string[]>) ?? {})
      }
    })
  }

  if (result?.success) {
    return (
      <div className="cf-success">
        <p className="cf-success-title">{fa ? "پیام شما ارسال شد!" : "Message sent!"}</p>
        <p className="cf-success-sub">
          {fa
            ? "در اسرع وقت با شما تماس خواهیم گرفت."
            : "We'll get back to you as soon as possible."}
        </p>
        <button type="button" className="cf-reset-btn" onClick={() => setResult(null)}>
          {fa ? "ارسال پیام جدید" : "Send another message"}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="cf-form" noValidate>
      {result && !result.success && (
        <div className="cf-error-banner" role="alert">
          {result.error ?? (fa ? "خطایی رخ داد. لطفاً دوباره تلاش کنید." : "An error occurred. Please try again.")}
        </div>
      )}

      <div className="cf-row">
        <div className="cf-field">
          <label className="cf-label" htmlFor="name">
            {fa ? "نام و نام خانوادگی" : "Full name"} <span className="cf-required" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`cf-input${fieldErrors.name ? " cf-input--error" : ""}`}
            placeholder={fa ? "علی محمدی" : "Your name"}
          />
          {fieldErrors.name && <span className="cf-field-error">{fieldErrors.name[0]}</span>}
        </div>

        <div className="cf-field">
          <label className="cf-label" htmlFor="email">
            {fa ? "ایمیل" : "Email"} <span className="cf-required" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            className={`cf-input${fieldErrors.email ? " cf-input--error" : ""}`}
            placeholder="you@example.com"
          />
          {fieldErrors.email && <span className="cf-field-error">{fieldErrors.email[0]}</span>}
        </div>
      </div>

      <div className="cf-field">
        <label className="cf-label" htmlFor="phone">
          {fa ? "شماره موبایل" : "Mobile"}{" "}
          <span className="cf-optional">({fa ? "اختیاری" : "optional"})</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          dir="ltr"
          className={`cf-input${fieldErrors.phone ? " cf-input--error" : ""}`}
          placeholder="09123456789"
        />
        {fieldErrors.phone && <span className="cf-field-error">{fieldErrors.phone[0]}</span>}
      </div>

      <div className="cf-field">
        <label className="cf-label" htmlFor="subject">
          {fa ? "موضوع" : "Subject"} <span className="cf-required" aria-hidden="true">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className={`cf-input${fieldErrors.subject ? " cf-input--error" : ""}`}
          placeholder={fa ? "استعلام قیمت سیمان پرتلند" : "Portland cement price inquiry"}
        />
        {fieldErrors.subject && <span className="cf-field-error">{fieldErrors.subject[0]}</span>}
      </div>

      <div className="cf-field">
        <label className="cf-label" htmlFor="message">
          {fa ? "پیام" : "Message"} <span className="cf-required" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`cf-textarea${fieldErrors.message ? " cf-input--error" : ""}`}
          placeholder={fa ? "پیام خود را اینجا بنویسید…" : "Write your message here…"}
        />
        {fieldErrors.message && <span className="cf-field-error">{fieldErrors.message[0]}</span>}
      </div>

      <button type="submit" disabled={pending} className="cf-submit">
        {pending
          ? (fa ? "در حال ارسال…" : "Sending…")
          : (fa ? "ارسال پیام" : "Send message")}
      </button>
    </form>
  )
}
