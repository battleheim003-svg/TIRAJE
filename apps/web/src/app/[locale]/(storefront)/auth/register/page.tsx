"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { registerAction } from "@/actions/auth"

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>()
  const fa = locale === "fa"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError(fa ? "رمز عبور با تأیید آن مطابقت ندارد." : "Passwords do not match.")
      return
    }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("name", name)
        fd.append("email", email)
        fd.append("password", password)
        fd.append("confirmPassword", confirm)
        const result = await registerAction(fd)
        if (!result.success) {
          setError(result.error ?? (fa ? "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید." : "Registration failed. Please try again."))
          return
        }
        window.location.href = `/${locale}/auth/login?registered=1`
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : undefined
        setError(
          fa
            ? (msg ?? "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.")
            : (msg ?? "Registration failed. Please try again.")
        )
      }
    })
  }

  return (
    <>
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-head">
            <h1 className="auth-title">{fa ? "ایجاد حساب کاربری" : "Create Account"}</h1>
            <p className="auth-sub">
              {fa ? "قبلاً ثبت‌نام کرده‌اید؟" : "Already have an account?"}{" "}
              <Link href={`/${locale}/auth/login`} className="auth-link">
                {fa ? "وارد شوید" : "Sign In"}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-name">
                {fa ? "نام و نام خانوادگی" : "Full Name"}
              </label>
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder={fa ? "نام شما" : "Your name"}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-email">
                {fa ? "ایمیل" : "Email"}
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-password">
                {fa ? "رمز عبور" : "Password"}
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder={fa ? "حداقل ۸ کاراکتر" : "At least 8 characters"}
                dir="ltr"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-confirm">
                {fa ? "تأیید رمز عبور" : "Confirm Password"}
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button type="submit" disabled={isPending} className="auth-btn">
              {isPending
                ? (fa ? "در حال ثبت‌نام..." : "Registering...")
                : (fa ? "ثبت‌نام" : "Register")}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .auth-root {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
        }
        .auth-card {
          width: 100%;
          max-width: 22rem;
        }
        .auth-head {
          text-align: center;
          margin-bottom: 1.75rem;
        }
        .auth-title {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .auth-sub {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-top: 0.375rem;
        }
        .auth-link {
          color: var(--color-accent);
          text-decoration: none;
          font-weight: 600;
        }
        .auth-link:hover { text-decoration: underline; }

        .auth-form {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
          box-shadow: var(--shadow-sm);
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .auth-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .auth-input {
          width: 100%;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.5625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: var(--color-text-muted); }
        .auth-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
        }

        .auth-error {
          font-size: 0.8125rem;
          color: var(--color-danger);
          background-color: var(--color-danger-subtle);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }

        .auth-btn {
          width: 100%;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.625rem 1rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .auth-btn:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .auth-btn:disabled {
          background-color: var(--color-border);
          color: var(--color-text-muted);
          cursor: not-allowed;
        }
        .auth-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
      `}</style>
    </>
  )
}
