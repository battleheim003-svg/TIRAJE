"use server"

import { db, PackagingTier } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"
import { z } from "zod"
import { resolveUnitPriceToman } from "../lib/pricing"
import { AppError } from "@tirajeh/shared"

/** Returns session_id for guest cart — creates one if absent */
async function getSessionId(): Promise<string> {
  const store = await cookies()
  let sid = store.get("session_id")?.value
  if (!sid) {
    sid = randomUUID()
    store.set("session_id", sid, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 })
  }
  return sid
}

export interface CartLine {
  id: string
  productId: string
  productNameFa: string
  productNameEn: string | null
  slug: string
  imageUrl: string | null
  unitPriceToman: number
  comparePriceToman: number | null
  quantity: number
  stockQty: number
  minOrderQty: number
  packagingTier: PackagingTier | null
}

export interface CartSummary {
  items: CartLine[]
  totalCount: number
  subtotalToman: number
}

export async function getCartCountAction(): Promise<number> {
  const session = await auth()
  const userId = session?.user ? (session.user as any).id : undefined
  const cookieStore = await cookies()
  const sessionId = userId ? undefined : cookieStore.get("session_id")?.value

  if (!userId && !sessionId) return 0

  const result = await db.cartItem.aggregate({
    where: userId ? { userId } : { sessionId },
    _sum: { quantity: true },
  })

  return result._sum.quantity ?? 0
}

export async function getCartAction(): Promise<CartSummary> {
  const session = await auth()
  const userId = session?.user ? (session.user as any).id : undefined
  const cookieStore = await cookies()
  const sessionId = userId ? undefined : cookieStore.get("session_id")?.value

  if (!userId && !sessionId) {
    return { items: [], totalCount: 0, subtotalToman: 0 }
  }

  const items = await db.cartItem.findMany({
    where: userId ? { userId } : { sessionId },
    include: {
      product: {
        select: {
          id: true,
          nameFa: true,
          nameEn: true,
          slug: true,
          price: true,
          comparePrice: true,
          stockQty: true,
          minOrderQty: true,
          weightKg: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
          packagingOptions: {
            select: { tier: true, price: true, bagCount: true, isActive: true }
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  let totalCount = 0
  let subtotalToman = 0

  const lines: CartLine[] = items.map((item) => {
    let unitPriceToman = 0
    try {
      unitPriceToman = resolveUnitPriceToman(item.product, item.packagingTier)
    } catch (err) {
      if (err instanceof AppError) {
        console.error(`Pricing error for product ${item.productId}: ${err.message}`)
      }
      unitPriceToman = Number(item.product.price) // fallback, though shouldn't happen normally
    }
    
    const comparePriceToman = item.product.comparePrice != null ? Number(item.product.comparePrice) : null
    totalCount += item.quantity
    subtotalToman += unitPriceToman * item.quantity

    return {
      id: item.id,
      productId: item.product.id,
      productNameFa: item.product.nameFa,
      productNameEn: item.product.nameEn,
      slug: item.product.slug,
      imageUrl: item.product.images[0]?.url ?? null,
      unitPriceToman,
      comparePriceToman,
      quantity: item.quantity,
      stockQty: item.product.stockQty,
      minOrderQty: item.product.minOrderQty,
      packagingTier: item.packagingTier,
    }
  })

  return {
    items: lines,
    totalCount,
    subtotalToman,
  }
}

const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(10_000),
  packagingTier: z.nativeEnum(PackagingTier).nullish(),
})

export async function addToCartAction(input: unknown): Promise<ActionResult> {
  const parsed = AddToCartSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "ورودی نامعتبر" }
  }
  const { productId, quantity, packagingTier } = parsed.data
  const tier = packagingTier ?? null

  const session = await auth()
  const userId = session?.user ? (session.user as any).id : undefined
  const sessionId = userId ? undefined : await getSessionId()

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { packagingOptions: true },
  })

  if (!product || !product.isActive) return { success: false, error: "محصول یافت نشد" }
  
  try {
    resolveUnitPriceToman(product, tier)
  } catch (err) {
    if (err instanceof AppError) {
      return { success: false, error: err.message }
    }
    return { success: false, error: "خطای اعتبارسنجی قیمت" }
  }

  // Check stock based on existing cart item
  const existingItem = await db.cartItem.findFirst({
    where: userId 
      ? { userId, productId, packagingTier: tier }
      : { sessionId: sessionId!, productId, packagingTier: tier },
  })
  
  const existingQty = existingItem ? existingItem.quantity : 0
  if (existingQty + quantity > product.stockQty) {
    return { success: false, error: "موجودی کافی نیست" }
  }
  if (quantity < product.minOrderQty) {
    return {
      success: false,
      error: `حداقل سفارش ${product.minOrderQty} عدد است`,
    }
  }

  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingQty + quantity },
    })
  } else {
    if (userId) {
      await db.cartItem.create({
        data: { userId, productId, quantity, packagingTier: tier },
      })
    } else {
      await db.cartItem.create({
        data: { sessionId: sessionId!, productId, quantity, packagingTier: tier },
      })
    }
  }

  revalidatePath("/cart")
  revalidatePath("/")
  return { success: true, data: undefined }
}

