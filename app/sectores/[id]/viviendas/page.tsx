"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MainLayout } from "@/components/layout/main-layout"
import { Home, Plus, Users, Eye, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Vivienda {
  vivienda_id: number
  codigo_familia: string
  direccion?: string
  lat?: number
  lng?: number
  personas_count?: number
}

interface SectorViviendas {
  meta: {
    page: number
    limit: number
    total: number
  }
  data: Vivienda[]
  sector: {
    sector_id: number
    nombre?: string
  }
}

export default function SectorViviendasPage() {
  const params = useParams()
  const sectorId = Number.parseInt(params.id as string)

  const [viviendasData, setViviendasData] = useState<SectorViviendas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [gpsOnly, setGpsOnly] = useState(false)
  const { toast } = useToast()

  const pageSize = 20

  const loadViviendas = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getSectorViviendas(sectorId, {
        withGPS: gpsOnly,
        page: currentPage,
        limit: pageSize,
      })

      // Normalize response shapes:
      // - axios-like: { data: { meta, data, sector } }
      // - raw controller: { meta, data, sector }
      // - model intermediate: { total, rows }
      const payload = response && typeof response === "object" && "data" in response ? (response as any).data : response

      const meta =
        payload?.meta ?? {
          page: currentPage,
          limit: pageSize,
          total:
            payload?.total ?? (Array.isArray(payload?.data) ? payload.data.length : payload?.rows?.length ?? 0),
        }

      const data = payload?.data ?? payload?.rows ?? []
      const sector = payload?.sector ?? { sector_id: sectorId }

      setViviendasData({ meta, data, sector })
    } catch (error) {
      console.error("Viviendas loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar viviendas")
      toast({
        title: "Error",
        description: "No se pudieron cargar las viviendas del sector",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (sectorId) {
      loadViviendas()
    }
  }, [sectorId, currentPage, gpsOnly])

  const total = viviendasData?.meta?.total ?? viviendasData?.data?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !viviendasData) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información de las viviendas"}</AlertDescription>
        </Alert>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/sectores">Sectores</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/sectores/${sectorId}`}>Sector {sectorId}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Viviendas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Viviendas del Sector</h1>
            <p className="text-muted-foreground">
              Sector ID: {viviendasData?.sector?.sector_id ?? sectorId} | Total: {viviendasData?.meta?.total ?? 0} viviendas
            </p>
            <div className="mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={gpsOnly}
                  onChange={(e) => {
                    setGpsOnly(e.target.checked)
                    setCurrentPage(1)
                  }}
                />
                <span className="text-muted-foreground">Solo con coordenadas (para mapa)</span>
              </label>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Vivienda
              </Button>
            </DialogTrigger>
            <CreateViviendaDialog
              sectorId={sectorId}
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                loadViviendas()
              }}
            />
          </Dialog>
        </div>

        {/* Viviendas Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Viviendas</CardTitle>
            <CardDescription>Viviendas registradas en este sector</CardDescription>
          </CardHeader>
          <CardContent>
            {(viviendasData?.data?.length ?? 0) === 0 ? (
              <div className="text-center py-12">
                <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {gpsOnly ? (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay viviendas con coordenadas</h3>
                    <p className="text-muted-foreground mb-4">Quita el filtro "Solo con coordenadas" para ver todas las viviendas.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay viviendas registradas</h3>
                    <p className="text-muted-foreground mb-4">Crea la primera vivienda para este sector</p>
                  </>
                )}
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Vivienda
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Código Familia</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Coordenadas</TableHead>
                      <TableHead>Personas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viviendasData?.data ?? []).map((vivienda) => (
                      <TableRow key={vivienda.vivienda_id}>
                        <TableCell>
                          <Badge variant="secondary">{vivienda.vivienda_id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{vivienda.codigo_familia}</TableCell>
                        <TableCell>{vivienda.direccion || "Sin dirección"}</TableCell>
                        <TableCell>
                          {vivienda.lat && vivienda.lng ? (
                            <div className="text-sm">
                              <div>Lat: {vivienda.lat}</div>
                              <div>Lng: {vivienda.lng}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin coordenadas</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vivienda.personas_count || 0} personas</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/viviendas/${vivienda.vivienda_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Link href={`/viviendas/${vivienda.vivienda_id}/personas`}>
                              <Button variant="ghost" size="sm">
                                <Users className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      P gina {currentPage} de {totalPages} ({total} viviendas total)
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

// Create Vivienda Dialog Component
function CreateViviendaDialog({
  sectorId,
  onClose,
  onSuccess,
}: {
  sectorId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    codigo_familia: "",
    direccion: "",
    lat: "",
    lng: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    // Enhanced validations according to specification
    if (!formData.codigo_familia.trim()) {
      setError("El código de familia es requerido")
      setIsSubmitting(false)
      return
    }

    // Validate coordinates if provided
    if (formData.lat && !formData.lng) {
      setError("Si proporciona latitud, también debe proporcionar longitud")
      setIsSubmitting(false)
      return
    }

    if (formData.lng && !formData.lat) {
      setError("Si proporciona longitud, también debe proporcionar latitud")
      setIsSubmitting(false)
      return
    }

    if (formData.lat || formData.lng) {
      const lat = Number.parseFloat(formData.lat)
      const lng = Number.parseFloat(formData.lng)

      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError("La latitud debe ser un número válido entre -90 y 90")
        setIsSubmitting(false)
        return
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError("La longitud debe ser un número válido entre -180 y 180")
        setIsSubmitting(false)
        return
      }
    }

    try {
      const viviendaData: any = {
        sector_id: sectorId,
        codigo_familia: formData.codigo_familia.trim(),
      }

      if (formData.direccion.trim()) {
        viviendaData.direccion = formData.direccion.trim()
      }

      if (formData.lat && formData.lng) {
        viviendaData.lat = Number.parseFloat(formData.lat)
        viviendaData.lng = Number.parseFloat(formData.lng)
      }

      await apiClient.createVivienda(viviendaData)

      toast({
        title: "Vivienda creada",
        description: "La vivienda ha sido creada exitosamente",
      })
      onSuccess()
    } catch (error) {
      console.error("Vivienda creation error:", error)
      setError(error instanceof Error ? error.message : "Error al crear vivienda")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Crear Nueva Vivienda</DialogTitle>
        <DialogDescription>Completa la información para crear una nueva vivienda en este sector</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="codigo_familia">Código de Familia *</Label>
          <Input
            id="codigo_familia"
            value={formData.codigo_familia}
            onChange={(e) => setFormData({ ...formData, codigo_familia: e.target.value })}
            placeholder="Ej: FAM001"
            required
          />
          <p className="text-sm text-muted-foreground">Código único para identificar la familia</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección (opcional)</Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Ej: Calle Principal #123"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitud (opcional)</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              placeholder="14.123456"
              min="-90"
              max="90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitud (opcional)</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              placeholder="-87.123456"
              min="-180"
              max="180"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Las coordenadas GPS son opcionales. Si proporciona una, debe proporcionar ambas.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Vivienda"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
