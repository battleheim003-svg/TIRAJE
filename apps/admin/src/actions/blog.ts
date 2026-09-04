"use server"

import { db } from "@tirajeh/database"
import { auth, requirePermission } from "@tirajeh/auth"
import { CreatePostSchema, UpdatePostSchema } from "@tirajeh/shared"
import { PERMISSIONS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "./_audit"

async function getSessionOrThrow() {
  const session = await auth()
  if (!session?.user) throw new Error("UNAUTHENTICATED")
  return session
}

export async function createPostAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.POST_CREATE)

  const raw = Object.fromEntries(formData)
  // tagIds may come as a JSON array string
  const tagIds = raw.tagIds ? JSON.parse(raw.tagIds as string) : []
  const parsed = CreatePostSchema.safeParse({ ...raw, tagIds })

  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { tagIds: tags, ...postData } = parsed.data

  const existing = await db.post.findUnique({ where: { slug: postData.slug } })
  if (existing) return { success: false, error: "این slug قبلاً استفاده شده" }

  const post = await db.post.create({
    data: {
      ...postData,
      authorId: session.user.id,
      publishedAt: postData.status === "PUBLISHED" ? (postData.publishedAt ?? new Date()) : null,
      tags: {
        create: tags.map((tagId: string) => ({ tagId })),
      },
    },
    select: { id: true },
  })

  await writeAuditLog({
    userId: session.user.id,
    action: "create",
    resource: "post",
    resourceId: post.id,
    newValues: { title: postData.title },
  })

  revalidatePath("/blog")
  return { success: true, data: { id: post.id } }
}

export async function updatePostAction(
  postId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.POST_UPDATE)

  const raw = Object.fromEntries(formData)
  const tagIds = raw.tagIds ? JSON.parse(raw.tagIds as string) : undefined
  const parsed = UpdatePostSchema.safeParse({ ...raw, tagIds })

  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { tagIds: tags, ...postData } = parsed.data

  await db.$transaction(async (tx) => {
    await tx.post.update({ where: { id: postId }, data: postData })

    if (tags !== undefined) {
      await tx.postTag.deleteMany({ where: { postId } })
      if (tags.length > 0) {
        await tx.postTag.createMany({
          data: tags.map((tagId: string) => ({ postId, tagId })),
        })
      }
    }
  })

  await writeAuditLog({
    userId: session.user.id,
    action: "update",
    resource: "post",
    resourceId: postId,
    newValues: postData,
  })

  revalidatePath(`/blog/${postId}`)
  revalidatePath("/blog")
  return { success: true, data: undefined }
}

export async function publishPostAction(postId: string): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.POST_PUBLISH)

  await db.post.update({
    where: { id: postId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  })

  await writeAuditLog({
    userId: session.user.id,
    action: "update",
    resource: "post",
    resourceId: postId,
    newValues: { status: "PUBLISHED" },
  })

  revalidatePath("/blog")
  return { success: true, data: undefined }
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.POST_DELETE)

  await db.post.update({ where: { id: postId }, data: { status: "ARCHIVED" } })

  await writeAuditLog({
    userId: session.user.id,
    action: "delete",
    resource: "post",
    resourceId: postId,
  })

  revalidatePath("/blog")
  return { success: true, data: undefined }
}
