"use client"

import { useState, useTransition } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input, Label, Button } from "@tirajeh/ui"
import { registerAction } from "@/actions/auth"
import styles from "./Register.module.css"

interface RegisterFormProps {
  locale: string
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const fa = locale === "fa"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError(
        fa ? "رمز عبور با تأیید آن مطابقت ندارد." : "Passwords do not match."
      )
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
          setError(
            result.error ??
              (fa
                ? "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید."
                : "Registration failed. Please try again.")
          )
          return
        }
        window.location.href = `/${locale}/auth/login?registered=1`
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : undefined
        setError(
          fa
            ? msg ?? "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید."
            : msg ?? "Registration failed. Please try again."
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles["web-reg__form"]}>
      {error && (
        <div className={styles["web-reg__error"]} role="alert">
          {error}
        </div>
      )}

      <div className={styles["web-reg__field"]}>
        <Label htmlFor="reg-name" required>
          {fa ? "نام و نام خانوادگی" : "Full Name"}
        </Label>
        <Input
          id="reg-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={fa ? "نام و نام خانوادگی شما" : "Your full name"}
        />
      </div>

      <div className={styles["web-reg__field"]}>
        <Label htmlFor="reg-email" required>
          {fa ? "ایمیل" : "Email"}
        </Label>
        <Input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          dir="ltr"
        />
      </div>

      <div className={styles["web-reg__field"]}>
        <Label htmlFor="reg-password" required>
          {fa ? "رمز عبور" : "Password"}
        </Label>
        <div className={styles["web-reg__password-wrap"]}>
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={fa ? "حداقل ۸ کاراکتر" : "At least 8 characters"}
            dir="ltr"
          />
          <button
            type="button"
            className={styles["web-reg__pw-toggle"]}
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

      <div className={styles["web-reg__field"]}>
        <Label htmlFor="reg-confirm" required>
          {fa ? "تأیید رمز عبور" : "Confirm Password"}
        </Label>
        <div className={styles["web-reg__password-wrap"]}>
          <Input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            dir="ltr"
          />
          <button
            type="button"
            className={styles["web-reg__pw-toggle"]}
            onClick={() => setShowConfirm((prev) => !prev)}
            aria-label={
              showConfirm
                ? fa
                  ? "پنهان کردن رمز عبور"
                  : "Hide password"
                : fa
                ? "نمایش رمز عبور"
                : "Show password"
            }
          >
            {showConfirm ? (
              <EyeOff style={{ width: "1.125rem", height: "1.125rem" }} />
            ) : (
              <Eye style={{ width: "1.125rem", height: "1.125rem" }} />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        disabled={isPending}
        className={styles["web-reg__submit"]}
      >
        {isPending
          ? fa
            ? "در حال ثبت‌نام..."
            : "Registering..."
          : fa
          ? "ایجاد حساب"
          : "Register"}
      </Button>
    </form>
  )
}