"use server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { storageService } from "@tirajeh/integrations"
import { auth } from "@tirajeh/auth"

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("دسترسی غیرمجاز")
  }
}

const UploadSchema = z.object({
  kind: z.enum(["products", "blog", "avatars"]),
  contentType: z.enum(["image/webp", "image/jpeg", "image/png"]),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024, "حجم فایل بیش از ۵ مگابایت است"),
})

export async function createUploadUrlAction(
  input: unknown
): Promise<ActionResult<{ uploadUrl: string; publicUrl: string; key: string }>> {
  try {
    await requireAdmin()
  } catch (err) {
    return { success: false, error: "احراز هویت انجام نشده است" }
  }

  const parsed = UploadSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { kind, contentType } = parsed.data
  const ext = contentType.split("/")[1]
  const yyyy = new Date().getFullYear()
  const MM = String(new Date().getMonth() + 1).padStart(2, "0")
  const key = `${kind}/${yyyy}/${MM}/${randomUUID()}.${ext}`

  try {
    const uploadUrl = await storageService.presignedUploadUrl({
      key,
      mimeType: contentType,
      expiresIn: 300,
    })
    
    const publicUrl = `${process.env.S3_PUBLIC_URL}/${key}`

    return { success: true, data: { uploadUrl, publicUrl, key } }
  } catch (error) {
    console.error("Presigned URL generation failed", error)
    return { success: false, error: "خطا در تولید لینک آپلود" }
  }
}
