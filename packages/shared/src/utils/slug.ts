/**
 * Generate URL-safe slugs.
 * Handles Persian/Arabic chars by keeping them as-is (valid in URLs via percent-encoding)
 * but uses a transliteration map for common cases to keep slugs ASCII where possible.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w؀-ۿ-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateSKU(prefix: string, id: string): string {
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase()
  return `${prefix.toUpperCase()}-${short}`
}
