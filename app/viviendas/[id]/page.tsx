"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { Home, Users, Edit, Building } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ViviendaDetail {
  vivienda_id: number
  codigo_familia: string
  direccion?: string
  lat?: number
  lng?: number
  personas_count?: number
  sector_id?: number
  // TODO: Add other vivienda fields as needed
}

export default function ViviendaDetailPage() {
  const params = useParams()
  const viviendaId = Number.parseInt(params.id as string)

  const [vivienda, setVivienda] = useState<ViviendaDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadVivienda = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getViviendaById(viviendaId)
      if (response.data) {
        setVivienda(response.data)
      }
    } catch (error) {
      console.error("Vivienda loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar vivienda")
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la vivienda",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (viviendaId) {
      loadVivienda()
    }
  }, [viviendaId])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !vivienda) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información de la vivienda"}</AlertDescription>
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
            {vivienda.sector_id && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/sectores/${vivienda.sector_id}/viviendas`}>Viviendas</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{vivienda.codigo_familia}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <Home className="h-8 w-8 text-primary" />
              <span>Vivienda {vivienda.codigo_familia}</span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary">ID: {vivienda.vivienda_id}</Badge>
              {vivienda.sector_id && <Badge variant="outline">Sector: {vivienda.sector_id}</Badge>}
              <Badge variant="outline">{vivienda.personas_count || 0} personas</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RoleGuard requiredRole={["admin", "coordinador"]}>
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vivienda Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Información de la Vivienda</span>
              </CardTitle>
              <CardDescription>Detalles y ubicación de la vivienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID de Vivienda:</span>
                  <span className="font-medium">{vivienda.vivienda_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código de Familia:</span>
                  <span className="font-medium">{vivienda.codigo_familia}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dirección:</span>
                  <span className="font-medium">{vivienda.direccion || "Sin dirección"}</span>
                </div>
                {vivienda.sector_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sector ID:</span>
                    <span className="font-medium">{vivienda.sector_id}</span>
                  </div>
                )}
                {vivienda.lat && vivienda.lng && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latitud:</span>
                      <span className="font-medium">{vivienda.lat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Longitud:</span>
                      <span className="font-medium">{vivienda.lng}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Estadísticas</span>
              </CardTitle>
              <CardDescription>Información sobre los habitantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{vivienda.personas_count || 0}</div>
                <p className="text-sm text-muted-foreground">Personas Registradas</p>
              </div>
              <Link href={`/viviendas/${vivienda.vivienda_id}/personas`}>
                <Button variant="outline" className="w-full bg-transparent">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Personas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Disponibles</CardTitle>
            <CardDescription>Gestiona las personas y datos de la vivienda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href={`/viviendas/${vivienda.vivienda_id}/personas`}>
                <Button variant="outline" className="w-full h-20 flex-col space-y-2 bg-transparent">
                  <Users className="h-6 w-6" />
                  <span>Gestionar Personas</span>
                </Button>
              </Link>
              {vivienda.sector_id && (
                <Link href={`/sectores/${vivienda.sector_id}`}>
                  <Button variant="outline" className="w-full h-20 flex-col space-y-2 bg-transparent">
                    <Building className="h-6 w-6" />
                    <span>Ver Sector</span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {vivienda && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <EditViviendaDialog
              vivienda={vivienda}
              onClose={() => setIsEditDialogOpen(false)}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                loadVivienda()
              }}
            />
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}

function EditViviendaDialog({
  vivienda,
  onClose,
  onSuccess,
}: {
  vivienda: ViviendaDetail
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    codigo_familia: vivienda.codigo_familia,
    direccion: vivienda.direccion || "",
    lat: vivienda.lat?.toString() || "",
    lng: vivienda.lng?.toString() || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    // Validations
    if (!formData.codigo_familia.trim()) {
      setError("El código de familia es requerido")
      setIsSubmitting(false)
      return
    }

    if (formData.lat && formData.lng) {
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
      const updateData: any = {
        codigo_familia: formData.codigo_familia.trim(),
        direccion: formData.direccion.trim() || null,
      }

      if (formData.lat && formData.lng) {
        updateData.lat = Number.parseFloat(formData.lat)
        updateData.lng = Number.parseFloat(formData.lng)
      }

      await apiClient.updateVivienda(vivienda.vivienda_id, updateData)

      toast({
        title: "Vivienda actualizada",
        description: "La vivienda ha sido actualizada exitosamente",
      })
      onSuccess()
    } catch (error) {
      console.error("Vivienda update error:", error)
      setError(error instanceof Error ? error.message : "Error al actualizar vivienda")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Editar Vivienda</DialogTitle>
        <DialogDescription>Modifica la información de la vivienda</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-codigo">Código de Familia *</Label>
          <Input
            id="edit-codigo"
            value={formData.codigo_familia}
            onChange={(e) => setFormData({ ...formData, codigo_familia: e.target.value })}
            placeholder="Código único de la familia"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-direccion">Dirección</Label>
          <Input
            id="edit-direccion"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Dirección de la vivienda"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-lat">Latitud</Label>
            <Input
              id="edit-lat"
              type="number"
              step="any"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              placeholder="-90 a 90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lng">Longitud</Label>
            <Input
              id="edit-lng"
              type="number"
              step="any"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              placeholder="-180 a 180"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Actualizar Vivienda"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
