"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MainLayout } from "@/components/layout/main-layout"
import { User, Edit, Calendar, FileText } from "lucide-react"
import { apiClient, type PersonaDetail } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function PersonaDetailPage() {
  const params = useParams()
  const personaId = Number.parseInt(params.id as string)

  const [persona, setPersona] = useState<PersonaDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const loadPersona = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getPersonaById(personaId)
      if (response.data) {
        setPersona(response.data)
      }
    } catch (error) {
      console.error("Persona loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar persona")
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la persona",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (personaId) {
      loadPersona()
    }
  }, [personaId])

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

  if (error || !persona) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información de la persona"}</AlertDescription>
        </Alert>
      </MainLayout>
    )
  }

  const calculateAge = (fechaNac: string) => {
    const today = new Date()
    const birthDate = new Date(fechaNac)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/personas">Personas</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {persona.nombres} {persona.apellidos}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <User className="h-8 w-8 text-primary" />
              <span>
                {persona.nombres} {persona.apellidos}
              </span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary">ID: {persona.persona_id}</Badge>
              <Badge variant={persona.sexo === "M" ? "default" : "outline"}>
                {persona.sexo === "M" ? "Masculino" : "Femenino"}
              </Badge>
              {persona.fecha_nac && <Badge variant="outline">{calculateAge(persona.fecha_nac)} años</Badge>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información Personal</span>
              </CardTitle>
              <CardDescription>Datos demográficos de la persona</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID de Persona:</span>
                  <span className="font-medium">{persona.persona_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombres:</span>
                  <span className="font-medium">{persona.nombres}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apellidos:</span>
                  <span className="font-medium">{persona.apellidos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sexo:</span>
                  <span className="font-medium">{persona.sexo === "M" ? "Masculino" : "Femenino"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DPI:</span>
                  <span className="font-medium">{persona.dpi || "Sin DPI"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de Nacimiento:</span>
                  <span className="font-medium">
                    {persona.fecha_nac ? new Date(persona.fecha_nac).toLocaleDateString("es-ES") : "Sin fecha"}
                  </span>
                </div>
                {persona.fecha_nac && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edad:</span>
                    <span className="font-medium">{calculateAge(persona.fecha_nac)} años</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Estadísticas</span>
              </CardTitle>
              <CardDescription>Resumen de eventos y registros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{persona.historial?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Registros en Historial</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">-</div>
                <p className="text-sm text-muted-foreground">Eventos Clínicos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial */}
        {persona.historial && persona.historial.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Historial</span>
              </CardTitle>
              <CardDescription>Registros históricos de la persona</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                TODO: especificar estructura exacta si se requiere visualización avanzada
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registro</TableHead>
                    <TableHead>Información</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {persona.historial.map((registro, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </TableCell>
                      <TableCell>
                        <pre className="text-xs text-muted-foreground">{JSON.stringify(registro, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Disponibles</CardTitle>
            <CardDescription>Gestiona los datos y eventos de la persona</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <Edit className="h-6 w-6" />
                <span>Editar Datos</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <Calendar className="h-6 w-6" />
                <span>Ver Eventos</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <FileText className="h-6 w-6" />
                <span>Generar Reporte</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
