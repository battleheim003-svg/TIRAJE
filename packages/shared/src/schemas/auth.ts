import { z } from "zod"

export const LoginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
})

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "نام حداقل ۲ کاراکتر").max(100),
    email: z.string().email("ایمیل معتبر وارد کنید"),
    phone: z
      .string()
      .regex(/^09[0-9]{9}$/, "شماره موبایل معتبر وارد کنید"),
    password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر"),
    confirmPassword: z.string(),
    customerType: z.enum(["NORMAL", "CONTRACTOR", "COMPANY"]).default("NORMAL"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  })

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز فعلی الزامی است"),
    newPassword: z.string().min(8, "رمز جدید حداقل ۸ کاراکتر"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "رمز جدید و تکرار آن یکسان نیستند",
    path: ["confirmNewPassword"],
  })

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^09[0-9]{9}$/)
    .optional()
    .or(z.literal("")),
  companyName: z.string().max(200).optional().or(z.literal("")),
  nationalId: z.string().max(20).optional().or(z.literal("")),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
