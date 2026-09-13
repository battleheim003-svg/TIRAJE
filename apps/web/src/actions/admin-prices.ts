"use server"

import { db, Prisma } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS, TomanSchema, IdSchema } from "@tirajeh/shared"
import { parseAction } from "@/lib/parse-action"
import { audit } from "@/lib/audit"
import { z } from "zod"

// ─── Inline Price Update ───────────────────────────────────────────────────

export const InlinePriceUpdateSchema = z.object({
  productId: IdSchema,
  newPrice: TomanSchema,
})

export type InlinePriceUpdateInput = z.infer<typeof InlinePriceUpdateSchema>

export async function adminInlinePriceUpdateAction(input: unknown) {
  const admin = await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)

  const parsed = parseAction(InlinePriceUpdateSchema, input)
  if ("error" in parsed) {
    return parsed.error
  }

  const { productId, newPrice } = parsed.data

  const product = await db.product.findUnique({
    where: { id: productId, archivedAt: null },
    select: { id: true, nameFa: true, price: true },
  })

  if (!product) {
    return { success: false, error: "محصول یافت نشد یا آرشیو شده است." }
  }

  const oldPrice = Number(product.price)

  // If price hasn't changed, return immediately as a no-op
  if (oldPrice === newPrice) {
    return { success: true, data: { newPrice, oldPrice } }
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        price: newPrice,
        lastPriceUpdate: new Date(),
      },
    })

    await tx.productPriceHistory.create({
      data: {
        productId,
        oldPrice: new Prisma.Decimal(oldPrice),
        newPrice: new Prisma.Decimal(newPrice),
        changedBy: admin.id,
        reason: "ویرایش درجا از جدول محصولات",
      },
    })
  })

  await audit({
    userId: admin.id,
    action: "price.inline_update",
    resource: "Product",
    resourceId: productId,
    before: { price: oldPrice },
    after: { price: newPrice },
  })

  revalidatePath("/admin/products")
  revalidatePath("/admin/daily-price")

  return { success: true, data: { newPrice, oldPrice } }
}

// ─── Bulk Price Adjustment ─────────────────────────────────────────────────

export const BulkAdjustFilterSchema = z
  .object({
    brandId: z.string().uuid("شناسه برند نامعتبر است").optional().nullable().transform((v) => v?.trim() || null),
    categoryId: z.string().uuid("شناسه دسته‌بندی نامعتبر است").optional().nullable().transform((v) => v?.trim() || null),
    percent: z.coerce
      .number({ invalid_type_error: "درصد تغییر باید عدد باشد" })
      .min(-50, "درصد کاهش نمی‌تواند بیشتر از ۵۰٪ باشد")
      .max(200, "درصد افزایش نمی‌تواند بیشتر از ۲۰۰٪ باشد"),
    reason: z
      .string({ required_error: "دلیل تغییر قیمت الزامی است" })
      .min(3, "دلیل تغییر قیمت باید حداقل ۳ کاراکتر باشد")
      .max(500, "دلیل تغییر قیمت نمی‌تواند بیش از ۵۰۰ کاراکتر باشد")
      .transform((v) => v.trim()),
  })
  .refine((data) => Boolean(data.brandId || data.categoryId), {
    message: "حداقل انتخاب یکی از فیلترهای برند یا دسته‌بندی الزامی است.",
    path: ["brandId"],
  })

export type BulkAdjustFilterInput = z.infer<typeof BulkAdjustFilterSchema>

export interface BulkPreviewItem {
  id: string
  nameFa: string
  brandNameFa: string
  oldPrice: number
  newPrice: number
  diff: number
}

export async function adminBulkAdjustPreviewAction(input: unknown) {
  await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)

  const parsed = parseAction(BulkAdjustFilterSchema, input)
  if ("error" in parsed) {
    return parsed.error
  }

  const { brandId, categoryId, percent } = parsed.data

  const where: Prisma.ProductWhereInput = {
    archivedAt: null,
    isActive: true,
  }

  if (brandId) {
    where.brandId = brandId
  }

  if (categoryId) {
    where.productCategories = {
      some: { categoryId },
    }
  }

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      nameFa: true,
      price: true,
      brand: {
        select: { nameFa: true },
      },
    },
    orderBy: [{ brand: { nameFa: "asc" } }, { nameFa: "asc" }],
  })

  const previewItems: BulkPreviewItem[] = products.map((p) => {
    const oldPrice = Number(p.price)
    const newPrice = Math.max(0, Math.round(oldPrice * (1 + percent / 100)))
    const diff = newPrice - oldPrice
    return {
      id: p.id,
      nameFa: p.nameFa,
      brandNameFa: p.brand?.nameFa ?? "—",
      oldPrice,
      newPrice,
      diff,
    }
  })

  return {
    success: true,
    data: {
      count: previewItems.length,
      percent,
      items: previewItems,
    },
  }
}

export async function adminBulkAdjustConfirmAction(input: unknown) {
  const admin = await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)

  const parsed = parseAction(BulkAdjustFilterSchema, input)
  if ("error" in parsed) {
    return parsed.error
  }

  const { brandId, categoryId, percent, reason } = parsed.data

  const where: Prisma.ProductWhereInput = {
    archivedAt: null,
    isActive: true,
  }

  if (brandId) {
    where.brandId = brandId
  }

  if (categoryId) {
    where.productCategories = {
      some: { categoryId },
    }
  }

  const updatedCount = await db.$transaction(async (tx) => {
    // Re-fetch current state inside the transaction to avoid race conditions
    const products = await tx.product.findMany({
      where,
      select: {
        id: true,
        price: true,
      },
    })

    if (products.length === 0) {
      return 0
    }

    const now = new Date()

    for (const prod of products) {
      const oldPrice = Number(prod.price)
      const newPrice = Math.max(0, Math.round(oldPrice * (1 + percent / 100)))

      if (oldPrice !== newPrice) {
        await tx.product.update({
          where: { id: prod.id },
          data: {
            price: newPrice,
            lastPriceUpdate: now,
          },
        })

        await tx.productPriceHistory.create({
          data: {
            productId: prod.id,
            oldPrice: new Prisma.Decimal(oldPrice),
            newPrice: new Prisma.Decimal(newPrice),
            changedBy: admin.id,
            reason: `تغییر گروهی (${percent > 0 ? "+" : ""}${percent}%): ${reason}`,
            createdAt: now,
          },
        })
      }
    }

    return products.length
  })

  await audit({
    userId: admin.id,
    action: "price.bulk_adjust",
    resource: "Product",
    before: { brandId, categoryId, percent },
    after: { updatedCount, reason },
  })

  revalidatePath("/admin/products")
  revalidatePath("/admin/daily-price")
  revalidatePath("/admin/prices/bulk")

  return {
    success: true,
    data: { updatedCount },
  }
}
