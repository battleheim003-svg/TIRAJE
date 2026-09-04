import { z } from "zod"

export const CreatePostSchema = z.object({
  title: z.string().min(5, "عنوان حداقل ۵ کاراکتر").max(200),
  titleEn: z.string().max(200).optional(),
  slug: z.string().min(3).max(200),
  excerpt: z.string().max(500).optional(),
  excerptEn: z.string().max(500).optional(),
  content: z.string().min(10, "متن مقاله الزامی"),
  contentEn: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  tagIds: z.array(z.string().uuid()).default([]),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  publishedAt: z.coerce.date().optional(),
})

export const UpdatePostSchema = CreatePostSchema.partial()

export const PostFilterSchema = z.object({
  q: z.string().optional(),
  tagSlug: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(10),
})

export const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(3, "متن نظر الزامی").max(1000),
  parentId: z.string().uuid().optional(),
})

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
export type PostFilterInput = z.infer<typeof PostFilterSchema>
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
