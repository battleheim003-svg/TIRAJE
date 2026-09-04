import { z } from "zod"

export const ContactSchema = z.object({
  name: z.string().min(2, "نام الزامی").max(100),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  phone: z
    .string()
    .regex(/^09[0-9]{9}$/, "شماره موبایل معتبر وارد کنید")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(3, "موضوع الزامی").max(200),
  message: z.string().min(10, "پیام الزامی").max(2000),
})

export type ContactInput = z.infer<typeof ContactSchema>
