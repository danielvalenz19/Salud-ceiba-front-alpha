import { api } from "./http"

const ENV_API = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "")

const resolveUrl = (path: string) => {
  const suffix = path.startsWith("/") ? path : `/${path}`
  if (ENV_API) return `${ENV_API}${suffix}`
  return api(suffix)
}

export type Causa = { causa_id: number; nombre?: string; descripcion?: string }

async function fetchJSON(url: string, token?: string) {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  const resp = await fetch(url, {
    headers,
    cache: "no-store",
  })

  if (resp.status === 404) {
    return { notFound: true as const }
  }

  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status} en ${url}`)
    throw err
  }

  return { data: await resp.json() }
}

export async function fetchCausasNew(token?: string): Promise<Causa[]> {
  const candidates = [
    resolveUrl("/morbilidad/causas"),
    resolveUrl("/catalogos/causas"),
    resolveUrl("/causas"),
  ]

  for (const url of candidates) {
    const res = await fetchJSON(url, token).catch((error) => {
      if (/HTTP 401|HTTP 5/.test(String(error))) {
        throw error
      }
      return { notFound: true as const }
    })

    if (res && "data" in res) {
      return Array.isArray(res.data) ? res.data : []
    }
  }

  throw new Error("Catálogo de causas no disponible en rutas conocidas")
}

// --- MORBILIDAD ---
export type GrupoEdad = "0-<1" | "1-4" | "5-14" | "15+"
export type MorbilidadDato = { causa_id: number; grupo_edad: GrupoEdad; casos: number }

export async function registrarMorbilidad(
  token: string,
  payload: { anio: number; mes: number; territorio_id: number; datos: MorbilidadDato[] }
) {
  const resp = await fetch(resolveUrl("/morbilidad/casos"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "")
    throw new Error(`POST /morbilidad/casos ${resp.status}: ${txt}`)
  }

  try {
    return await resp.json()
  } catch {
    return {}
  }
}
