"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

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

export async function addToCartAction(
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user ? (session.user as any).id : undefined
  const sessionId = userId ? undefined : await getSessionId()

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, stockQty: true, minOrderQty: true, isActive: true, nameFa: true },
  })

  if (!product || !product.isActive) return { success: false, error: "محصول یافت نشد" }
  if (product.stockQty < quantity)
    return { success: false, error: "موجودی کافی نیست" }
  if (quantity < product.minOrderQty)
    return {
      success: false,
      error: `حداقل سفارش ${product.minOrderQty} عدد است`,
    }

  if (userId) {
    await db.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
    })
  } else {
    await db.cartItem.upsert({
      where: { sessionId_productId: { sessionId: sessionId!, productId } },
      update: { quantity: { increment: quantity } },
      create: { sessionId: sessionId!, productId, quantity },
    })
  }

  revalidatePath("/cart")
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
  })

  if (guestItems.length === 0) return

  for (const item of guestItems) {
    await db.cartItem.upsert({
      where: { userId_productId: { userId, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: { userId, productId: item.productId, quantity: item.quantity },
    })
  }

  await db.cartItem.deleteMany({ where: { sessionId } })
  store.delete("session_id")
}
