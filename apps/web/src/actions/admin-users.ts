"use server"

import { db, CustomerType } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"
import { parseAction } from "@/lib/parse-action"
import { z } from "zod"

export type UserActionResult =
  | { ok: true; success: true }
  | { ok?: false; success: false; error: string }

const UserIdSchema = z.string().min(1, "شناسه کاربر الزامی است")

export async function adminToggleUserStatusAction(
  userId: string,
  isActive: boolean
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  const parsedId = UserIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? "شناسه کاربر الزامی است" }
  }
  const validUserId = parsedId.data

  if (validUserId === user.id) {
    return { success: false, error: "نمیتوانید حساب خود را غیرفعال کنید" }
  }

  await db.user.update({
    where: { id: validUserId },
    data: {
      isActive,
      tokenVersion: { increment: 1 },
    },
  })

  await audit({
    userId: user.id,
    action: "user.status_changed",
    resource: "User",
    resourceId: userId,
    after: { isActive },
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}

export async function adminDeleteUserAction(
  userId: string
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  const parsedId = UserIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? "شناسه کاربر الزامی است" }
  }
  const validUserId = parsedId.data

  if (validUserId === user.id) {
    return { success: false, error: "نمیتوانید حساب خود را حذف کنید" }
  }

  const superAdminCount = await db.user.count({
    where: { role: { name: "super_admin" }, isActive: true },
  })
  if (superAdminCount <= 1) {
    const target = await db.user.findUnique({
      where: { id: validUserId },
      include: { role: true },
    })
    if (target?.role?.name === "super_admin") {
      return { success: false, error: "آخرین مدیر ارشد سیستم را نمیتوان حذف کرد" }
    }
  }

  await db.user.update({
    where: { id: validUserId },
    data: {
      archivedAt: new Date(),
      isActive: false,
      tokenVersion: { increment: 1 },
    },
  })

  await audit({
    userId: user.id,
    action: "user.archive",
    resource: "User",
    resourceId: validUserId,
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}

export async function adminRestoreUserAction(
  userId: string
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  const parsedId = UserIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? "شناسه کاربر الزامی است" }
  }
  const validUserId = parsedId.data

  await db.user.update({
    where: { id: validUserId },
    data: { archivedAt: null, isActive: true },
  })

  await audit({
    userId: user.id,
    action: "user.restore",
    resource: "User",
    resourceId: validUserId,
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}

// ─── T2.10 Customer 360 Profile Actions ─────────────────────────────────────

export interface UserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  customerType: string
  createdAt: string
  telegramUserId: string | null
  telegramChatId: string | null
  customerProfile: {
    companyName: string | null
    nationalId: string | null
    economicCode: string | null
    address: string | null
    postalCode: string | null
  } | null
  _stats: {
    totalPurchaseToman: number
    orderCount: number
    quoteCount: number
    contactCount: number
  }
}

export async function getUserProfileAction(
  userId: string
): Promise<{ ok: true; success: true; data: UserProfile } | { ok: false; success: false; error: string }> {
  await requireAdminPerm(PERMISSIONS.USERS_READ)

  const parsedId = z.string().uuid().safeParse(userId)
  if (!parsedId.success) {
    return { ok: false, success: false, error: "شناسه کاربر نامعتبر است" }
  }

  const user = await db.user.findUnique({
    where: { id: parsedId.data },
    include: {
      customerProfile: true,
    },
  })

  if (!user) {
    return { ok: false, success: false, error: "کاربر یافت نشد" }
  }

  const [ordersSummary, quoteCount, contactCount] = await Promise.all([
    db.order.findMany({
      where: {
        userId: user.id,
        status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
      },
      select: { totalAmount: true },
    }),
    db.quoteRequest.count({
      where: { userId: user.id },
    }),
    db.contact.count({
      where: {
        OR: [
          user.email ? { email: user.email } : undefined,
          user.phone ? { phone: user.phone } : undefined,
        ].filter(Boolean) as Array<{ email?: string; phone?: string }>,
      },
    }),
  ])

  const totalPurchaseToman = ordersSummary.reduce(
    (sum, ord) => sum + Number(ord.totalAmount),
    0
  )

  const allOrderCount = await db.order.count({
    where: { userId: user.id },
  })

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    customerType: user.customerType,
    createdAt: user.createdAt.toISOString(),
    telegramUserId: null,
    telegramChatId: null,
    customerProfile: user.customerProfile
      ? {
          companyName: user.customerProfile.companyName,
          nationalId: user.customerProfile.nationalId,
          economicCode: user.customerProfile.economicCode,
          address: user.customerProfile.address,
          postalCode: user.customerProfile.postalCode,
        }
      : null,
    _stats: {
      totalPurchaseToman,
      orderCount: allOrderCount,
      quoteCount,
      contactCount,
    },
  }

  return { ok: true, success: true, data: profile }
}

