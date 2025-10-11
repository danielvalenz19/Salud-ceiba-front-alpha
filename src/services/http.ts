// src/services/http.ts
// Normaliza y garantiza exactamente un /api/v1 en la base.
const RAW = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
const ROOT = RAW.replace(/\/+$/, "") // sin slash final
export const API_BASE = /\/api\/v1\/?$/i.test(ROOT) ? ROOT : `${ROOT}/api/v1`

export function api(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE}${p}`
}
