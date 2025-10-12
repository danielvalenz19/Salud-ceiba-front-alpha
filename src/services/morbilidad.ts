import { ENDPOINTS } from "@/src/endpoints"

export type CrearCasoItem = {
  causa_id: number
  grupo_edad: string
  cantidad: number
}

export type CrearCasoPayload = {
  anio: number
  mes: number
  territorio_id: number
  datos: CrearCasoItem[]
}

export async function crearMorbilidad(payload: CrearCasoPayload) {
  console.debug("[POST]", ENDPOINTS.morbilidad.casos, payload)

  const response = await fetch(ENDPOINTS.morbilidad.casos, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const msg = await response.text().catch(() => "")
    throw new Error(`POST /morbilidad/casos → ${response.status} ${msg}`)
  }

  return response.json().catch(() => ({}))
}
