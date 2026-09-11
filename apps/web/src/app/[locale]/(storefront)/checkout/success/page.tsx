import Link from "next/link"
import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { CheckCircle2 } from "lucide-react"
import { Card, Button } from "@tirajeh/ui"
import styles from "./Success.module.css"

export const metadata: Metadata = {
  title: "ثبت موفق سفارش | تیراژه",
  description: "سفارش شما با موفقیت در سامانه تیراژه ثبت شد",
}

type Props = { searchParams: Promise<Record<string, string | undefined>> }

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams
  const orderNumber = sp.order ?? ""

  return (
    <div className={styles["web-chk-ok__root"]}>
      <Card variant="outlined" className={styles["web-chk-ok__card"]}>
        <div className={styles["web-chk-ok__icon-wrap"]}>
          <CheckCircle2
            style={{ width: "4rem", height: "4rem", color: "var(--color-success)" }}
            aria-hidden="true"
          />
        </div>

        <h1 className={styles["web-chk-ok__title"]}>
          {fa ? "سفارش شما با موفقیت ثبت شد!" : "Your Order Has Been Placed!"}
        </h1>

        {orderNumber && (
          <div className={styles["web-chk-ok__order-badge"]}>
            <span>{fa ? "شماره پیگیری سفارش:" : "Order Number:"}</span>
            <span>{orderNumber}</span>
          </div>
        )}

        <p className={styles["web-chk-ok__msg"]}>
          {fa
            ? "از خرید شما سپاسگزاریم. همکاران ما در واحد لجستیک و فروش به زودی جهت هماهنگی بارگیری و ارسال با شما تماس خواهند گرفت."
            : "Thank you for your order. Our logistics team will contact you shortly to coordinate shipment and delivery details."}
        </p>

        <div className={styles["web-chk-ok__actions"]}>
          <Button asChild variant="primary" size="lg" className={styles["web-chk-ok__btn"]}>
            <Link href={`/${locale}/account/orders`}>
              {fa ? "مشاهده سفارش‌های من" : "View My Orders"}
            </Link>
          </Button>

          <Button asChild variant="secondary" size="lg" className={styles["web-chk-ok__btn"]}>
            <Link href={`/${locale}`}>
              {fa ? "بازگشت به صفحه اصلی" : "Back to Home"}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
