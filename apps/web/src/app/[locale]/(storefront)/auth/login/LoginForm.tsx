"use client"

import { useState, useTransition } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input, Label, Button } from "@tirajeh/ui"
import { loginAction } from "@/actions/auth"
import styles from "./Login.module.css"

interface LoginFormProps {
  locale: string
}

export function LoginForm({ locale }: LoginFormProps) {
  const fa = locale === "fa"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("email", email)
        fd.append("password", password)
        const result = await loginAction(fd)
        if (!result.success) {
          setError(
            result.error ??
              (fa
                ? "ورود ناموفق بود. اطلاعات خود را بررسی کنید."
                : "Login failed. Please check your credentials.")
          )
          return
        }
        window.location.href = `/${locale}`
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : undefined
        setError(
          fa
            ? msg ?? "ورود ناموفق بود. اطلاعات خود را بررسی کنید."
            : msg ?? "Login failed. Please check your credentials."
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles["web-login__form"]}>
      {error && (
        <div className={styles["web-login__error"]} role="alert">
          {error}
        </div>
      )}

      <div className={styles["web-login__field"]}>
        <Label htmlFor="login-email" required>
          {fa ? "ایمیل" : "Email"}
        </Label>
        <Input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          dir="ltr"
        />
      </div>

      <div className={styles["web-login__field"]}>
        <Label htmlFor="login-password" required>
          {fa ? "رمز عبور" : "Password"}
        </Label>
        <div className={styles["web-login__password-wrap"]}>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            dir="ltr"
          />
          <button
            type="button"
            className={styles["web-login__pw-toggle"]}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={
              showPassword
                ? fa
                  ? "پنهان کردن رمز عبور"
                  : "Hide password"
                : fa
                ? "نمایش رمز عبور"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff style={{ width: "1.125rem", height: "1.125rem" }} />
            ) : (
              <Eye style={{ width: "1.125rem", height: "1.125rem" }} />
            )}
          </button>
        </div>
      </div>

      <div className={styles["web-login__options"]}>
        <label htmlFor="login-remember-me" className={styles["web-login__remember"]}>
          <input
            id="login-remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>{fa ? "مرا به خاطر بسپار" : "Remember me"}</span>
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        disabled={isPending}
        className={styles["web-login__submit"]}
      >
        {isPending
          ? fa
            ? "در حال ورود..."
            : "Signing in..."
          : fa
          ? "ورود به حساب"
          : "Sign In"}
      </Button>
    </form>
  )
}