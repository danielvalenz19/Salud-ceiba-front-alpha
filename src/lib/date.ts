// src/lib/date.ts
export const MESES_NUM: Record<string, number> = {
  "Enero": 1,
  "Febrero": 2,
  "Marzo": 3,
  "Abril": 4,
  "Mayo": 5,
  "Junio": 6,
  "Julio": 7,
  "Agosto": 8,
  "Septiembre": 9,
  "Octubre": 10,
  "Noviembre": 11,
  "Diciembre": 12,
}

export function mesTextoANumero(mes: string): number {
  const n = MESES_NUM[mes]
  if (!n) throw new Error(`Mes inválido: ${mes}`)
  return n
}
