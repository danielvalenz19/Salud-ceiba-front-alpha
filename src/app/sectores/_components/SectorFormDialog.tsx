"use client"

import { useEffect, useMemo, useState } from "react"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export type SectorFormDialogProps = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (v: boolean) => void
  sectorId?: number
  initialData?: { nombre: string; territorio_id: number; referencia_lat?: number; referencia_lng?: number }
  onSuccess: () => void
}

export function SectorFormDialog({ mode, open, onOpenChange, sectorId, initialData, onSuccess }: SectorFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [territorios, setTerritorios] = useState<Array<{ territorio_id: number; nombre: string }>>([])

  const [nombre, setNombre] = useState(initialData?.nombre ?? "")
  const [territorioId, setTerritorioId] = useState<string>(initialData?.territorio_id ? String(initialData.territorio_id) : "")
  const [lat, setLat] = useState<string>(
    initialData?.referencia_lat !== undefined && initialData?.referencia_lat !== null ? String(initialData.referencia_lat) : ""
  )
  const [lng, setLng] = useState<string>(
    initialData?.referencia_lng !== undefined && initialData?.referencia_lng !== null ? String(initialData.referencia_lng) : ""
  )

  // Reset on id change to avoid stale state between records
  useEffect(() => {
    if (!open) return
    setError(null)
    setNombre(initialData?.nombre ?? "")
    setTerritorioId(initialData?.territorio_id ? String(initialData.territorio_id) : "")
    setLat(
      initialData?.referencia_lat !== undefined && initialData?.referencia_lat !== null ? String(initialData.referencia_lat) : ""
    )
    setLng(
      initialData?.referencia_lng !== undefined && initialData?.referencia_lng !== null ? String(initialData.referencia_lng) : ""
    )
  }, [open, sectorId])

  // Load territorios for create mode (select)
  useEffect(() => {
    if (mode !== "create" || !open) return
    ;(async () => {
      try {
        const resp = await apiClient.getTerritorios()
        setTerritorios(resp.data ?? [])
      } catch (e) {
        // non-blocking
      }
    })()
  }, [mode, open])

  // If editing and no initialData provided, fetch it
  useEffect(() => {
    if (mode !== "edit" || !open || !sectorId || initialData) return
    ;(async () => {
      try {
        setLoading(true)
        const resp = await apiClient.getSectorById(sectorId)
        const d: any = resp.data
        setNombre(d?.nombre ?? "")
        setTerritorioId(d?.territorio_id ? String(d.territorio_id) : "")
        setLat(d?.referencia_lat !== undefined && d?.referencia_lat !== null ? String(d.referencia_lat) : "")
        setLng(d?.referencia_lng !== undefined && d?.referencia_lng !== null ? String(d.referencia_lng) : "")
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el sector")
      } finally {
        setLoading(false)
      }
    })()
  }, [mode, open, sectorId, initialData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!nombre.trim()) throw new Error("El nombre es requerido")

      if (mode === "create") {
        if (!territorioId) throw new Error("El territorio es requerido")
        const payload = {
          territorio_id: Number(territorioId),
          nombre: nombre.trim(),
          referencia_lat: Number(lat),
          referencia_lng: Number(lng),
        }
        if (
          Number.isNaN(payload.referencia_lat) ||
          Number.isNaN(payload.referencia_lng)
        ) {
          throw new Error("Latitud/Longitud inválidas")
        }
        const resp = await apiClient.createSector(payload)
        if ((resp as any)?.error) throw new Error((resp as any).error as string)
        toast({ title: "Sector creado", description: "El sector ha sido creado exitosamente" })
      } else {
        if (!sectorId) throw new Error("ID de sector inválido")
        const body: { nombre?: string; referencia_lat?: number; referencia_lng?: number } = {}
        if (nombre.trim() !== (initialData?.nombre ?? nombre.trim())) body.nombre = nombre.trim()
        // Always send numbers if fields are present (allow zero)
        if (lat !== "") body.referencia_lat = Number(lat)
        if (lng !== "") body.referencia_lng = Number(lng)
        const resp = await apiClient.updateSector(sectorId, body)
        if ((resp as any)?.error) throw new Error((resp as any).error as string)
        toast({ title: "Sector actualizado", description: "Los cambios se guardaron correctamente" })
      }
      onSuccess()
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error
      setError(backendMsg || err?.message || "Error al guardar")
      if (err?.response?.status === 400) {
        toast({ title: "Error de validación", description: backendMsg || "Revisa los datos del formulario", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  const showTerritorio = mode === "create"

  return (
    <DialogContent className="sm:max-w-lg" key={sectorId ?? "new"}>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Crear Sector" : "Editar Sector"}</DialogTitle>
        <DialogDescription>
          {mode === "create" ? "Completa los datos para crear un nuevo sector" : "Actualiza los datos del sector"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showTerritorio && (
          <div className="space-y-2">
            <Label>Territorio</Label>
            <Select value={territorioId} onValueChange={setTerritorioId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un territorio" />
              </SelectTrigger>
              <SelectContent>
                {territorios.map((t) => (
                  <SelectItem key={t.territorio_id} value={String(t.territorio_id)}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Latitud</Label>
            <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required={mode === "create"} />
          </div>
          <div className="space-y-2">
            <Label>Longitud</Label>
            <Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} required={mode === "create"} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>{loading ? (mode === "create" ? "Creando..." : "Guardando...") : (mode === "create" ? "Crear" : "Guardar")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
