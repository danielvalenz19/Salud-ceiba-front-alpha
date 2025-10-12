import { useEffect, useState } from "react"
import { listarCausas, type Causa } from "@/services/causas"

export function useCausas(token?: string) {
  const [causas, setCausas] = useState<Causa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
  listarCausas(token)
      .then((data) => {
        if (!alive) return
        setCausas(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(err instanceof Error ? err.message : "Error al cargar causas")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [token])

  return { causas, loading, error }
}