const ChangeCustomerTypeSchema = z.object({
  userId: z.string().uuid("شناسه کاربر نامعتبر است"),
  customerType: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: "نوع مشتری نامعتبر است" }),
  }),
})

export async function changeCustomerTypeAction(
  input: unknown
): Promise<{ ok: true; success: true } | { ok: false; success: false; error: string }> {
  const sessionUser = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)

  const parsed = parseAction(ChangeCustomerTypeSchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { userId, customerType } = parsed.data

  if (userId === sessionUser.id) {
    return {
      ok: false,
      success: false,
      error: "نمیتوانید نوع مشتری خود را تغییر دهید",
    }
  }

  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, customerType: true },
  })

  if (!existingUser) {
    return { ok: false, success: false, error: "کاربر یافت نشد" }
  }

  const oldType = existingUser.customerType

  await db.user.update({
    where: { id: userId },
    data: { customerType },
  })

  await audit({
    userId: sessionUser.id,
    action: "user.change_customer_type",
    resource: "User",
    resourceId: userId,
    before: { customerType: oldType },
    after: { customerType },
  })

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath("/admin/users")

  return { ok: true, success: true }
}

const UserPaginationSchema = z.object({
  userId: z.string().uuid("شناسه کاربر نامعتبر است"),
  page: z.coerce.number().int().positive().default(1),
})

export async function getUserOrdersAction(input: unknown) {
  await requireAdminPerm(PERMISSIONS.ORDERS_READ)

  const parsed = parseAction(UserPaginationSchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { userId, page } = parsed.data
  const pageSize = 10
  const skip = (page - 1) * pageSize

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.order.count({ where: { userId } }),
  ])

  return {
    ok: true,
    success: true,
    data: {
      items: orders.map((o) => ({
        id: o.id,
        orderNumber: String(o.orderNumber),
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt.toISOString(),
      })),
      total,
    },
  }
}

export async function getUserQuotesAction(input: unknown) {
  await requireAdminPerm(PERMISSIONS.QUOTES_UPDATE)

  const parsed = parseAction(UserPaginationSchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { userId, page } = parsed.data
  const pageSize = 10
  const skip = (page - 1) * pageSize

  const [quotes, total] = await Promise.all([
    db.quoteRequest.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        product: { select: { nameFa: true } },
        quantityTon: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.quoteRequest.count({ where: { userId } }),
  ])

  return {
    ok: true,
    success: true,
    data: {
      items: quotes.map((q) => ({
        id: q.id,
        status: q.status,
        productName: q.product?.nameFa ?? "استعلام کالا",
        quantityTon: Number(q.quantityTon),
        createdAt: q.createdAt.toISOString(),
      })),
      total,
    },
  }
}

export async function getUserContactsAction(input: unknown) {
  await requireAdminPerm(PERMISSIONS.TICKETS_REPLY)

  const parsed = parseAction(UserPaginationSchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { userId, page } = parsed.data
  const pageSize = 10
  const skip = (page - 1) * pageSize

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true },
  })

  if (!targetUser) {
    return { ok: true, success: true, data: { items: [], total: 0 } }
  }

  const orConditions = [
    targetUser.email ? { email: targetUser.email } : undefined,
    targetUser.phone ? { phone: targetUser.phone } : undefined,
  ].filter(Boolean) as Array<{ email?: string; phone?: string }>

  if (orConditions.length === 0) {
    return { ok: true, success: true, data: { items: [], total: 0 } }
  }

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where: { OR: orConditions },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.contact.count({ where: { OR: orConditions } }),
  ])

  return {
    ok: true,
    success: true,
    data: {
      items: contacts.map((c) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
    },
  }
}

