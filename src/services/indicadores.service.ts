export type IndicadorMeta = {
  id: number | string
  nombre: string
  tipo: "porcentaje" | "porMil" | "crudo"
  notas?: string
}

export const INDICADORES_PREDEF: IndicadorMeta[] = [
  { id: 401, nombre: "Incidencia IRA <5", tipo: "porMil" },
  { id: 402, nombre: "Incidencia EDA <5", tipo: "porMil" },
  { id: 403, nombre: "Tasa de Mortalidad General", tipo: "porMil" },
  { id: 404, nombre: "CFR Dengue", tipo: "porcentaje" },
  { id: 405, nombre: "Cobertura DPT3", tipo: "porcentaje" },
  { id: 406, nombre: "≥4 Controles Prenatales (CPN)", tipo: "porcentaje" },
  { id: 407, nombre: "Partos Institucionales", tipo: "porcentaje" },
  { id: 408, nombre: "Ocupación Hospitalaria", tipo: "porcentaje" },
  { id: 409, nombre: "Oportunidad de Notificación", tipo: "porcentaje" },
  { id: 301, nombre: "Ejemplo (301)", tipo: "porcentaje" },
]

export function indicadorPorId(id: number | string) {
  return INDICADORES_PREDEF.find((x) => String(x.id) === String(id))
}
