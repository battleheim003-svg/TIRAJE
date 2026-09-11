"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { publishDailyPrice } from "@tirajeh/integrations"
import { revalidatePath } from "next/cache"

const ADMIN_ROLES = ["admin", "super_admin"]

async function requireAdmin() {
  const session = await auth()
  const roleName = (session?.user as any)?.roleName as string | undefined
  if (!session?.user || !roleName || !ADMIN_ROLES.includes(roleName)) {
    throw new Error("Unauthorized")
  }
  return session.user as { id: string; name?: string | null; roleName?: string }
}

/** Fetch all active products for the price form */
export async function getProductsForPricingAction() {
  await requireAdmin()

  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameFa: true,
      nameEn: true,
      price: true,
      lastPriceUpdate: true,
      packagingType: true,
      cementType: true,
      brand: { select: { nameFa: true } },
    },
    orderBy: [{ brandId: "asc" }, { nameFa: "asc" }],
  })
  return products
}

/** Get the current active bulletin */
export async function getActiveBulletinAction() {
  await requireAdmin()

  return db.dailyPriceBulletin.findFirst({
    where: { isActive: true },
    orderBy: { date: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: { select: { id: true, nameFa: true, slug: true, packagingType: true } },
        },
      },
      publisher: { select: { name: true } },
    },
  })
}

/** Submit daily prices */
export async function submitDailyPriceAction(data: {
  items: Array<{ productId: string; price: number }>
  sendToTelegram?: boolean
}) {
  const admin = await requireAdmin()

  if (!data.items || data.items.length === 0) {
    return { success: false, error: "حداقل یک محصول باید برای اعلام قیمت انتخاب شود" }
  }

  try {
    const result = await publishDailyPrice({
      items: data.items,
      source: "ADMIN_PANEL",
      publishedBy: admin.id,
    })

    revalidatePath("/", "layout")
    revalidatePath("/[locale]/admin/daily-price", "page")

    return {
      success: true,
      bulletinId: result.bulletinId,
      telegramSent: result.telegramSent,
      telegramError: result.error,
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "خطای ناشناخته در ثبت قیمت‌ها" }
  }
}
