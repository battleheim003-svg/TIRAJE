const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

export function escapeHtml(input: unknown): string {
  if (input == null) return ""
  return String(input).replace(/[&<>"']/g, (c) => ESC[c]!)
}
