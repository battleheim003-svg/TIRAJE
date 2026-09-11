/**
 * S3-compatible object storage service.
 * Compatible with: Liara Object Storage, MinIO, AWS S3.
 * Configuration via env vars — no code change to switch providers.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"
import path from "path"
import { AppError } from "@tirajeh/shared"

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

// Valid key prefixes — enforce server-generated paths, block path traversal
const ALLOWED_KEY_PREFIXES = new Set(["products/", "blog/", "avatars/"])

function wrapS3Error(err: unknown, operation: string): never {
  // Log the raw AWS error server-side (may contain endpoint/bucket details)
  console.error(`[storage:${operation}]`, err instanceof Error ? err.message : err)
  throw new AppError("خطا در سرویس ذخیره‌سازی. لطفاً مجدداً تلاش کنید.", "STORAGE_ERROR", 502)
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT
  if (!endpoint) throw new Error("S3_ENDPOINT env var is required")

  return new S3Client({
    endpoint,
    region: process.env.S3_REGION ?? "ir-thr-at1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
    forcePathStyle: true, // Required for MinIO / Liara
  })
}

const BUCKET = () => process.env.S3_BUCKET ?? "tirajeh"
const PUBLIC_URL = () => process.env.S3_PUBLIC_URL ?? ""

export class StorageService {
  private _s3: S3Client | null = null

  private get s3(): S3Client {
    if (!this._s3) {
      this._s3 = getS3Client()
    }
    return this._s3
  }

  /**
   * Upload a file buffer. Returns the public URL.
   * Folder structure: /{prefix}/{year}/{month}/{uuid}.{ext}
   */
  async upload(params: {
    buffer: Buffer
    mimeType: string
    originalName: string
    prefix: "products" | "blog" | "avatars"
  }): Promise<{ url: string; key: string }> {
    if (!ALLOWED_IMAGE_TYPES.has(params.mimeType))
      throw new Error(`Unsupported file type: ${params.mimeType}`)

    if (params.buffer.length > MAX_IMAGE_SIZE)
      throw new Error("File too large (max 5MB)")

    const ext = path.extname(params.originalName).toLowerCase() || ".jpg"
    const now = new Date()
    const key = `${params.prefix}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${randomUUID()}${ext}`

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: BUCKET(),
          Key: key,
          Body: params.buffer,
          ContentType: params.mimeType,
          CacheControl: "public, max-age=31536000, immutable",
        })
      )
    } catch (err) {
      wrapS3Error(err, "upload")
    }

    const url = `${PUBLIC_URL()}/${key}`
    return { url, key }
  }

  /** Delete by key (not URL) */
  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: BUCKET(), Key: key })
      )
    } catch (err) {
      wrapS3Error(err, "delete")
    }
  }

  /**
   * Generate a presigned URL for direct browser → S3 upload.
   * Key MUST be server-generated (e.g. from generateUploadKey()).
   * Key prefix is validated against ALLOWED_KEY_PREFIXES to prevent path traversal.
   */
  async presignedUploadUrl(params: {
    key: string
    mimeType: string
    expiresIn?: number
  }): Promise<string> {
    if (!ALLOWED_IMAGE_TYPES.has(params.mimeType))
      throw new Error(`Unsupported MIME type: ${params.mimeType}`)

    const validPrefix = [...ALLOWED_KEY_PREFIXES].some((p) => params.key.startsWith(p))
    if (!validPrefix || params.key.includes(".."))
      throw new Error(`Invalid storage key: ${params.key}`)

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET(),
        Key: params.key,
        ContentType: params.mimeType,
      })
      return await getSignedUrl(this.s3, command, {
        expiresIn: params.expiresIn ?? 300, // 5 minutes
      })
    } catch (err) {
      wrapS3Error(err, "presign")
    }
  }

  /** Extract S3 key from a public URL */
  keyFromUrl(url: string): string {
    return url.replace(`${PUBLIC_URL()}/`, "")
  }
}

export const storageService = new StorageService()
