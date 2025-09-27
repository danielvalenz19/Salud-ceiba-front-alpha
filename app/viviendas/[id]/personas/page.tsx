"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Users, Plus, Eye, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient, type PersonaBasic } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ViviendaPersonas {
  meta: {
    page: number
    limit: number
    total: number
  }
  data: PersonaBasic[]
  vivienda: {
    vivienda_id: number
    codigo_familia: string
  }
}

export default function ViviendaPersonasPage() {
  const params = useParams()
  const viviendaId = Number.parseInt(params.id as string)

  const [personasData, setPersonasData] = useState<ViviendaPersonas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  const pageSize = 20

  const loadPersonas = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getViviendaPersonas(viviendaId, {
        page: currentPage,
        limit: pageSize,
      })

      if (response.data) {
        setPersonasData(response.data)
      }
    } catch (error) {
      console.error("Personas loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar personas")
      toast({
        title: "Error",
        description: "No se pudieron cargar las personas de la vivienda",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (viviendaId) {
      loadPersonas()
    }
  }, [viviendaId, currentPage])

  const totalPages = personasData ? Math.ceil(personasData.meta.total / pageSize) : 1

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

  if (error || !personasData) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información de las personas"}</AlertDescription>
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
                <Link href="/viviendas">Viviendas</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/viviendas/${viviendaId}`}>{personasData.vivienda.codigo_familia}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Personas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Personas de la Vivienda</h1>
            <p className="text-muted-foreground">
              {personasData.vivienda.codigo_familia} | Total: {personasData.meta.total} personas
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Persona
              </Button>
            </DialogTrigger>
            <CreatePersonaDialog
              viviendaId={viviendaId}
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                loadPersonas()
              }}
            />
          </Dialog>
        </div>

        {/* Personas Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Personas</CardTitle>
            <CardDescription>Personas registradas en esta vivienda</CardDescription>
          </CardHeader>
          <CardContent>
            {personasData.data.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hay personas registradas</h3>
                <p className="text-muted-foreground mb-4">Agrega la primera persona a esta vivienda</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Persona
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombres</TableHead>
                      <TableHead>Apellidos</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>DPI</TableHead>
                      <TableHead>Fecha Nacimiento</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personasData.data.map((persona) => (
                      <TableRow key={persona.persona_id}>
                        <TableCell>
                          <Badge variant="secondary">{persona.persona_id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{persona.nombres}</TableCell>
                        <TableCell>{persona.apellidos}</TableCell>
                        <TableCell>
                          <Badge variant={persona.sexo === "M" ? "default" : "outline"}>
                            {persona.sexo === "M" ? "Masculino" : "Femenino"}
                          </Badge>
                        </TableCell>
                        <TableCell>{persona.dpi || "Sin DPI"}</TableCell>
                        <TableCell>
                          {persona.fecha_nac ? new Date(persona.fecha_nac).toLocaleDateString("es-ES") : "Sin fecha"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/personas/${persona.persona_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
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
                      Página {currentPage} de {totalPages} ({personasData.meta.total} personas total)
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

// Create Persona Dialog Component
function CreatePersonaDialog({
  viviendaId,
  onClose,
  onSuccess,
}: {
  viviendaId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    sexo: "" as "M" | "F" | "",
    fecha_nac: "",
    dpi: "",
    idioma: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.sexo) {
      setError("Nombres, apellidos y sexo son requeridos")
      setIsSubmitting(false)
      return
    }

    try {
      const personaData: any = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        sexo: formData.sexo,
        fecha_nac: formData.fecha_nac || undefined,
        dpi: formData.dpi.trim() || undefined,
        idioma: formData.idioma.trim() || undefined,
      }

      await apiClient.createPersonaInVivienda(viviendaId, personaData)

      toast({
        title: "Persona agregada",
        description: "La persona ha sido agregada exitosamente a la vivienda",
      })
      onSuccess()
    } catch (error) {
      console.error("Persona creation error:", error)
      setError(error instanceof Error ? error.message : "Error al agregar persona")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Agregar Nueva Persona</DialogTitle>
        <DialogDescription>Completa la información para agregar una persona a esta vivienda</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="nombres">Nombres *</Label>
          <Input
            id="nombres"
            value={formData.nombres}
            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
            placeholder="Ej: Juan Carlos"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input
            id="apellidos"
            value={formData.apellidos}
            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
            placeholder="Ej: García López"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo *</Label>
          <Select value={formData.sexo} onValueChange={(value: "M" | "F") => setFormData({ ...formData, sexo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Femenino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_nac">Fecha de Nacimiento (opcional)</Label>
          <Input
            id="fecha_nac"
            type="date"
            value={formData.fecha_nac}
            onChange={(e) => setFormData({ ...formData, fecha_nac: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dpi">DPI (opcional)</Label>
          <Input
            id="dpi"
            value={formData.dpi}
            onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
            placeholder="Ej: 1234567890101"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idioma">Idioma (opcional)</Label>
          <Input
            id="idioma"
            value={formData.idioma}
            onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
            placeholder="Ej: Español, Q'eqchi'"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Agregando..." : "Agregar Persona"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
