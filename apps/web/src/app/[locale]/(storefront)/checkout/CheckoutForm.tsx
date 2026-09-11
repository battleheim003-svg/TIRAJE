"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, Button, Input, Label, Textarea, Select } from "@tirajeh/ui"
import { checkoutAction } from "@/actions/order"
import { formatPrice } from "@/lib/cement"
import styles from "./Checkout.module.css"

const PROVINCES = [
  "تهران", "اصفهان", "خراسان رضوی", "فارس", "خوزستان", "آذربایجان شرقی", "آذربایجان غربی",
  "کرمان", "مازندران", "گیلان", "سیستان و بلوچستان", "لرستان", "همدان", "کرمانشاه", "گلستان",
  "بوشهر", "زنجان", "سمنان", "قزوین", "قم", "کردستان", "مرکزی", "هرمزگان", "ایلام", "چهارمحال و بختیاری",
  "خراسان شمالی", "خراسان جنوبی", "کهگیلویه و بویراحمد", "اردبیل", "البرز", "یزد",
]

interface CheckoutItem {
  id: string
  quantity: number
  product: {
    nameFa: string
    nameEn?: string | null
    price: number | string | bigint
  }
}

interface CheckoutFormProps {
  subtotal: number
  items: CheckoutItem[]
  locale: string
}

