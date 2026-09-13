"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"
import { z } from "zod"

const CreateFactorySchema = z.object({
  nameFa: z.string().min(1, "نام فارسی کارخانه الزامی است").transform((s) => s.trim()),
  nameEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  city: z.string().min(1, "شهر الزامی است").transform((s) => s.trim()),
  province: z.string().min(1, "استان الزامی است").transform((s) => s.trim()),
  latitude: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null
    const num = Number(v)
    return isNaN(num) ? null : num
  }, z.number().nullable().optional()),
  longitude: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null
    const num = Number(v)
    return isNaN(num) ? null : num
  }, z.number().nullable().optional()),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(true),
})

const UpdateFactorySchema = CreateFactorySchema.extend({
  factoryId: z.string().min(1, "شناسه کارخانه الزامی است").transform((s) => s.trim()),
})

const FactoryIdSchema = z.object({
  factoryId: z.string().min(1, "شناسه کارخانه الزامی است").transform((s) => s.trim()),
})

export async function adminCreateFactoryAction(
  formData: FormData
): Promise<{ factoryId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.FACTORIES_MANAGE)

  const parsed = CreateFactorySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی کارخانه نامعتبر است")
  }

  const { nameFa, nameEn, city, province, latitude, longitude, isActive } = parsed.data

  const factory = await db.factory.create({
    data: {
      nameFa,
      nameEn,
      city,
      province,
      latitude,
      longitude,
      isActive,
    },
    select: { id: true },
  })

  await audit({
    userId: user.id,
    action: "factory.create",
    resource: "Factory",
    resourceId: factory.id,
    after: { nameFa, province, city, isActive },
  })

  revalidatePath("/admin/factories")
  return { factoryId: factory.id }
}

export async function adminUpdateFactoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.FACTORIES_MANAGE)

  const parsed = UpdateFactorySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی کارخانه نامعتبر است")
  }

  const { factoryId, nameFa, nameEn, city, province, latitude, longitude, isActive } = parsed.data

  await db.factory.update({
    where: { id: factoryId },
    data: {
      nameFa,
      nameEn,
      city,
      province,
      latitude,
      longitude,
      isActive,
    },
  })

  await audit({
    userId: user.id,
    action: "factory.update",
    resource: "Factory",
    resourceId: factoryId,
    after: { nameFa, province, city, isActive },
  })

  revalidatePath("/admin/factories")
  return { ok: true }
}

export async function adminToggleFactoryStatusAction(
  factoryId: string,
  isActive: boolean
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.FACTORIES_MANAGE)
  if (!factoryId) throw new Error("شناسه کارخانه الزامی است")

  await db.factory.update({
    where: { id: factoryId },
    data: { isActive },
  })

  await audit({
    userId: user.id,
    action: "factory.toggle_status",
    resource: "Factory",
    resourceId: factoryId,
    after: { isActive },
  })

  revalidatePath("/admin/factories")
  return { ok: true }
}

export async function adminDeleteFactoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.FACTORIES_MANAGE)

  const parsed = FactoryIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه کارخانه نامعتبر است")
  }

  const { factoryId } = parsed.data

  const [productCount, rateCount] = await Promise.all([
    db.product.count({ where: { factoryId } }),
    db.shippingRate.count({ where: { factoryId } }),
  ])

  if (productCount > 0 || rateCount > 0) {
    throw new Error(
      `امکان حذف کارخانه وجود ندارد. این کارخانه به ${productCount} محصول و ${rateCount} نرخ حمل متصل است. می‌توانید آن را غیرفعال کنید.`
    )
  }

  await db.factory.delete({
    where: { id: factoryId },
  })

  await audit({
    userId: user.id,
    action: "factory.delete",
    resource: "Factory",
    resourceId: factoryId,
  })

  revalidatePath("/admin/factories")
  return { ok: true }
}
