import { z } from "zod"

export const AddressSchema = z.object({
  recipientName: z.string().min(2, "نام گیرنده الزامی").max(100),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره موبایل معتبر وارد کنید"),
  province: z.string().min(2, "استان الزامی").max(100),
  city: z.string().min(2, "شهر الزامی").max(100),
  district: z.string().max(100).optional(),
  street: z.string().min(5, "آدرس الزامی").max(500),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی ۱۰ رقمی وارد کنید").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const CheckoutSchema = z.object({
  shippingAddress: AddressSchema,
  shippingRateId: z.string().uuid("روش ارسال معتبر انتخاب کنید"),
  couponCode: z.string().optional(),
  note: z.string().max(500).optional(),
  paymentGateway: z.enum(["ZARINPAL", "IDPAY"]).default("ZARINPAL"),
})

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().max(500).optional(),
})

export const CancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(5, "دلیل لغو الزامی").max(500),
})

export type AddressInput = z.infer<typeof AddressSchema>
export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>
