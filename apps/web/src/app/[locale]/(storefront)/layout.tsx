import { SessionProvider } from "next-auth/react"
import { auth } from "@tirajeh/auth"
import { StorefrontLayout } from "@/components/layout/storefront-layout"

export default async function StorefrontRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <StorefrontLayout>{children}</StorefrontLayout>
    </SessionProvider>
  )
}
