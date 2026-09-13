"use server"

import { db } from "@tirajeh/database"
import { publishDailyPrice } from "@tirajeh/integrations"
import { revalidatePath } from "next/cache"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

/** Fetch all active products for the price form */
export async function getProductsForPricingAction() {
  await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)

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
  await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)

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
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)

  if (!data.items || data.items.length === 0) {
    return { success: false, error: "حداقل یک محصول باید برای اعلام قیمت انتخاب شود" }
  }

  try {
    const result = await publishDailyPrice({
      items: data.items,
      source: "ADMIN_PANEL",
      publishedBy: user.id,
    })

    await audit({
      userId: user.id,
      action: "price.publish",
      resource: "DailyPriceBulletin",
      resourceId: result.bulletinId,
    })

    revalidatePath("/", "layout")
    revalidatePath("/[locale]/admin/daily-price", "page")

    return {
      success: true,
      bulletinId: result.bulletinId,
      telegramSent: result.telegramSent,
      telegramError: result.error,
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "خطای ناشناخته در ثبت قیمت‌ها"
    return { success: false, error }
  }
}
