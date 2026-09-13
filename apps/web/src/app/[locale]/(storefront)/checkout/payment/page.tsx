import { redirect } from "next/navigation"

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const resolvedParams = await searchParams;
  const url = resolvedParams.url
  if (!url) redirect("/cart")
  redirect(decodeURIComponent(url))
}
