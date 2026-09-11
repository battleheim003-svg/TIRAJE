import { z } from "zod"

export const ContactCategorySchema = z.enum([
  "ACCOUNT_ISSUE",
  "PRICE_INQUIRY",
  "ORDER_ISSUE",
  "PRODUCT_INQUIRY",
  "TECHNICAL_ISSUE",
  "OTHER",
])

export const ContactSourceSchema = z.enum(["WEBSITE", "TELEGRAM"])

export const ContactStatusSchema = z.enum(["UNREAD", "READ", "REPLIED"])

export const FilterTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: ContactStatusSchema.optional(),
  category: ContactCategorySchema.optional(),
  source: ContactSourceSchema.optional(),
})

export const ReplyTicketSchema = z.object({
  ticketId: z.string().uuid("شناسه تیکت نامعتبر است"),
  replyText: z.string().min(1, "متن پاسخ الزامی است").max(4000, "حداکثر ۴۰۰۰ کاراکتر"),
  status: z.enum(["READ", "REPLIED"]).default("REPLIED"),
})

export const CreateTicketSchema = z.object({
  name: z.string().min(2, "نام الزامی است").max(100),
  email: z.string().email("ایمیل معتبر وارد کنید").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^09[0-9]{9}$/, "شماره موبایل معتبر وارد کنید")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(2, "موضوع الزامی است").max(200),
  message: z.string().min(5, "پیام الزامی است").max(4000),
  category: ContactCategorySchema.optional(),
  source: ContactSourceSchema.default("WEBSITE"),
  telegramChatId: z.string().optional(),
  telegramUserId: z.string().optional(),
  telegramUsername: z.string().optional(),
})

export type ContactCategoryType = z.infer<typeof ContactCategorySchema>
export type ContactSourceType = z.infer<typeof ContactSourceSchema>
export type ContactStatusType = z.infer<typeof ContactStatusSchema>
export type FilterTicketsInput = z.infer<typeof FilterTicketsSchema>
export type ReplyTicketInput = z.infer<typeof ReplyTicketSchema>
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
