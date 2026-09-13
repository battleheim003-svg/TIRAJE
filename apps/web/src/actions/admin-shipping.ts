"use server"

import { db, TruckType } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"
import { z } from "zod"

// ─── Shipping Zone Schemas & Actions ─────────────────────────────────────────

const CreateShippingZoneSchema = z.object({
  nameFa: z.string().min(1, "نام فارسی الزامی است").transform((s) => s.trim()),
  nameEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  province: z.string().min(1, "استان الزامی است").transform((s) => s.trim()),
  cities: z.preprocess((v) => {
    if (Array.isArray(v)) return v
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return v.split(",").map((s) => s.trim()).filter(Boolean)
      }
    }
    return []
  }, z.array(z.string())),
})

const UpdateShippingZoneSchema = CreateShippingZoneSchema.extend({
  zoneId: z.string().min(1, "شناسه منطقه الزامی است").transform((s) => s.trim()),
})

const ShippingZoneIdSchema = z.object({
  zoneId: z.string().min(1, "شناسه منطقه الزامی است").transform((s) => s.trim()),
})

export async function adminCreateShippingZoneAction(
  formData: FormData
): Promise<{ zoneId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)

  const parsed = CreateShippingZoneSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی منطقه نامعتبر است")
  }

  const { nameFa, nameEn, province, cities } = parsed.data

  const zone = await db.shippingZone.create({
    data: {
      nameFa,
      nameEn,
      province,
      cities,
    },
    select: { id: true },
  })

  await audit({
    userId: user.id,
    action: "shipping_zone.create",
    resource: "ShippingZone",
    resourceId: zone.id,
    after: { nameFa, province, citiesCount: cities.length },
  })

  revalidatePath("/admin/shipping")
  return { zoneId: zone.id }
}

export async function adminUpdateShippingZoneAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)

  const parsed = UpdateShippingZoneSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی منطقه نامعتبر است")
  }

  const { zoneId, nameFa, nameEn, province, cities } = parsed.data

  await db.shippingZone.update({
    where: { id: zoneId },
    data: {
      nameFa,
      nameEn,
      province,
      cities,
    },
  })

  await audit({
    userId: user.id,
    action: "shipping_zone.update",
    resource: "ShippingZone",
    resourceId: zoneId,
    after: { nameFa, province, citiesCount: cities.length },
  })

  revalidatePath("/admin/shipping")
  return { ok: true }
}

export async function adminDeleteShippingZoneAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)

  const parsed = ShippingZoneIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه منطقه نامعتبر است")
  }

  const { zoneId } = parsed.data

  // Guard: delete only allowed if no orders are linked to this zone
  const orderCount = await db.order.count({
    where: { shippingZoneId: zoneId },
  })

  if (orderCount > 0) {
    throw new Error(
      `امکان حذف این منطقه وجود ندارد چون در ${orderCount} سفارش ثبت شده است.`
    )
  }

  // Delete all associated rates first, then the zone
  await db.$transaction(async (tx) => {
    await tx.shippingRate.deleteMany({ where: { zoneId } })
    await tx.shippingZone.delete({ where: { id: zoneId } })
  })

  await audit({
    userId: user.id,
    action: "shipping_zone.delete",
    resource: "ShippingZone",
    resourceId: zoneId,
  })

  revalidatePath("/admin/shipping")
  return { ok: true }
}

// ─── Shipping Rate Schemas & Actions ─────────────────────────────────────────

const CreateShippingRateSchema = z.object({
  zoneId: z.string().min(1, "شناسه منطقه الزامی است").transform((s) => s.trim()),
  factoryId: z.string().min(1, "انتخاب کارخانه مبدا الزامی است").transform((s) => s.trim()),
  truckType: z.nativeEnum(TruckType, {
    errorMap: () => ({ message: "نوع وسیله نقلیه الزامی است" }),
  }),
  baseCost: z.coerce.number().int().nonnegative("هزینه پایه باید یک عدد نامنفی باشد"),
  costPerTon: z.coerce.number().int().nonnegative("هزینه بر اساس هر تن باید یک عدد نامنفی باشد"),
  estimatedDays: z.coerce.number().int().min(1, "تعداد روز تخمینی حداقل ۱ است").default(1),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(true),
})

const UpdateShippingRateSchema = CreateShippingRateSchema.extend({
  rateId: z.string().min(1, "شناسه نرخ حمل الزامی است").transform((s) => s.trim()),
})

const ShippingRateIdSchema = z.object({
  rateId: z.string().min(1, "شناسه نرخ حمل الزامی است").transform((s) => s.trim()),
})

export async function adminCreateShippingRateAction(
  formData: FormData
): Promise<{ rateId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)

  const parsed = CreateShippingRateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نرخ حمل نامعتبر است")
  }

  const { zoneId, factoryId, truckType, baseCost, costPerTon, estimatedDays, isActive } = parsed.data

  try {
    const rate = await db.shippingRate.create({
      data: {
        zoneId,
        factoryId,
        truckType,
        baseCost,
        costPerTon,
        estimatedDays,
        isActive,
      },
      select: { id: true },
    })

    await audit({
      userId: user.id,
      action: "shipping_rate.create",
      resource: "ShippingRate",
      resourceId: rate.id,
      after: { zoneId, factoryId, truckType, baseCost, costPerTon },
    })

    revalidatePath("/admin/shipping")
    return { rateId: rate.id }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      throw new Error("برای این کارخانه، منطقه و نوع کامیون قبلاً نرخ ثبت شده است")
    }
    throw err
  }
}

export async function adminUpdateShippingRateAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)

  const parsed = UpdateShippingRateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نرخ حمل نامعتبر است")
  }

  const { rateId, zoneId, factoryId, truckType, baseCost, costPerTon, estimatedDays, isActive } = parsed.data

  try {
    await db.shippingRate.update({
      where: { id: rateId },
      data: {
        zoneId,
        factoryId,
        truckType,
        baseCost,
        costPerTon,
        estimatedDays,
        isActive,
      },
    })

    await audit({
      userId: user.id,
      action: "shipping_rate.update",
      resource: "ShippingRate",
      resourceId: rateId,
      after: { baseCost, costPerTon, estimatedDays, isActive },
    })

    revalidatePath("/admin/shipping")
    return { ok: true }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      throw new Error("برای این کارخانه، منطقه و نوع کامیون قبلاً نرخ دیگری ثبت شده است")
    }
    throw err
  }
}

export async function adminToggleShippingRateStatusAction(
  rateId: string,
  isActive: boolean
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)
  if (!rateId) throw new Error("شناسه نرخ حمل الزامی است")

  await db.shippingRate.update({
    where: { id: rateId },
    data: { isActive },
  })

  await audit({
    userId: user.id,
    action: "shipping_rate.toggle_status",
    resource: "ShippingRate",
    resourceId: rateId,
    after: { isActive },
  })

  revalidatePath("/admin/shipping")
  return { ok: true }
}

export async function adminDeleteShippingRateAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.SHIPPING_MANAGE)

  const parsed = ShippingRateIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه نرخ حمل نامعتبر است")
  }

  const { rateId } = parsed.data

  await db.shippingRate.delete({
    where: { id: rateId },
  })

  await audit({
    userId: user.id,
    action: "shipping_rate.delete",
    resource: "ShippingRate",
    resourceId: rateId,
  })

  revalidatePath("/admin/shipping")
  return { ok: true }
}
