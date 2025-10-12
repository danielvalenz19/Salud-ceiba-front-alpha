export const MES_A_NUM: Record<string, number> = {
  Enero: 1,
  Febrero: 2,
  Marzo: 3,
  Abril: 4,
  Mayo: 5,
  Junio: 6,
  Julio: 7,
  Agosto: 8,
  Septiembre: 9,
  Octubre: 10,
  Noviembre: 11,
  Diciembre: 12,
}

export function mesToNumber(mes: string | number): number {
  if (typeof mes === "number") return mes
  const trimmed = mes.trim()
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return MES_A_NUM[trimmed] ?? new Date().getMonth() + 1
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed === "") return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  const coerced = Number(value)
  return Number.isFinite(coerced) ? coerced : null
}
