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
  quantityTon: number
): Promise<ActionResult> {
  const session = await auth()
  const sessionId = session ? undefined : await getSessionId()

  const product = await db.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, stockTon: true, minOrderTon: true, maxOrderTon: true },
  })

  if (!product) return { success: false, error: "محصول یافت نشد" }
  if (Number(product.stockTon) < quantityTon)
    return { success: false, error: "موجودی کافی نیست" }
  if (quantityTon < Number(product.minOrderTon))
    return {
      success: false,
      error: `حداقل سفارش ${product.minOrderTon} تن است`,
    }

  const where = session
    ? { userId_productId: { userId: session.user!.id, productId } }
    : { sessionId_productId: { sessionId: sessionId!, productId } }

  const existing = await db.cartItem.findUnique({ where: where as never })

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantityTon: { increment: quantityTon } },
    })
  } else {
    let cartId: string

    if (session) {
      const cart = await db.cart.upsert({
        where: { userId: session.user!.id },
        update: {},
        create: { userId: session.user!.id },
        select: { id: true },
      })
      cartId = cart.id
    } else {
      const cart = await db.cart.upsert({
        where: { sessionId: sessionId! },
        update: {},
        create: { sessionId: sessionId! },
        select: { id: true },
      })
      cartId = cart.id
    }

    await db.cartItem.create({
      data: {
        cartId,
        productId,
        quantityTon,
        userId: session?.user?.id ?? null,
        sessionId: sessionId ?? null,
      },
    })
  }

  revalidatePath("/cart")
  return { success: true, data: undefined }
}

export async function removeFromCartAction(itemId: string): Promise<ActionResult> {
  const session = await auth()
  const sessionId = session ? undefined : await getSessionId()

  const item = await db.cartItem.findUnique({ where: { id: itemId } })
  if (!item) return { success: false, error: "آیتم یافت نشد" }

  // Security: ensure ownership
  const owned = session
    ? item.userId === session.user?.id
    : item.sessionId === sessionId

  if (!owned) return { success: false, error: "دسترسی غیرمجاز" }

  await db.cartItem.delete({ where: { id: itemId } })
  revalidatePath("/cart")
  return { success: true, data: undefined }
}

export async function updateCartItemAction(
  itemId: string,
  quantityTon: number
): Promise<ActionResult> {
  const session = await auth()
  const sessionId = session ? undefined : await getSessionId()

  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { product: { select: { stockTon: true, minOrderTon: true, maxOrderTon: true } } },
  })

  if (!item) return { success: false, error: "آیتم یافت نشد" }

  const owned = session ? item.userId === session.user?.id : item.sessionId === sessionId
  if (!owned) return { success: false, error: "دسترسی غیرمجاز" }

  if (quantityTon < Number(item.product.minOrderTon))
    return { success: false, error: `حداقل سفارش ${item.product.minOrderTon} تن` }
  if (Number(item.product.stockTon) < quantityTon)
    return { success: false, error: "موجودی کافی نیست" }

  await db.cartItem.update({ where: { id: itemId }, data: { quantityTon } })
  revalidatePath("/cart")
  return { success: true, data: undefined }
}

/** Merge guest cart into user cart on login */
export async function mergeCartAction(): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const store = await cookies()
  const sessionId = store.get("session_id")?.value
  if (!sessionId) return

  const guestCart = await db.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  })

  if (!guestCart || guestCart.items.length === 0) return

  const userCart = await db.cart.upsert({
    where: { userId: session.user!.id },
    update: {},
    create: { userId: session.user!.id },
  })

  for (const item of guestCart.items) {
    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: session.user!.id, productId: item.productId } },
    })

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantityTon: { increment: Number(item.quantityTon) } },
      })
    } else {
      await db.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          quantityTon: item.quantityTon,
          userId: session.user!.id,
          sessionId: null,
        },
      })
    }
  }

  await db.cart.delete({ where: { id: guestCart.id } })
  store.delete("session_id")
}
