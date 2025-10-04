import { apiClient } from "@/lib/api"

type RawCobertura = {
  ind_id: number
  mes: number
  cobertura_pct: number | string
  poblacion_objetivo?: number | null
  poblacion_cubierta?: number | null
}

export type MesRow = {
  mes: number
  cobertura: number
  meta: number
  poblacion_objetivo?: number | null
  poblacion_cubierta?: number | null
}

export type CoberturaNormalized = {
  promedioAnual: number
  mejorMes: number
  estadoGeneral: string
  mensual: MesRow[]
}

// Ajusta estos IDs a los que uses realmente en tu BD
const VACC_IND_SET = new Set<number>([1, 2, 301]) // vacunación
const NUTR_IND_SET = new Set<number>([101, 3, 4]) // nutrición

const estadoFromPct = (pct: number) => (pct >= 80 ? "Óptima" : pct >= 60 ? "Aceptable" : "Deficiente")

const normalize = (rows: RawCobertura[], allowed: Set<number>): CoberturaNormalized => {
  // filtra solo los indicadores del módulo
  const filtered = rows.filter((r) => allowed.has(r.ind_id))

  // agrupa por mes (si hay más de un indicador del mismo mes, promedia)
  const byMonth = new Map<number, { sum: number; n: number; po?: number | null; pc?: number | null }>()
  for (const r of filtered) {
    const mes = Number(r.mes)
    const pct = typeof r.cobertura_pct === "string" ? parseFloat(r.cobertura_pct) : Number(r.cobertura_pct)
    const cur = byMonth.get(mes) ?? { sum: 0, n: 0, po: null, pc: null }
    byMonth.set(mes, {
      sum: cur.sum + (Number.isFinite(pct) ? pct : 0),
      n: cur.n + (Number.isFinite(pct) ? 1 : 0),
      po: r.poblacion_objetivo ?? cur.po ?? null,
      pc: r.poblacion_cubierta ?? cur.pc ?? null,
    })
  }

  // arma la serie mensual ordenada
  const mensual: MesRow[] = Array.from(byMonth.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([mes, agg]) => ({
      mes,
      cobertura: agg.n ? Number((agg.sum / agg.n).toFixed(1)) : 0,
      meta: 80,
      poblacion_objetivo: agg.po ?? null,
      poblacion_cubierta: agg.pc ?? null,
    }))

  const promedioAnual = mensual.length
    ? Number((mensual.reduce((s, m) => s + m.cobertura, 0) / mensual.length).toFixed(1))
    : 0

  const mejorMes = mensual.length ? Math.max(...mensual.map((m) => m.cobertura)) : 0

  return {
    promedioAnual,
    mejorMes,
    estadoGeneral: estadoFromPct(promedioAnual),
    mensual,
  }
}

export async function getTerritorios(): Promise<Array<{ id: number; nombre: string }>> {
  const res = await apiClient.getTerritorios()
  const list = Array.isArray(res.data) ? res.data : []
  return list.map((t: any) => ({ id: Number(t.territorio_id), nombre: String(t.nombre) }))
}

export async function getCoberturaVacunacion(territorioId: number, anio: number) {
  const res = await apiClient.getVacunacionCoberturas({ territorio_id: territorioId, anio })
  const rows: RawCobertura[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  return normalize(rows, VACC_IND_SET)
}

export async function getCoberturaNutricion(territorioId: number, anio: number) {
  const res = await apiClient.getNutricionCoberturas({ territorio_id: territorioId, anio })
  const rows: RawCobertura[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  return normalize(rows, NUTR_IND_SET)
}