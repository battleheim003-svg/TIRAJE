import Link from "next/link"
import type { Metadata } from "next"
import { LoginForm } from "./LoginForm"
import styles from "./Login.module.css"

export const metadata: Metadata = {
  title: "ورود به حساب کاربری | تیراژه",
  description: "ورود به حساب کاربری تیراژه جهت پیگیری سفارشات و خرید سیمان و مصالح ساختمانی",
}

interface LoginPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ registered?: string }>
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params
  const { registered } = await searchParams
  const fa = locale === "fa"
  const justRegistered = registered === "1"

  return (
    <div className={styles["web-login"]}>
      <div className={styles["web-login__card"]}>
        <div className={styles["web-login__head"]}>
          <h1 className={styles["web-login__title"]}>
            {fa ? "ورود به حساب کاربری" : "Sign In"}
          </h1>
          <p className={styles["web-login__sub"]}>
            {fa ? "حساب کاربری ندارید؟" : "Don't have an account?"}{" "}
            <Link href={`/${locale}/auth/register`} className={styles["web-login__link"]}>
              {fa ? "ثبت‌نام کنید" : "Sign up"}
            </Link>
          </p>
        </div>

        {justRegistered && (
          <div className={styles["web-login__success"]} role="status">
            {fa
              ? "ثبت‌نام با موفقیت انجام شد! لطفاً وارد شوید."
              : "Registration successful! Please sign in."}
          </div>
        )}

        <LoginForm locale={locale} />
      </div>
    </div>
  )
}