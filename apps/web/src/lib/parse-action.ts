import { z, ZodError, type ZodTypeAny } from "zod"
import type { ActionError } from "@tirajeh/shared"

export function parseAction<T extends ZodTypeAny>(
  schema: T,
  input: unknown
): { data: z.infer<T> } | { error: ActionError } {
  try {
    return { data: schema.parse(input) }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        error: {
          success: false,
          error: "داده‌های ورودی معتبر نیستند.",
          fieldErrors: Object.fromEntries(
            err.errors.map((e) => [e.path.join("."), e.message])
          ),
        },
      }
    }
    throw err
  }
}
