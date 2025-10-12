import { ENDPOINTS } from "@/src/endpoints"
import { authFetch } from "@/src/lib/authFetch"

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

  const response = await authFetch(ENDPOINTS.morbilidad.casos, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      datos: payload.datos.map(({ cantidad, ...rest }) => ({ ...rest, casos: cantidad })),
    }),
  })

  if (!response.ok) {
    const msg = await response.text().catch(() => "")
    throw new Error(`POST morbilidad/casos ${response.status} ${msg}`)
  }

  return response.json().catch(() => ({}))
}
