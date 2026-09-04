import type { ActionResult } from "../types"

// ─── Typed domain errors ─────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} یافت نشد`, "NOT_FOUND", 404)
    this.name = "NotFoundError"
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("دسترسی غیرمجاز", "FORBIDDEN", 403)
    this.name = "ForbiddenError"
  }
}

export class UnauthenticatedError extends AppError {
  constructor() {
    super("احراز هویت الزامی", "UNAUTHENTICATED", 401)
    this.name = "UnauthenticatedError"
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409)
    this.name = "ConflictError"
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 422)
    this.name = "ValidationError"
  }
}

/**
 * PaymentError — user-safe payment gateway errors.
 * Use for known gateway failure states (init refused, verify failed) where a
 * specific Persian message is appropriate. Internal gateway codes must NOT be
 * included in the message; they belong in the server log only.
 */
export class PaymentError extends AppError {
  constructor(message: string = "خطا در اتصال به درگاه پرداخت. لطفاً مجدداً تلاش کنید.") {
    super(message, "PAYMENT_ERROR", 502)
    this.name = "PaymentError"
  }
}

// ─── User-safe message mapping ────────────────────────────────────────────────
// Maps internal error codes / messages that must NOT be exposed to users.
// Any error not matched here gets a generic "خطای داخلی" message.

const SAFE_CODES = new Set([
  "NOT_FOUND",
  "FORBIDDEN",
  "UNAUTHENTICATED",
  "CONFLICT",
  "VALIDATION_ERROR",
  "PAYMENT_ERROR",
])

function toUserMessage(err: unknown): string {
  if (err instanceof AppError && SAFE_CODES.has(err.code)) return err.message
  // Generic safe message for all unexpected errors
  return "خطای داخلی سرور. لطفاً مجدداً تلاش کنید."
}

// ─── Logger ───────────────────────────────────────────────────────────────────
// Swap with a real logger (Pino / Winston) in production; console here for dev.

function logError(context: string, err: unknown): void {
  if (err instanceof AppError && SAFE_CODES.has(err.code)) return // expected; no log
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  // In production replace with: logger.error({ context, message, stack })
  console.error(`[action:${context}]`, message, stack)
}

// ─── safeAction wrapper ───────────────────────────────────────────────────────
/**
 * Wraps a server action body. Catches all errors, logs unexpected ones,
 * and returns a consistent ActionResult<T>.
 *
 * Usage:
 *   export const myAction = safeAction("myAction", async () => {
 *     ...
 *     return { success: true, data: result }
 *   })
 */
export function safeAction<T>(
  context: string,
  fn: () => Promise<ActionResult<T>>
): () => Promise<ActionResult<T>>

export function safeAction<A extends unknown[], T>(
  context: string,
  fn: (...args: A) => Promise<ActionResult<T>>
): (...args: A) => Promise<ActionResult<T>>

export function safeAction<A extends unknown[], T>(
  context: string,
  fn: (...args: A) => Promise<ActionResult<T>>
): (...args: A) => Promise<ActionResult<T>> {
  return async (...args: A): Promise<ActionResult<T>> => {
    try {
      return await fn(...args)
    } catch (err) {
      logError(context, err)

      if (err instanceof ValidationError) {
        return {
          success: false,
          error: err.message,
          fieldErrors: err.fieldErrors,
        }
      }

      return {
        success: false,
        error: toUserMessage(err),
      }
    }
  }
}

// ─── Zod parse helper — throws ValidationError on failure ────────────────────
import { type ZodSchema, ZodError } from "zod"

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>
  const firstMessage =
    Object.values(fieldErrors).flat()[0] ?? "اطلاعات ورودی نامعتبر"
  throw new ValidationError(firstMessage, fieldErrors)
}
