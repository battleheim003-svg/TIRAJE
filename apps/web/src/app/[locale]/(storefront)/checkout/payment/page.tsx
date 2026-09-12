import { redirect } from "next/navigation"

export default function PaymentPage({
  searchParams,
}: {
  searchParams: { url?: string }
}) {
  const url = searchParams.url
  if (!url) redirect("/cart")
  redirect(decodeURIComponent(url))
}
