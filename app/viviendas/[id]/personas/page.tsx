"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Inputs moved into reusable PersonaForm
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
import PersonaForm, { type PersonaFormValues } from "@/components/personas/PersonaForm"
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<PersonaFormValues | null>(null)
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

      // Normalize response shapes robustly to support:
      // - axios-like: { data: { meta, data, vivienda } }
      // - raw controller: { meta, data, vivienda }
      // - model intermediate: { total, rows }
      // - plain array: [ ... ]
      const payload = response && typeof response === "object" && "data" in response ? (response as any).data : response

      const isArray = Array.isArray(payload)

      const data: any[] = isArray ? payload : payload?.data ?? payload?.rows ?? []

      const meta =
        payload?.meta ??
        (payload?.total !== undefined
          ? { page: currentPage, limit: pageSize, total: Number(payload.total) }
          : { page: currentPage, limit: pageSize, total: data.length })

      const vivienda = payload?.vivienda ?? { vivienda_id: viviendaId, codigo_familia: "" }

      setPersonasData({ meta, data, vivienda })
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

  const totalPages = personasData
    ? Math.ceil(((personasData.meta && personasData.meta.total) ?? personasData.data.length) / pageSize)
    : 1

  async function openEdit(personaId: number) {
    try {
      const resp = await apiClient.getPersonaById(personaId)
      const p = resp.data
      if (!p) return
      setEditingId(personaId)
      setEditingData({
        nombres: p.nombres,
        apellidos: p.apellidos,
        sexo: p.sexo as 'M' | 'F',
        fecha_nac: p.fecha_nac ?? '',
        dpi: (p as any).dpi ?? '',
        idioma: (p as any).idioma ?? '',
      })
      setIsEditDialogOpen(true)
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo cargar la persona para edición', variant: 'destructive' })
    }
  }

  async function handleUpdate(values: PersonaFormValues) {
    if (!editingId) return
    try {
      await apiClient.updatePersona(editingId, {
        nombres: values.nombres,
        apellidos: values.apellidos,
        sexo: values.sexo,
        fecha_nac: values.fecha_nac,
        dpi: values.dpi,
        idioma: values.idioma,
      } as any)
      setIsEditDialogOpen(false)
      setEditingId(null)
      setEditingData(null)
      await loadPersonas()
      toast({ title: 'Cambios guardados', description: 'La persona fue actualizada correctamente.' })
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo actualizar la persona', variant: 'destructive' })
    }
  }

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
                            <Button variant="ghost" size="sm" onClick={() => openEdit(persona.persona_id)} title="Editar persona">
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

        {/* Edit Persona Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent key={editingId ?? undefined} className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Persona</DialogTitle>
            </DialogHeader>
            {editingData && (
              <PersonaForm mode="edit" initial={editingData} onSubmit={handleUpdate} />
            )}
          </DialogContent>
        </Dialog>
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
  const { toast } = useToast()

  async function handleCreate(values: PersonaFormValues) {
    try {
      await apiClient.createPersonaInVivienda(viviendaId, {
        nombres: values.nombres,
        apellidos: values.apellidos,
        sexo: values.sexo,
        fecha_nac: values.fecha_nac,
        dpi: values.dpi,
        idioma: values.idioma,
      } as any)
      toast({ title: 'Persona agregada', description: 'La persona ha sido agregada exitosamente a la vivienda' })
      onSuccess()
    } catch (error) {
      console.error('Persona creation error:', error)
      toast({ title: 'Error', description: 'No se pudo agregar la persona', variant: 'destructive' })
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Agregar Nueva Persona</DialogTitle>
        <DialogDescription>Completa la información para agregar una persona a esta vivienda</DialogDescription>
      </DialogHeader>
      <PersonaForm mode="create" onSubmit={handleCreate} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