export default function CheckoutForm({ subtotal, items, locale }: CheckoutFormProps) {
  const fa = locale === "fa"
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard")
  const [paymentMethod, setPaymentMethod] = useState<"online" | "transfer" | "credit">("online")

  const shippingCost = shippingMethod === "express" ? 250000 : 0
  const totalAmount = subtotal + shippingCost

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.append("shippingMethod", shippingMethod)
    fd.append("paymentMethod", paymentMethod)

    startTransition(async () => {
      const result = await checkoutAction(fd)
      if (result && !result.success) {
        setError(result.error)
      }
    })
  }

  const provinceOptions = PROVINCES.map((p) => ({ value: p, label: p }))

  return (
    <form onSubmit={handleSubmit} className={styles["web-chk__layout"]}>
      {/* Main Column: Address, Shipping, Payment */}
      <div className={styles["web-chk__sections"]}>
        {error && (
          <div className={styles["web-chk__error"]} role="alert">
            {error}
          </div>
        )}

        {/* Section 1: Address */}
        <Card variant="outlined" className={styles["web-chk__card"]}>
          <h2 className={styles["web-chk__section-heading"]}>
            {fa ? "۱. اطلاعات و نشانی تحویل گیرنده" : "1. Delivery Information"}
          </h2>

          <div className={styles["web-chk__grid"]}>
            <div className={styles["web-chk__field"]}>
              <Label htmlFor="recipientName" required>
                {fa ? "نام و نام خانوادگی گیرنده" : "Recipient Full Name"}
              </Label>
              <Input
                id="recipientName"
                name="recipientName"
                type="text"
                required
                placeholder={fa ? "مثال: علی محمدی" : "e.g. John Doe"}
              />
            </div>

            <div className={styles["web-chk__field"]}>
              <Label htmlFor="phone" required>
                {fa ? "شماره تلفن همراه" : "Mobile Phone"}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                dir="ltr"
                placeholder="09123456789"
              />
            </div>

            <div className={styles["web-chk__field"]}>
              <Label htmlFor="province" required>
                {fa ? "استان" : "Province"}
              </Label>
              <Select
                id="province"
                name="province"
                required
                options={provinceOptions}
                placeholder={fa ? "انتخاب استان..." : "Select province..."}
              />
            </div>

            <div className={styles["web-chk__field"]}>
              <Label htmlFor="city" required>
                {fa ? "شهر" : "City"}
              </Label>
              <Input
                id="city"
                name="city"
                type="text"
                required
                placeholder={fa ? "مثال: تهران" : "e.g. Tehran"}
              />
            </div>

            <div className={[styles["web-chk__field"], styles["web-chk__field--full"]].join(" ")}>
              <Label htmlFor="street" required>
                {fa ? "نشانی دقیق پستی" : "Full Street Address"}
              </Label>
              <Textarea
                id="street"
                name="street"
                required
                rows={3}
                placeholder={fa ? "خیابان، کوچه، پلاک، واحد..." : "Street, building, unit..."}
              />
            </div>

            <div className={styles["web-chk__field"]}>
              <Label htmlFor="postalCode">
                {fa ? "کد پستی (۱۰ رقمی)" : "Postal Code (10 digits)"}
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                type="text"
                maxLength={10}
                dir="ltr"
                placeholder="XXXXXXXXXX"
              />
            </div>

            <div className={[styles["web-chk__field"], styles["web-chk__field--full"]].join(" ")}>
              <Label htmlFor="note">
                {fa ? "توضیحات و نکات سفارش (اختیاری)" : "Order Notes (optional)"}
              </Label>
              <Textarea
                id="note"
                name="note"
                rows={2}
                placeholder={fa ? "نکاتی برای تخلیه بار یا هماهنگی ارسال..." : "Delivery notes..."}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Shipping Method */}
        <Card variant="outlined" className={styles["web-chk__card"]}>
          <h2 className={styles["web-chk__section-heading"]}>
            {fa ? "۲. انتخاب روش ارسال بار" : "2. Shipping Method"}
          </h2>

          <div className={styles["web-chk__radio-group"]}>
            <label
              className={[
                styles["web-chk__radio-option"],
                shippingMethod === "standard" ? styles["web-chk__radio-option--selected"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="shippingOption"
                value="standard"
                checked={shippingMethod === "standard"}
                onChange={() => setShippingMethod("standard")}
                className={styles["web-chk__radio-input"]}
                aria-label={fa ? "باربری معمول و استاندارد - رایگان" : "Standard Freight - Free"}
              />
              <div className={styles["web-chk__radio-content"]}>
                <div className={styles["web-chk__radio-header"]}>
                  <span className={styles["web-chk__radio-title"]}>
                    {fa ? "باربری معمول و استاندارد" : "Standard Freight"}
                  </span>
                  <span className={styles["web-chk__radio-cost"]}>
                    {fa ? "رایگان (تعهد فروش)" : "Free"}
                  </span>
                </div>
                <p className={styles["web-chk__radio-desc"]}>
                  {fa
                    ? "ارسال از طریق ناوگان باربری استاندارد طی ۳ الی ۵ روز کاری."
                    : "Standard logistics delivery within 3 to 5 business days."}
                </p>
              </div>
            </label>

            <label
              className={[
                styles["web-chk__radio-option"],
                shippingMethod === "express" ? styles["web-chk__radio-option--selected"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="shippingOption"
                value="express"
                checked={shippingMethod === "express"}
                onChange={() => setShippingMethod("express")}
                className={styles["web-chk__radio-input"]}
                aria-label={fa ? "ارسال اختصاصی یا پیشتاز" : "Express Freight"}
              />
              <div className={styles["web-chk__radio-content"]}>
                <div className={styles["web-chk__radio-header"]}>
                  <span className={styles["web-chk__radio-title"]}>
                    {fa ? "ارسال اختصاصی / پیشتاز" : "Express Freight"}
                  </span>
                  <span className={styles["web-chk__radio-cost"]}>
                    {formatPrice(250000, locale)}
                  </span>
                </div>
                <p className={styles["web-chk__radio-desc"]}>
                  {fa
                    ? "تخلیه بار مستقیم با اولویت بالا ظرف مدت ۲۴ الی ۴۸ ساعت کاری."
                    : "Priority express transport within 24 to 48 hours."}
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Section 3: Payment Method */}
        <Card variant="outlined" className={styles["web-chk__card"]}>
          <h2 className={styles["web-chk__section-heading"]}>
            {fa ? "۳. شیوه پرداخت" : "3. Payment Method"}
          </h2>

          <div className={styles["web-chk__radio-group"]}>
            <label
              className={[
                styles["web-chk__radio-option"],
                paymentMethod === "online" ? styles["web-chk__radio-option--selected"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="paymentOption"
                value="online"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
                className={styles["web-chk__radio-input"]}
                aria-label={fa ? "پرداخت آنلاین درگاه شتاب" : "Online Payment (Shetab)"}
              />
              <div className={styles["web-chk__radio-content"]}>
                <div className={styles["web-chk__radio-header"]}>
                  <span className={styles["web-chk__radio-title"]}>
                    {fa ? "پرداخت آنلاین (درگاه شتاب)" : "Online Payment (Shetab)"}
                  </span>
                </div>
                <p className={styles["web-chk__radio-desc"]}>
                  {fa
                    ? "پرداخت امن با تمامی کارت‌های عضو شبکه شتاب با رمز دوم پویا."
                    : "Secure online payment with debit/credit cards."}
                </p>
              </div>
            </label>

            <label
              className={[
                styles["web-chk__radio-option"],
                paymentMethod === "transfer" ? styles["web-chk__radio-option--selected"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="paymentOption"
                value="transfer"
                checked={paymentMethod === "transfer"}
                onChange={() => setPaymentMethod("transfer")}
                className={styles["web-chk__radio-input"]}
                aria-label={fa ? "واریز مستقیم به حساب یا حواله بانکی" : "Direct Bank Transfer"}
              />
              <div className={styles["web-chk__radio-content"]}>
                <div className={styles["web-chk__radio-header"]}>
                  <span className={styles["web-chk__radio-title"]}>
                    {fa ? "واریز مستقیم به حساب / حواله بانکی" : "Direct Bank Transfer"}
                  </span>
                </div>
                <p className={styles["web-chk__radio-desc"]}>
                  {fa
                    ? "واریز به شماره حساب شرکت تیراژه و ثبت شماره پیگیری پس از ثبت سفارش."
                    : "Transfer to company account and submit reference number."}
                </p>
              </div>
            </label>

            <label
              className={[
                styles["web-chk__radio-option"],
                paymentMethod === "credit" ? styles["web-chk__radio-option--selected"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="paymentOption"
                value="credit"
                checked={paymentMethod === "credit"}
                onChange={() => setPaymentMethod("credit")}
                className={styles["web-chk__radio-input"]}
                aria-label={fa ? "پرداخت اعتباری ویژه پیمانکاران طرف قرارداد" : "Credit / On Delivery"}
              />
              <div className={styles["web-chk__radio-content"]}>
                <div className={styles["web-chk__radio-header"]}>
                  <span className={styles["web-chk__radio-title"]}>
                    {fa ? "پرداخت اعتباری (ویژه پیمانکاران طرف قرارداد)" : "Credit / On Delivery"}
                  </span>
                </div>
                <p className={styles["web-chk__radio-desc"]}>
                  {fa
                    ? "ویژه پروژه‌ها و شرکت‌های طرف قرارداد دارای اعتبار سازمانی تأیید شده."
                    : "Available for contracted construction projects and corporate partners."}
                </p>
              </div>
            </label>
          </div>
        </Card>
      </div>

      {/* Aside: Sticky Order Summary */}
      <aside className={styles["web-chk__summary"]}>
        <h2 className={styles["web-chk__summary-title"]}>
          {fa ? "خلاصه سفارش" : "Order Summary"}
        </h2>

        <div className={styles["web-chk__summary-items-box"]}>
          {items.map((item) => {
            const name = fa
              ? item.product.nameFa
              : item.product.nameEn ?? item.product.nameFa
            return (
              <div key={item.id} className={styles["web-chk__summary-item"]}>
                <span className={styles["web-chk__summary-item-name"]}>
                  {name}
                  <span className={styles["web-chk__summary-item-qty"]}>
                    × {fa ? item.quantity.toLocaleString("fa-IR") : item.quantity}
                  </span>
                </span>
                <span className={styles["web-chk__summary-val"]}>
                  {formatPrice(Number(item.product.price) * item.quantity, locale)}
                </span>
              </div>
            )
          })}
        </div>

        <div className={styles["web-chk__summary-row"]}>
          <span>{fa ? "جمع اقلام" : "Subtotal"}</span>
          <span className={styles["web-chk__summary-val"]}>
            {formatPrice(subtotal, locale)}
          </span>
        </div>

        <div className={styles["web-chk__summary-row"]}>
          <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
          <span className={styles["web-chk__summary-val"]}>
            {shippingCost === 0 ? (fa ? "رایگان" : "Free") : formatPrice(shippingCost, locale)}
          </span>
        </div>

        <div className={styles["web-chk__summary-total"]}>
          <span>{fa ? "مبلغ نهایی سفارش" : "Total Amount"}</span>
          <span className={styles["web-chk__summary-total-val"]}>
            {formatPrice(totalAmount, locale)}
          </span>
        </div>

        <Button
          type="submit"
          variant="success"
          size="lg"
          disabled={isPending}
          className={styles["web-chk__submit-btn"]}
        >
          {isPending
            ? fa
              ? "در حال ثبت سفارش..."
              : "Processing..."
            : fa
            ? "تأیید و ثبت سفارش نهایی"
            : "Place Order"}
        </Button>

        <Link href={`/${locale}/cart`} className={styles["web-chk__back-link"]}>
          {fa ? "بازگشت به سبد خرید" : "Return to Cart"}
        </Link>
      </aside>
    </form>
  )
}
