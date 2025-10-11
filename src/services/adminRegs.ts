import { apiClient } from "@/lib/api";

// --------- Tipos ----------
export type MorbilidadRow = {
  causa_id: number
  causa_nombre?: string
  territorio_id: number
  territorio_nombre?: string
  anio: number
  mes: number
  casos: number
}

export type MortalidadAggRow = {
  causa_id: number
  causa_nombre?: string
  territorio_id: number
  territorio_nombre?: string
  anio: number
  mes: number
  total_defunciones: number
}

export type MortalidadDetalleRow = {
  registro_id: number
  causa_id: number
  causa_nombre?: string
  territorio_id: number
  territorio_nombre?: string
  fecha_defuncion: string
  defunciones?: number
  lugar_defuncion?: string
  certificador_id?: number
}

// -------------------- Catálogos --------------------
export async function fetchCausas() {
  // Try known endpoints in order; return [] if none exists
  const paths = [
    "/catalogos/causas",
    "/salud-publica/causas",
    "/salud/morbilidad/causas",
    "/morbilidad/causas",
  ]
  for (const p of paths) {
    try {
      const res = await apiClient.get<Array<{ causa_id: number; nombre: string }>>(p)
      if (Array.isArray(res.data)) return res.data
      return (res.data ?? [])
    } catch {}
  }
  return []
}

export async function fetchTerritorios() {
  try {
    const res = await apiClient.get<Array<{ territorio_id: number; nombre: string }>>("/territorios")
    return (res.data ?? [])
  } catch {
    try {
      const res = await apiClient.get<Array<{ territorio_id: number; nombre: string }>>("/salud/territorios")
      return (res.data ?? [])
    } catch {
      return []
    }
  }
}

// ------------------- Morbilidad --------------------
export async function getMorbilidadCasos(params: {
  causa_id?: number
  territorio_id?: number
  anio?: number
  mes?: number
}) {
  try {
    const res = await apiClient.get<MorbilidadRow[]>("/morbilidad/casos", { params })
    return (res.data ?? [])
  } catch {
    try {
      const res = await apiClient.get<MorbilidadRow[]>("/morbilidad/casos", { params })
      return (res.data ?? [])
    } catch {
      return []
    }
  }
}

export async function createMorbilidadCaso(payload: {
  anio: number
  mes: number
  territorio_id: number
  datos: Array<{ causa_id: number; grupo_edad: "0-<1" | "1-4" | "5-14" | "15+"; casos: number }>
}) {
  return apiClient.post("/morbilidad/casos", payload)
}

// ------------------- Mortalidad --------------------
export async function getMortalidadRegistros(params: {
  modo: "agregado" | "detalle"
  causa_id?: number
  territorio_id?: number
  anio?: number
  mes?: number
  page?: number
  limit?: number
}) {
  try {
    const res = await apiClient.get<MortalidadAggRow[] | MortalidadDetalleRow[]>("/salud/mortalidad", { params })
    return res.data as any
  } catch {
    try {
      const res = await apiClient.get<MortalidadAggRow[] | MortalidadDetalleRow[]>("/mortalidad/registros", { params })
      return res.data as any
    } catch {
      return []
    }
  }
}

export async function createMortalidadRegistro(payload: {
  causa_id: number
  territorio_id: number
  fecha_defuncion: string
  lugar_defuncion: string
  certificador_id: number
}) {
  return apiClient.post("/salud/mortalidad", payload)
}

// -------------------- Ambiente --------------------
export async function upsertAmbienteMetricas(metricas: Array<{
  tipo_metrica: string
  valor: number
  unidad: string
  fecha_medicion: string
  territorio_id: number
}>) {
  try {
    return await apiClient.post("/ambiente/metricas", metricas)
  } catch (e) {
    return await apiClient.post("/salud/ambiente/metricas", metricas)
  }
}