export async function removeFromCartAction(itemId: string): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user ? (session.user as any).id : undefined
  const sessionId = userId ? undefined : await getSessionId()

  const item = await db.cartItem.findUnique({ where: { id: itemId } })
  if (!item) return { success: false, error: "آیتم یافت نشد" }

  const owned = userId ? item.userId === userId : item.sessionId === sessionId
  if (!owned) return { success: false, error: "دسترسی غیرمجاز" }

  await db.cartItem.delete({ where: { id: itemId } })
  revalidatePath("/cart")
  revalidatePath("/")
  return { success: true, data: undefined }
}

export async function updateCartItemAction(
  itemId: string,
  quantity: number
): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user ? (session.user as any).id : undefined
  const sessionId = userId ? undefined : await getSessionId()

  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { product: { select: { stockQty: true, minOrderQty: true } } },
  })

  if (!item) return { success: false, error: "آیتم یافت نشد" }

  const owned = userId ? item.userId === userId : item.sessionId === sessionId
  if (!owned) return { success: false, error: "دسترسی غیرمجاز" }

  if (quantity < item.product.minOrderQty)
    return { success: false, error: `حداقل سفارش ${item.product.minOrderQty} عدد است` }
  if (item.product.stockQty < quantity)
    return { success: false, error: "موجودی کافی نیست" }

  await db.cartItem.update({ where: { id: itemId }, data: { quantity } })
  revalidatePath("/cart")
  revalidatePath("/")
  return { success: true, data: undefined }
}

/** Merge guest cart into user cart on login */
export async function mergeCartAction(): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  const userId = (session.user as any).id

  const store = await cookies()
  const sessionId = store.get("session_id")?.value
  if (!sessionId) return

  const guestItems = await db.cartItem.findMany({
    where: { sessionId },
    include: { product: { select: { stockQty: true } } },
  })

  if (guestItems.length === 0) {
    store.delete("session_id")
    return
  }

  for (const item of guestItems) {
    const existingUserItem = await db.cartItem.findFirst({
      where: { userId, productId: item.productId, packagingTier: item.packagingTier },
    })

    const newQty = existingUserItem
      ? Math.min(existingUserItem.quantity + item.quantity, item.product.stockQty)
      : Math.min(item.quantity, item.product.stockQty)

    if (existingUserItem) {
      await db.cartItem.update({
        where: { id: existingUserItem.id },
        data: { quantity: newQty },
      })
    } else {
      await db.cartItem.create({
        data: { userId, productId: item.productId, quantity: newQty, packagingTier: item.packagingTier },
      })
    }
  }

  await db.cartItem.deleteMany({ where: { sessionId } })
  store.delete("session_id")
  revalidatePath("/cart")
  revalidatePath("/")
}
