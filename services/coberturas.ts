import { apiClient } from "@/lib/api"

// Normaliza la respuesta del backend a un shape fijo para la UI
function mapCobertura(resp: any) {
  const mensual = Array.isArray(resp?.coberturas)
    ? resp.coberturas.map((m: any) => ({
        mes: Number(m.mes),
        cobertura: Number(m.cobertura_pct ?? m.cobertura ?? 0),
        meta: Number(m.meta_pct ?? m.meta ?? 0),
        poblacion_objetivo: m.poblacion_objetivo ?? null,
        poblacion_cubierta: m.poblacion_cubierta ?? null,
      }))
    : []

  const coberturasVals: number[] = mensual.map((m: { cobertura: number }) => m.cobertura)
  const promedio = coberturasVals.length
    ? Math.round((coberturasVals.reduce((a: number, b: number) => a + b, 0) / coberturasVals.length) * 100) / 100
    : 0
  const mejor = coberturasVals.length ? Math.max(...coberturasVals) : 0

  return {
    promedioAnual: promedio,
    mejorMes: mejor,
    estadoGeneral: promedio >= 80 ? "Óptima" : promedio >= 60 ? "Aceptable" : "Deficiente",
    mensual,
  }
}

export async function getTerritorios(): Promise<Array<{ id: number; nombre: string }>> {
  const { data } = await apiClient.getTerritorios()
  const list = Array.isArray(data) ? data : []
  return list.map((t: any) => ({ id: Number(t.territorio_id ?? t.id ?? t.value), nombre: String(t.nombre ?? t.label) }))
}

export async function getCoberturaVacunacion(territorioId: number, anio: number) {
  const { data } = await apiClient.getVacunacionCoberturas({ territorio_id: territorioId, anio })
  return mapCobertura(data)
}

export async function getCoberturaNutricion(territorioId: number, anio: number) {
  const { data } = await apiClient.getNutricionCoberturas({ territorio_id: territorioId, anio })
  return mapCobertura(data)
}

export type { }