import { ENDPOINTS } from "@/src/endpoints"

export type CausaApi = {
  id: number
  nombre: string
  sigsa_codigo?: string
  codigo_icd10?: string
}

export type Causa = {
  id: number
  nombre: string
  label: string
}

const buildLabel = (c: CausaApi): string => {
  const base = (c.nombre ?? "").trim()
  if (base) return base
  const extra = [c.sigsa_codigo, c.codigo_icd10].filter(Boolean).join(" / ")
  return extra || `Causa ${c.id}`
}

type CacheEntry = {
  key: string
  data: Causa[]
}

let cache: CacheEntry | null = null

function cacheKey(token?: string) {
  return token ? `auth:${token}` : "anon"
}

async function requestCausas(token?: string): Promise<CausaApi[]> {
  const res = await fetch(ENDPOINTS.causas, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al obtener causas`)
  }

  const body = await res.json()
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body)) return body
  return []
}

export async function listarCausas(token?: string, force = false): Promise<Causa[]> {
  const key = cacheKey(token)
  if (!force && cache && cache.key === key) {
    return cache.data
  }

  const data = await requestCausas(token)

  const seen = new Set<number>()
  const out: Causa[] = []
  for (const c of data) {
    if (!c || typeof c.id !== "number") continue
    if (seen.has(c.id)) continue
    seen.add(c.id)
    out.push({ id: c.id, nombre: c.nombre ?? "", label: buildLabel(c) })
  }

  out.sort((a, b) => a.label.localeCompare(b.label, "es"))
  cache = { key, data: out }
  return out
}
