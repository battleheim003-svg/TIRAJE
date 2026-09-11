import Link from "next/link"
import type { Metadata } from "next"
import { RegisterForm } from "./RegisterForm"
import styles from "./Register.module.css"

export const metadata: Metadata = {
  title: "ثبت‌نام و ایجاد حساب | تیراژه",
  description: "عضویت در تیراژه برای خرید آنلاین مصالح ساختمانی و سیمان از کارخانجات معتبر",
}

interface RegisterPageProps {
  params: Promise<{ locale: string }>
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params
  const fa = locale === "fa"

  return (
    <div className={styles["web-reg"]}>
      <div className={styles["web-reg__card"]}>
        <div className={styles["web-reg__head"]}>
          <h1 className={styles["web-reg__title"]}>
            {fa ? "ایجاد حساب کاربری" : "Create Account"}
          </h1>
          <p className={styles["web-reg__sub"]}>
            {fa ? "قبلاً ثبت‌نام کرده‌اید؟" : "Already have an account?"}{" "}
            <Link href={`/${locale}/auth/login`} className={styles["web-reg__link"]}>
              {fa ? "وارد شوید" : "Sign in"}
            </Link>
          </p>
        </div>

        <RegisterForm locale={locale} />
      </div>
    </div>
  )
}