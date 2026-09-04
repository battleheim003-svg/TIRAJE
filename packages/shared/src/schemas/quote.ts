import { z } from "zod"

export const CreateQuoteSchema = z.object({
  name: z.string().min(2, "نام الزامی").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره موبایل معتبر وارد کنید"),
  companyName: z.string().max(200).optional(),
  customerType: z.enum(["NORMAL", "CONTRACTOR", "COMPANY"]).default("NORMAL"),
  productId: z.string().uuid("محصول معتبر انتخاب کنید"),
  quantityTon: z.coerce
    .number()
    .min(1, "حداقل مقدار ۱ تن")
    .max(10000, "حداکثر ۱۰۰۰۰ تن"),
  deliveryCity: z.string().max(100).optional(),
  message: z.string().max(1000).optional(),
})

export const RespondQuoteSchema = z.object({
  quoteId: z.string().uuid(),
  status: z.enum(["REVIEWED", "QUOTED", "REJECTED"]),
  quotedPrice: z.coerce.number().min(0).optional(),
  adminNote: z.string().max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
})

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>
export type RespondQuoteInput = z.infer<typeof RespondQuoteSchema>
