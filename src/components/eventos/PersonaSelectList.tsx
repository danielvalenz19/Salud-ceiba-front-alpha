"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/src/lib/api/client"

type PersonaLite = { persona_id: number; nombres: string; apellidos: string }

export default function PersonaSelectList({
  value,
  onChange,
  limit = 200,
}: {
  value: number | null
  onChange: (id: number | null) => void
  limit?: number
}) {
  const [items, setItems] = useState<PersonaLite[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get("/personas", { params: { page: 1, limit } })
        const rows = Array.isArray(data) ? data : data?.data ?? []
        if (!cancel) setItems(rows)
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [limit])

  return (
    <Select
      value={value !== null ? String(value) : "none"}
      onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando…" : "Seleccionar persona"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sin persona</SelectItem>
        {items.map((p) => (
          <SelectItem key={p.persona_id} value={String(p.persona_id)}>
            {p.nombres} {p.apellidos} (ID:{p.persona_id})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
