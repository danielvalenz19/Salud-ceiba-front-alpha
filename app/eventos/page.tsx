"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Activity, Users, Clock } from "lucide-react"
import { apiClient, type Evento } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

const CLINICAL_MODULES = [
  { id: "vacunacion", name: "Vacunación", color: "bg-blue-500" },
  { id: "nutricion", name: "Nutrición", color: "bg-green-500" },
  { id: "reproductiva", name: "Salud Reproductiva", color: "bg-pink-500" },
  { id: "epidemiologia", name: "Epidemiología", color: "bg-orange-500" },
]

const SAMPLE_INDICATORS = [
  { id: 1, name: "Vacuna BCG", module: "vacunacion" },
  { id: 2, name: "Vacuna Pentavalente", module: "vacunacion" },
  { id: 3, name: "Peso para la edad", module: "nutricion" },
  { id: 4, name: "Talla para la edad", module: "nutricion" },
  { id: 5, name: "Control prenatal", module: "reproductiva" },
  { id: 6, name: "Planificación familiar", module: "reproductiva" },
  { id: 7, name: "Caso sospechoso dengue", module: "epidemiologia" },
  { id: 8, name: "Caso confirmado COVID-19", module: "epidemiologia" },
]

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModule, setSelectedModule] = useState<string>("all")
  const [selectedIndicator, setSelectedIndicator] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    persona_id: "",
    sector_id: "",
    ind_id: "",
    valor_num: "",
    valor_texto: "",
    lote: "",
    fecha_evento: "",
    responsable_id: "1", // Default to current user
    detalle_json: "",
    module: "vacunacion" as "vacunacion" | "nutricion" | "reproductiva" | "epidemiologia",
  })

  const loadEventos = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 10,
      }

      if (selectedIndicator !== "all") {
        params.ind_id = Number.parseInt(selectedIndicator)
      }

      const response = await apiClient.getEventos(params)
      if (response.data) {
        setEventos(response.data)
        if (response.meta) {
          setTotalPages(Math.ceil(response.meta.total / response.meta.limit))
        }
      }
    } catch (error) {
      console.error("Error loading eventos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos clínicos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventos()
  }, [currentPage, selectedIndicator])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const eventData = {
        persona_id: formData.persona_id ? Number.parseInt(formData.persona_id) : null,
        sector_id: Number.parseInt(formData.sector_id),
        ind_id: Number.parseInt(formData.ind_id),
        valor_num: formData.valor_num ? Number.parseFloat(formData.valor_num) : undefined,
        valor_texto: formData.valor_texto || undefined,
        lote: formData.lote || undefined,
        fecha_evento: formData.fecha_evento,
        responsable_id: Number.parseInt(formData.responsable_id),
        detalle_json: formData.detalle_json ? JSON.parse(formData.detalle_json) : undefined,
      }

      await apiClient.createClinicalEvent(formData.module, eventData)

      toast({
        title: "Evento creado",
        description: "El evento clínico se ha registrado exitosamente",
      })

      setIsCreateDialogOpen(false)
      setFormData({
        persona_id: "",
        sector_id: "",
        ind_id: "",
        valor_num: "",
        valor_texto: "",
        lote: "",
        fecha_evento: "",
        responsable_id: "1",
        detalle_json: "",
        module: "vacunacion",
      })
      loadEventos()
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el evento clínico",
        variant: "destructive",
      })
    }
  }

  const getIndicatorName = (indId: number) => {
    const indicator = SAMPLE_INDICATORS.find((ind) => ind.id === indId)
    return indicator?.name || `Indicador ${indId}`
  }

  const getModuleInfo = (indId: number) => {
    const indicator = SAMPLE_INDICATORS.find((ind) => ind.id === indId)
    if (indicator) {
      const module = CLINICAL_MODULES.find((mod) => mod.id === indicator.module)
      return module
    }
    return CLINICAL_MODULES[0] // Default
  }

  const filteredEventos = eventos.filter((evento) => {
    const matchesSearch =
      searchTerm === "" || getIndicatorName(evento.ind_id).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesModule = selectedModule === "all" || getModuleInfo(evento.ind_id)?.id === selectedModule

    return matchesSearch && matchesModule
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Eventos Clínicos</h1>
          <p className="text-muted-foreground">Gestión de eventos de los módulos clínicos del sistema</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Evento Clínico</DialogTitle>
              <DialogDescription>Registra un nuevo evento en el sistema de salud comunitaria</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="module">Módulo Clínico</Label>
                  <Select
                    value={formData.module}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, module: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLINICAL_MODULES.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ind_id">Indicador</Label>
                  <Select
                    value={formData.ind_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ind_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar indicador" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_INDICATORS.filter((ind) => ind.module === formData.module).map((indicator) => (
                        <SelectItem key={indicator.id} value={indicator.id.toString()}>
                          {indicator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona_id">ID Persona (opcional)</Label>
                  <Input
                    id="persona_id"
                    type="number"
                    placeholder="123"
                    value={formData.persona_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, persona_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector_id">ID Sector</Label>
                  <Input
                    id="sector_id"
                    type="number"
                    placeholder="1"
                    value={formData.sector_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sector_id: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_num">Valor Numérico</Label>
                  <Input
                    id="valor_num"
                    type="number"
                    step="0.01"
                    placeholder="1.5"
                    value={formData.valor_num}
                    onChange={(e) => setFormData((prev) => ({ ...prev, valor_num: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_texto">Valor Texto</Label>
                  <Input
                    id="valor_texto"
                    placeholder="Observaciones"
                    value={formData.valor_texto}
                    onChange={(e) => setFormData((prev) => ({ ...prev, valor_texto: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lote">Lote (opcional)</Label>
                  <Input
                    id="lote"
                    placeholder="LOTE123"
                    value={formData.lote}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lote: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_evento">Fecha del Evento</Label>
                  <Input
                    id="fecha_evento"
                    type="datetime-local"
                    value={formData.fecha_evento}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fecha_evento: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detalle_json">Detalles JSON (opcional)</Label>
                <Textarea
                  id="detalle_json"
                  placeholder='{"temperatura": 36.5, "presion": "120/80"}'
                  value={formData.detalle_json}
                  onChange={(e) => setFormData((prev) => ({ ...prev, detalle_json: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Evento</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {CLINICAL_MODULES.map((module) => (
          <Card key={module.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{module.name}</p>
                  <p className="text-2xl font-bold">
                    {filteredEventos.filter((e) => getModuleInfo(e.ind_id)?.id === module.id).length}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full ${module.color} flex items-center justify-center`}>
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por indicador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {CLINICAL_MODULES.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por indicador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los indicadores</SelectItem>
                {SAMPLE_INDICATORS.map((indicator) => (
                  <SelectItem key={indicator.id} value={indicator.id.toString()}>
                    {indicator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Eventos Registrados
          </CardTitle>
          <CardDescription>Lista de todos los eventos clínicos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Indicador</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Lote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEventos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron eventos clínicos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEventos.map((evento) => {
                      const moduleInfo = getModuleInfo(evento.ind_id)
                      return (
                        <TableRow key={evento.evento_id}>
                          <TableCell>
                            <Badge className={`${moduleInfo?.color} text-white`}>{moduleInfo?.name}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{getIndicatorName(evento.ind_id)}</TableCell>
                          <TableCell>
                            {evento.persona_id ? (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                ID: {evento.persona_id}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Sin persona</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {evento.valor_num !== null && evento.valor_num !== undefined ? (
                              <span className="font-mono">{evento.valor_num}</span>
                            ) : evento.valor_texto ? (
                              <span>{evento.valor_texto}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4" />
                              {new Date(evento.fecha_evento).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {evento.valor_texto && evento.valor_texto.includes("LOTE") ? (
                              <Badge variant="outline">{evento.valor_texto}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
