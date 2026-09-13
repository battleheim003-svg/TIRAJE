import type { Metadata } from "next"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { TelegramCenter } from "./TelegramCenter"

export const metadata: Metadata = {
  title: "مرکز انتشار تلگرام | پنل مدیریت تیراژه",
}

export default async function AdminTelegramPage() {
  await requireAdminPerm(PERMISSIONS.TELEGRAM_MANAGE)
  return <TelegramCenter />
}
