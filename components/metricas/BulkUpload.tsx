"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { putMetricas, type MetricaUpsert } from "@/src/services/metricas.service"
import { useToast } from "@/hooks/use-toast"

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(Boolean)
  if (!lines.length) return []
  const headers = lines[0].split(",").map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = line.split(",")
    const row: Record<string, string> = {}
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()))
    return row
  })
}

export function BulkUpload() {
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File) => {
    const text = await file.text()
    const rows = parseCSV(text)
    const payload: MetricaUpsert[] = rows.map((r) => ({
      ind_id: r.ind_id?.match(/^\d+$/) ? Number(r.ind_id) : r.ind_id,
      territorio_id: Number(r.territorio_id),
      anio: Number(r.anio),
      mes: Number(r.mes),
      valor_num: Number(r.valor_num),
      valor_den: r.valor_den ? Number(r.valor_den) : undefined,
    }))

    try {
      setBusy(true)
      const resp = await putMetricas(payload)
      toast({ title: "Carga completada", description: resp?.message || `Filas: ${resp?.rows_processed ?? payload.length}` })
    } catch (e: any) {
      toast({ title: "Error al cargar", description: e?.message || "Revisa el CSV", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <Label>CSV (ind_id,territorio_id,anio,mes,valor_num,valor_den)</Label>
        <Input
          ref={fileInput}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </div>
      <Button type="button" variant="secondary" disabled={busy} onClick={() => fileInput.current?.click()}>
        Seleccionar archivo
      </Button>
    </div>
  )
}
