export type MetricaKind = 'rate_per_1000' | 'percent'

export type MetricaDef = {
  code: number | string
  name: string
  kind: MetricaKind
}

export const METRICAS_CATALOG: MetricaDef[] = [
  { code: 401, name: 'Incidencia IRA <5 ×1,000', kind: 'rate_per_1000' },
  { code: 402, name: 'Incidencia EDA <5 ×1,000', kind: 'rate_per_1000' },
  { code: 403, name: 'Mortalidad general ×1,000', kind: 'rate_per_1000' },
  { code: 404, name: 'CFR Dengue %', kind: 'percent' },
  { code: 405, name: 'Cobertura DPT3 %', kind: 'percent' },
  { code: 406, name: '≥4 CPN %', kind: 'percent' },
  { code: 407, name: 'Partos institucionales %', kind: 'percent' },
  { code: 408, name: 'Ocupación hospitalaria %', kind: 'percent' },
  { code: 409, name: 'Oportunidad de notificación %', kind: 'percent' },
]

export function getMetricaDef(code: number | string): MetricaDef | undefined {
  return METRICAS_CATALOG.find((m) => String(m.code) === String(code))
}

export function computeValue(row: { valor_num?: number; valor_den?: number | null }, kind: MetricaKind) {
  const num = Number(row.valor_num ?? 0)
  const den = Number(row.valor_den ?? 0)
  if (!den || !Number.isFinite(num) || !Number.isFinite(den)) return null
  const scale = kind === 'rate_per_1000' ? 1000 : 100
  return (num / den) * scale
}
