import { z } from "zod"

export const ProductFilterSchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  brandSlug: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "popular"])
    .default("newest"),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
})

export const CreateProductSchema = z.object({
  name: z.string().min(2, "نام محصول الزامی").max(200),
  nameEn: z.string().max(200).optional().or(z.literal("")),
  slug: z.string().min(2).max(200),
  sku: z.string().min(2).max(100),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.string().uuid("دسته‌بندی معتبر انتخاب کنید"),
  brandId: z.string().uuid().optional().or(z.literal("")),
  factoryId: z.string().uuid().optional().or(z.literal("")),
  pricePerTon: z.coerce.number().min(1, "قیمت الزامی"),
  comparePrice: z.coerce.number().min(0).optional(),
  stockTon: z.coerce.number().min(0).default(0),
  minOrderTon: z.coerce.number().min(0.5).default(0.5),
  maxOrderTon: z.coerce.number().min(1).optional(),
  weightPerUnit: z.coerce.number().min(0.001),
  unit: z.string().default("کیلوگرم"),
  packagingType: z.string().optional(),
  cementType: z.string().optional(),
  strengthClass: z.string().optional(),
  standardCode: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  priceChangeReason: z.string().optional(),
})

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(100),
  nameEn: z.string().max(100).optional(),
  slug: z.string().min(2).max(100),
  parentId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
  order: z.coerce.number().default(0),
})

export type ProductFilterInput = z.infer<typeof ProductFilterSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
