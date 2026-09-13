"use client"

import { useTransition, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Card, Button, Input, Label, Textarea } from "@tirajeh/ui"
import { contactAction } from "@/actions/contact"
import styles from "./Contact.module.css"

interface ContactFormProps {
  locale: string
}

export function ContactForm({ locale }: ContactFormProps) {
  const fa = locale === "fa"
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
        setFieldErrors({})
      } else {
        setResult({ success: false, error: res.error })
        setFieldErrors((res.fieldErrors as Record<string, string[]>) ?? {})
      }
    })
  }

  return (
    <Card variant="outlined" className={styles["web-con__form-card"]}>
      <h2 className={styles["web-con__form-title"]}>
        {fa ? "ارسال پیام و استعلام" : "Send a Message"}
      </h2>

      {result?.success ? (
        <div className={styles["web-con__success"]}>
          <CheckCircle2
            className={styles["web-con__success-icon"]}
            style={{ width: "3.5rem", height: "3.5rem" }}
            aria-hidden="true"
          />
          <h3 className={styles["web-con__success-title"]}>
            {fa ? "پیام شما با موفقیت ثبت شد!" : "Message Successfully Sent!"}
          </h3>
          <p className={styles["web-con__success-desc"]}>
            {fa
              ? "کارشناسان پشتیبانی و فروش تیراژه در اسرع وقت با شما تماس خواهند گرفت."
              : "Our support and sales team will contact you as soon as possible."}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setResult(null)}
          >
            {fa ? "ارسال پیام جدید" : "Send Another Message"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles["web-con__form"]} noValidate>
          {/* Honeypot field for anti-spam */}
          <input
            type="text"
            name="_hp"
            aria-hidden="true"
            tabIndex={-1}
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
            autoComplete="off"
          />

          {result && !result.success && (
            <div className={styles["web-con__error"]} role="alert">
              {result.error ??
                (fa
                  ? "خطایی رخ داد. لطفاً دوباره تلاش کنید."
                  : "An error occurred. Please try again.")}
            </div>
          )}

          <div className={styles["web-con__form-row"]}>
            <div className={styles["web-con__field"]}>
              <Label htmlFor="name" required>
                {fa ? "نام و نام خانوادگی" : "Full Name"}
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={fa ? "علی محمدی" : "John Doe"}
                error={!!fieldErrors.name}
                errorText={fieldErrors.name?.[0]}
              />
            </div>

            <div className={styles["web-con__field"]}>
              <Label htmlFor="email" required>
                {fa ? "آدرس ایمیل" : "Email Address"}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                placeholder="you@example.com"
                error={!!fieldErrors.email}
                errorText={fieldErrors.email?.[0]}
              />
            </div>
          </div>

          <div className={styles["web-con__form-row"]}>
            <div className={styles["web-con__field"]}>
              <Label htmlFor="phone">
                {fa ? "شماره تلفن همراه (اختیاری)" : "Mobile Phone (optional)"}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="09123456789"
                error={!!fieldErrors.phone}
                errorText={fieldErrors.phone?.[0]}
              />
            </div>

            <div className={styles["web-con__field"]}>
              <Label htmlFor="subject" required>
                {fa ? "موضوع پیام" : "Subject"}
              </Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder={fa ? "استعلام قیمت سیمان تیپ ۲" : "Type 2 Cement Price Inquiry"}
                error={!!fieldErrors.subject}
                errorText={fieldErrors.subject?.[0]}
              />
            </div>
          </div>

          <div className={styles["web-con__field"]}>
            <Label htmlFor="message" required>
              {fa ? "متن پیام" : "Message"}
            </Label>
            <Textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder={fa ? "پیام، سوال یا درخواست خود را شرح دهید..." : "Describe your inquiry or question..."}
              error={!!fieldErrors.message}
              errorText={fieldErrors.message?.[0]}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending}
            className={styles["web-con__submit-btn"]}
          >
            {pending
              ? fa
                ? "در حال ارسال پیام..."
                : "Sending..."
              : fa
              ? "ارسال پیام"
              : "Send Message"}
          </Button>
        </form>
      )}
    </Card>
  )
}
