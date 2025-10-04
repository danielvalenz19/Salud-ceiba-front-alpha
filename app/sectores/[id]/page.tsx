"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
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
import { Building, Home, Edit, Trash2, MapPin, BarChart3 } from "lucide-react"
import { SectorFormDialog } from "@/app/sectores/_components/SectorFormDialog"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SectorDetail {
  sector_id: number
  nombre: string
  territorio_id: number
  geom?: any
  referencia_lat?: number
  referencia_lng?: number
  // TODO: Add other sector fields and statistics as needed
}

export default function SectorDetailPage() {
  const params = useParams()
  const sectorId = Number.parseInt(params.id as string)
  const search = useSearchParams()

  const [sector, setSector] = useState<SectorDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadSector = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getSectorById(sectorId)
      if (response.data) {
        setSector(response.data as SectorDetail)
      }
    } catch (error) {
      console.error("Sector loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar sector")
      toast({
        title: "Error",
        description: "No se pudo cargar la información del sector",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (sectorId) {
      loadSector()
    }
  }, [sectorId])

  // Abrir modal si venimos con ?edit=1
  useEffect(() => {
    try {
      if (search?.get("edit") === "1") {
        setIsEditDialogOpen(true)
      }
    } catch (e) {
      // ignore if search params not available in some render modes
    }
  }, [search])

  const handleDeleteSector = async () => {
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
      // Navigate back to sectors list
      window.location.href = "/sectores"
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
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !sector) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información del sector"}</AlertDescription>
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
              <BreadcrumbPage>{sector.nombre}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <Building className="h-8 w-8 text-primary" />
              <span>{sector.nombre}</span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary">ID: {sector.sector_id}</Badge>
              <Badge variant="outline">Territorio ID: {sector.territorio_id}</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RoleGuard requiredRole={["admin", "coordinador"]}>
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </RoleGuard>
            <RoleGuard requiredRole={["admin"]}>
              <Button variant="destructive" onClick={handleDeleteSector}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sector Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Información del Sector</span>
              </CardTitle>
              <CardDescription>Detalles y configuración del sector</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID del Sector:</span>
                  <span className="font-medium">{sector.sector_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="font-medium">{sector.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Territorio ID:</span>
                  <span className="font-medium">{sector.territorio_id}</span>
                </div>
                {sector.referencia_lat !== undefined && sector.referencia_lat !== null &&
                  sector.referencia_lng !== undefined && sector.referencia_lng !== null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latitud:</span>
                      <span className="font-medium">{sector.referencia_lat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Longitud:</span>
                      <span className="font-medium">{sector.referencia_lng}</span>
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
                <BarChart3 className="h-5 w-5" />
                <span>Estadísticas</span>
              </CardTitle>
              <CardDescription>Métricas y datos del sector</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">-</div>
                  <p className="text-sm text-muted-foreground">Total Viviendas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">-</div>
                  <p className="text-sm text-muted-foreground">Total Personas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">-</div>
                  <p className="text-sm text-muted-foreground">Eventos Registrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Disponibles</CardTitle>
            <CardDescription>Gestiona las viviendas y datos del sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href={`/sectores/${sector.sector_id}/viviendas`}>
                <Button variant="outline" className="w-full h-20 flex-col space-y-2 bg-transparent">
                  <Home className="h-6 w-6" />
                  <span>Gestionar Viviendas</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-20 flex-col space-y-2 bg-transparent">
                <BarChart3 className="h-6 w-6" />
                <span>Ver Métricas</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {sector && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <SectorFormDialog
              key={sector.sector_id}
              mode="edit"
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              sectorId={sector.sector_id}
              initialData={{
                nombre: sector.nombre,
                territorio_id: sector.territorio_id,
                referencia_lat: sector.referencia_lat,
                referencia_lng: sector.referencia_lng,
              }}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                loadSector()
              }}
            />
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}

// Removed old inline EditSectorDialog in favor of reusable SectorFormDialog
