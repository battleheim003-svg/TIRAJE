import React from "react"
import { notFound } from "next/navigation"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { getUserProfileAction } from "@/actions/admin-users"
import { UserProfile360 } from "./UserProfile360"

interface PageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function AdminUserProfilePage({ params }: PageProps) {
  await requireAdminPerm(PERMISSIONS.USERS_READ)

  const { locale, id } = await params

  const res = await getUserProfileAction(id)
  if (!res.ok || !res.data) {
    notFound()
  }

  return (
    <UserProfile360
      initialProfile={res.data}
      userId={id}
      locale={locale}
    />
  )
}
