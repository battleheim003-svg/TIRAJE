"use server"

import { db } from "@tirajeh/database"
import { CreateProductSchema, UpdateProductSchema } from "@tirajeh/shared"
import { safeAction, parseOrThrow, NotFoundError, ConflictError } from "@tirajeh/shared"
import { requirePerm } from "@tirajeh/auth"
import { PERMISSIONS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "./_audit"

export const createProductAction = safeAction(
  "admin:createProduct",
  async (formData: FormData): Promise<ActionResult<{ id: string }>> => {
    const session = await requirePerm(PERMISSIONS.PRODUCT_CREATE)
    const data = parseOrThrow(CreateProductSchema, Object.fromEntries(formData))

    const existing = await db.product.findUnique({ where: { slug: data.slug } })
    if (existing) throw new ConflictError("این slug قبلاً استفاده شده")

    const product = await db.product.create({
      data: {
        ...data,
        brandId: data.brandId || null,
        factoryId: data.factoryId || null,
      },
      select: { id: true },
    })

    await writeAuditLog({
      userId: session.user.id,
      action: "create",
      resource: "product",
      resourceId: product.id,
      newValues: data,
    })

    revalidatePath("/products")
    return { success: true, data: { id: product.id } }
  }
)

export const updateProductAction = safeAction(
  "admin:updateProduct",
  async (productId: string, formData: FormData): Promise<ActionResult> => {
    const session = await requirePerm(PERMISSIONS.PRODUCT_UPDATE)
    const data = parseOrThrow(UpdateProductSchema, Object.fromEntries(formData))

    const existing = await db.product.findUnique({ where: { id: productId } })
    if (!existing) throw new NotFoundError("محصول")

    const { priceChangeReason, ...updateData } = data

    if (
      updateData.pricePerTon !== undefined &&
      Number(updateData.pricePerTon) !== Number(existing.pricePerTon)
    ) {
      await db.productPriceHistory.create({
        data: {
          productId,
          oldPrice: existing.pricePerTon,
          newPrice: updateData.pricePerTon,
          changedBy: session.user.id,
          reason: priceChangeReason ?? null,
        },
      })
    }

    await db.product.update({ where: { id: productId }, data: updateData })

    await writeAuditLog({
      userId: session.user.id,
      action: "update",
      resource: "product",
      resourceId: productId,
      oldValues: { pricePerTon: String(existing.pricePerTon) },
      newValues: updateData as Record<string, unknown>,
    })

    revalidatePath(`/products/${productId}`)
    revalidatePath("/products")
    return { success: true, data: undefined }
  }
)

export const deleteProductAction = safeAction(
  "admin:deleteProduct",
  async (productId: string): Promise<ActionResult> => {
    const session = await requirePerm(PERMISSIONS.PRODUCT_DELETE)

    const existing = await db.product.findUnique({ where: { id: productId } })
    if (!existing) throw new NotFoundError("محصول")

    // Soft delete — preserves order_items foreign keys
    await db.product.update({ where: { id: productId }, data: { isActive: false } })

    await writeAuditLog({
      userId: session.user.id,
      action: "delete",
      resource: "product",
      resourceId: productId,
      oldValues: { name: existing.name },
    })

    revalidatePath("/products")
    return { success: true, data: undefined }
  }
)
