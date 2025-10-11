// src/services/morbilidad.ts
import { api } from "./http"

export type Causa = { causa_id: number; nombre?: string; descripcion?: string }

// --- CAUSAS ---
export async function fetchCausas(token: string): Promise<Causa[]> {
  const res = await fetch(api("/causas"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`GET /causas ${res.status}: ${txt}`)
  }
  return res.json()
}

// --- MORBILIDAD ---
export type GrupoEdad = "0-<1" | "1-4" | "5-14" | "15+"
export type MorbilidadDato = { causa_id: number; grupo_edad: GrupoEdad; casos: number }

export async function registrarMorbilidad(
  token: string,
  payload: { anio: number; mes: number; territorio_id: number; datos: MorbilidadDato[] }
) {
  const res = await fetch(api("/morbilidad/casos"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`POST /morbilidad/casos ${res.status}: ${txt}`)
  }
  try {
    return await res.json()
  } catch {
    return {}
  }
}
