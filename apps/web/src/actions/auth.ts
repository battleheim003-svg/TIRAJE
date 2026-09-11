"use server"

import { signIn, signOut } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import { RegisterSchema, LoginSchema, ChangePasswordSchema, UpdateProfileSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { auth } from "@tirajeh/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات ورودی نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "ایمیل یا رمز عبور اشتباه است" }
  }
}

export async function registerAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData)
  const parsed = RegisterSchema.safeParse(raw)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "اطلاعات ورودی نامعتبر"
    return {
      success: false,
      error: firstError,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { name, email, phone, password, customerType } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: "این ایمیل قبلاً ثبت شده است" }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  let customerRole = await db.role.findFirst({
    where: { name: { in: ["customer", "user"] } },
  })
  if (!customerRole) {
    customerRole = await db.role.create({
      data: {
        name: "customer",
        displayName: "مشتری",
        description: "نقش پیش‌فرض مشتریان",
        isSystem: true,
      },
    })
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      customerType: customerType ?? "NORMAL",
      roleId: customerRole.id,
      isActive: true,
    },
    select: { id: true },
  })

  return { success: true, data: { id: user.id } }
}

export async function logoutAction() {
  await signOut({ redirect: false })
  redirect("/")
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "احراز هویت الزامی" }

  const raw = Object.fromEntries(formData)
  const parsed = UpdateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      customerProfile: {
        upsert: {
          create: {
            companyName: parsed.data.companyName || null,
            nationalId: parsed.data.nationalId || null,
          },
          update: {
            companyName: parsed.data.companyName || null,
            nationalId: parsed.data.nationalId || null,
          },
        },
      },
    },
  })

  revalidatePath("/account")
  return { success: true, data: undefined }
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "احراز هویت الزامی" }

  const raw = Object.fromEntries(formData)
  const parsed = ChangePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.passwordHash) return { success: false, error: "خطای داخلی" }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return { success: false, error: "رمز عبور فعلی اشتباه است" }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

  return { success: true, data: undefined }
}
