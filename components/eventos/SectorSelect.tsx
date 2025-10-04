"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"

type Sector = { sector_id: number; nombre: string }

export default function SectorSelect({
  value,
  onChange,
}: { value?: number; onChange: (id: number) => void }) {
  const [sectores, setSectores] = useState<Sector[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiClient.getSectores()
        // La API está normalizada para poder devolver data plana o ApiResponse; tomamos res.data si existe
        const list = (res as any)?.data ?? res
        const arr: Sector[] = Array.isArray(list) ? list : (list?.data ?? [])
        setSectores(arr)
      } catch {
        setSectores([])
      }
    })()
  }, [])

  return (
    <Select value={value ? String(value) : undefined} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar sector" />
      </SelectTrigger>
      <SelectContent>
        {sectores.map((s) => (
          <SelectItem key={s.sector_id} value={String(s.sector_id)}>
            {s.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
