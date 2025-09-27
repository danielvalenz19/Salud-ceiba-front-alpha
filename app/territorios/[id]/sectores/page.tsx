"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { RoleGuard } from "@/components/auth/role-guard"
import { AdminOnly } from "@/components/auth/admin-only"
import { Building, Plus, MapPin, Home, ChevronRight, Edit, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Sector {
  sector_id: number
  nombre: string
  territorio_id: number
  // TODO: Add other sector fields as needed
}

interface TerritorioWithSectores {
  territorio_id: number
  codigo: string
  nombre: string
  sectores: Sector[]
}

export default function TerritorioSectoresPage() {
  const params = useParams()
  const router = useRouter()
  const territorioId = Number.parseInt(params.id as string)

  const [territorioData, setTerritorioData] = useState<TerritorioWithSectores | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadTerritorioSectores = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getTerritorioSectores(territorioId, true)
      if (response.data) {
        setTerritorioData(response.data)
      }
    } catch (error) {
      console.error("Territorio sectores loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar sectores del territorio")
      toast({
        title: "Error",
        description: "No se pudieron cargar los sectores del territorio",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (territorioId) {
      loadTerritorioSectores()
    }
  }, [territorioId])

  const handleDeleteSector = async (sectorId: number) => {
    if (
      !confirm("¿Estás seguro de que deseas eliminar este sector? Esta acción puede fallar si hay viviendas activas.")
    ) {
      return
    }

    try {
      await apiClient.deleteSector(sectorId)
      toast({
        title: "Sector eliminado",
        description: "El sector ha sido eliminado exitosamente",
      })
      loadTerritorioSectores() // Reload the list
    } catch (error) {
      console.error("Sector deletion error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar sector",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !territorioData) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información del territorio"}</AlertDescription>
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
                <Link href="/territorios">Territorios</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{territorioData.nombre}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sectores de {territorioData.nombre}</h1>
            <p className="text-muted-foreground">
              Código: {territorioData.codigo} | ID: {territorioData.territorio_id}
            </p>
          </div>
          <RoleGuard
            requiredRole={["admin", "coordinador"]}
            fallback={
              <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                Solo administradores y coordinadores pueden crear sectores
              </div>
            }
            showFallback={true}
          >
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Sector
                </Button>
              </DialogTrigger>
              <CreateSectorDialog
                territorioId={territorioId}
                onClose={() => setIsCreateDialogOpen(false)}
                onSuccess={() => {
                  setIsCreateDialogOpen(false)
                  loadTerritorioSectores()
                }}
              />
            </Dialog>
          </RoleGuard>
        </div>

        {/* Sectores Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {territorioData.sectores.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay sectores configurados</h3>
              <p className="text-muted-foreground mb-4">Crea el primer sector para este territorio</p>
              <RoleGuard requiredRole={["admin", "coordinador"]}>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Sector
                </Button>
              </RoleGuard>
            </div>
          ) : (
            territorioData.sectores.map((sector) => (
              <Card key={sector.sector_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-primary" />
                      <span>{sector.nombre}</span>
                    </CardTitle>
                    <Badge variant="secondary">ID: {sector.sector_id}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Link href={`/sectores/${sector.sector_id}`}>
                        <Button variant="outline" className="w-full justify-between bg-transparent">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>Ver Detalles</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href={`/sectores/${sector.sector_id}/viviendas`}>
                        <Button variant="outline" className="w-full justify-between bg-transparent">
                          <div className="flex items-center space-x-2">
                            <Home className="h-4 w-4" />
                            <span>Ver Viviendas</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>

                      <div className="flex space-x-2">
                        <RoleGuard requiredRole={["admin", "coordinador"]}>
                          <Button variant="ghost" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </RoleGuard>
                        <AdminOnly>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSector(sector.sector_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </AdminOnly>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {territorioData.sectores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Territorio</CardTitle>
              <CardDescription>Estadísticas de sectores y configuración</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{territorioData.sectores.length}</div>
                  <p className="text-sm text-muted-foreground">Sectores Configurados</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">-</div>
                  <p className="text-sm text-muted-foreground">Total Viviendas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">-</div>
                  <p className="text-sm text-muted-foreground">Total Personas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

// Create Sector Dialog Component
function CreateSectorDialog({
  territorioId,
  onClose,
  onSuccess,
}: {
  territorioId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    geom: "", // TODO: confirm exact payload in current backend (might use referencia_lat/referencia_lng instead of geom)
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!formData.nombre.trim()) {
      setError("El nombre del sector es requerido")
      setIsSubmitting(false)
      return
    }

    try {
      const sectorData = {
        territorio_id: territorioId,
        nombre: formData.nombre.trim(),
        geom: formData.geom || null, // TODO: confirm exact payload in current backend
      }

      await apiClient.createSector(sectorData)

      toast({
        title: "Sector creado",
        description: "El sector ha sido creado exitosamente",
      })
      onSuccess()
    } catch (error) {
      console.error("Sector creation error:", error)
      setError(error instanceof Error ? error.message : "Error al crear sector")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Crear Nuevo Sector</DialogTitle>
        <DialogDescription>Completa la información para crear un nuevo sector en este territorio</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Sector *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Sector Central"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="geom">Geometría (opcional)</Label>
          <Input
            id="geom"
            value={formData.geom}
            onChange={(e) => setFormData({ ...formData, geom: e.target.value })}
            placeholder="Datos geométricos del sector"
          />
          <p className="text-xs text-muted-foreground">TODO: confirmar payload exacto en el backend actual</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Sector"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
