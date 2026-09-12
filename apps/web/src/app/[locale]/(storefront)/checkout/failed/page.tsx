import Link from "next/link"
import { Button } from "@tirajeh/ui"
import { retryPaymentAction } from "@/actions/order"

export default function FailedPage({
  searchParams,
}: {
  searchParams: { order?: string }
}) {
  const orderId = searchParams.order

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 sm:px-6 lg:px-8 text-center space-y-6">
      <div className="rounded-full bg-red-100 p-3">
        <svg
          className="w-12 h-12 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">پرداخت ناموفق بود</h1>
      <p className="mt-2 text-lg text-gray-600 max-w-sm">
        متأسفانه پرداخت شما انجام نشد. در صورت کسر وجه، مبلغ طی ۷۲ ساعت آینده به حساب شما بازخواهد گشت.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
        {orderId && (
          <form action={async () => {
            "use server"
            await retryPaymentAction(orderId)
          }}>
            <Button variant="primary" type="submit">تلاش مجدد پرداخت</Button>
          </form>
        )}
        <Link href="/cart">
          <Button variant="secondary">بازگشت به سبد خرید</Button>
        </Link>
      </div>
    </div>
  )
}
