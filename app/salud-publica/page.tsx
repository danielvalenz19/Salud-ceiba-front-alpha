"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Heart, Leaf, Plus } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface MorbilidadCaso {
  caso_id: number
  causa_id: number
  causa_nombre: string
  territorio_id: number
  territorio_nombre: string
  anio: number
  mes: number
  casos_reportados: number
  fecha_registro: string
}

interface MortalidadRegistro {
  registro_id: number
  causa_id: number
  causa_nombre: string
  territorio_id: number
  anio: number
  mes: number
  defunciones: number
  fecha_registro: string
}

interface AmbienteMetrica {
  metrica_id: number
  tipo_metrica: string
  valor: number
  unidad: string
  territorio_id: number
  fecha_medicion: string
}

const SAMPLE_TERRITORIOS = [
  { territorio_id: 1, nombre: "Región Central" },
  { territorio_id: 2, nombre: "Región Norte" },
  { territorio_id: 3, nombre: "Región Sur" },
  { territorio_id: 4, nombre: "Región Este" },
  { territorio_id: 5, nombre: "Región Oeste" },
]

const SAMPLE_CAUSAS = [
  { causa_id: 1, nombre: "Dengue" },
  { causa_id: 2, nombre: "COVID-19" },
  { causa_id: 3, nombre: "Malaria" },
  { causa_id: 4, nombre: "Tuberculosis" },
  { causa_id: 5, nombre: "Diabetes" },
  { causa_id: 6, nombre: "Hipertensión" },
  { causa_id: 7, nombre: "Enfermedades cardiovasculares" },
  { causa_id: 8, nombre: "Cáncer" },
]

const TIPOS_AMBIENTE = [
  "Calidad del aire",
  "Calidad del agua",
  "Contaminación sonora",
  "Residuos sólidos",
  "Vectores",
  "Saneamiento básico",
]

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export default function SaludPublicaPage() {
  const [morbilidadCasos, setMorbilidadCasos] = useState<MorbilidadCaso[]>([])
  const [mortalidadRegistros, setMortalidadRegistros] = useState<MortalidadRegistro[]>([])
  const [ambienteMetricas, setAmbienteMetricas] = useState<AmbienteMetrica[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("morbilidad")
  const { toast } = useToast()

  // Form states for Morbilidad
  const [morbilidadForm, setMorbilidadForm] = useState({
    causa_id: "0",
    territorio_id: "0",
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    casos_reportados: "",
  })

  // Form states for Mortalidad
  const [mortalidadForm, setMortalidadForm] = useState({
    causa_id: "0",
    territorio_id: "0",
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    defunciones: "",
  })

  // Form states for Ambiente
  const [ambienteForm, setAmbienteForm] = useState({
    territorio_id: "0",
    metricas: "",
  })

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    causa_id: "0",
    territorio_id: "0",
    anio: new Date().getFullYear().toString(),
    mes: "",
  })

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const loadMorbilidadCasos = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (searchFilters.causa_id) params.causa_id = Number.parseInt(searchFilters.causa_id)
      if (searchFilters.territorio_id) params.territorio_id = Number.parseInt(searchFilters.territorio_id)
      if (searchFilters.anio) params.anio = Number.parseInt(searchFilters.anio)
      if (searchFilters.mes) params.mes = Number.parseInt(searchFilters.mes)

      const response = await apiClient.getMorbilidadCasos(params)
      if (response.data) {
        setMorbilidadCasos(response.data)
      }
    } catch (error) {
      console.error("Error loading morbilidad casos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los casos de morbilidad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMorbilidadCaso = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const casoData = {
        causa_id: Number.parseInt(morbilidadForm.causa_id),
        territorio_id: Number.parseInt(morbilidadForm.territorio_id),
        anio: Number.parseInt(morbilidadForm.anio),
        mes: Number.parseInt(morbilidadForm.mes),
        casos_reportados: Number.parseInt(morbilidadForm.casos_reportados),
      }

      await apiClient.createMorbilidadCaso(casoData)

      toast({
        title: "Caso registrado",
        description: "El caso de morbilidad se ha registrado exitosamente",
      })

      setIsCreateDialogOpen(false)
      setMorbilidadForm({
        causa_id: "0",
        territorio_id: "0",
        anio: new Date().getFullYear().toString(),
        mes: (new Date().getMonth() + 1).toString(),
        casos_reportados: "",
      })
      loadMorbilidadCasos()
    } catch (error) {
      console.error("Error creating morbilidad caso:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el caso de morbilidad",
        variant: "destructive",
      })
    }
  }

  const handleCreateMortalidadRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const registroData = {
        causa_id: Number.parseInt(mortalidadForm.causa_id),
        territorio_id: Number.parseInt(mortalidadForm.territorio_id),
        anio: Number.parseInt(mortalidadForm.anio),
        mes: Number.parseInt(mortalidadForm.mes),
        defunciones: Number.parseInt(mortalidadForm.defunciones),
      }

      await apiClient.createMortalidadRegistro(registroData)

      toast({
        title: "Registro creado",
        description: "El registro de mortalidad se ha creado exitosamente",
      })

      setIsCreateDialogOpen(false)
      setMortalidadForm({
        causa_id: "0",
        territorio_id: "0",
        anio: new Date().getFullYear().toString(),
        mes: (new Date().getMonth() + 1).toString(),
        defunciones: "",
      })
    } catch (error) {
      console.error("Error creating mortalidad registro:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el registro de mortalidad",
        variant: "destructive",
      })
    }
  }

  const handleCreateAmbienteMetricas = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const metricas = JSON.parse(ambienteForm.metricas)

      // Validate that it's an array
      if (!Array.isArray(metricas)) {
        throw new Error("Las métricas deben ser un array")
      }

      // Add territorio_id to each metric
      const metricasWithTerritorio = metricas.map((metrica: any) => ({
        ...metrica,
        territorio_id: Number.parseInt(ambienteForm.territorio_id),
      }))

      await apiClient.createAmbienteMetricas(metricasWithTerritorio)

      toast({
        title: "Métricas registradas",
        description: `Se registraron ${metricas.length} métricas ambientales exitosamente`,
      })

      setIsCreateDialogOpen(false)
      setAmbienteForm({
        territorio_id: "0",
        metricas: "",
      })
    } catch (error) {
      console.error("Error creating ambiente metricas:", error)
      toast({
        title: "Error",
        description: "No se pudieron registrar las métricas ambientales. Verifica el formato JSON.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (activeTab === "morbilidad") {
      loadMorbilidadCasos()
    }
  }, [activeTab, searchFilters])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registros Administrativos</h1>
          <p className="text-muted-foreground">Gestión de morbilidad, mortalidad y métricas ambientales</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Casos de Morbilidad</p>
                <p className="text-2xl font-bold">{morbilidadCasos.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registros de Mortalidad</p>
                <p className="text-2xl font-bold">{mortalidadRegistros.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Métricas Ambientales</p>
                <p className="text-2xl font-bold">{ambienteMetricas.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="morbilidad" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Morbilidad
          </TabsTrigger>
          <TabsTrigger value="mortalidad" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Mortalidad
          </TabsTrigger>
          <TabsTrigger value="ambiente" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Ambiente
          </TabsTrigger>
        </TabsList>

        {/* Morbilidad Tab */}
        <TabsContent value="morbilidad" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Casos de Morbilidad</h2>
              <p className="text-muted-foreground">Registro y consulta de casos por causa y territorio</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Caso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Caso de Morbilidad</DialogTitle>
                  <DialogDescription>Ingresa los datos del nuevo caso de morbilidad</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMorbilidadCaso} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="causa_id">Causa</Label>
                      <Select
                        value={morbilidadForm.causa_id}
                        onValueChange={(value) => setMorbilidadForm((prev) => ({ ...prev, causa_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar causa" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_CAUSAS.map((causa) => (
                            <SelectItem key={causa.causa_id} value={causa.causa_id.toString()}>
                              {causa.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="territorio_id">Territorio</Label>
                      <Select
                        value={morbilidadForm.territorio_id}
                        onValueChange={(value) => setMorbilidadForm((prev) => ({ ...prev, territorio_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar territorio" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_TERRITORIOS.map((territorio) => (
                            <SelectItem key={territorio.territorio_id} value={territorio.territorio_id.toString()}>
                              {territorio.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="anio">Año</Label>
                      <Select
                        value={morbilidadForm.anio}
                        onValueChange={(value) => setMorbilidadForm((prev) => ({ ...prev, anio: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mes">Mes</Label>
                      <Select
                        value={morbilidadForm.mes}
                        onValueChange={(value) => setMorbilidadForm((prev) => ({ ...prev, mes: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MESES.map((mes, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {mes}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casos_reportados">Casos Reportados</Label>
                    <Input
                      id="casos_reportados"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={morbilidadForm.casos_reportados}
                      onChange={(e) => setMorbilidadForm((prev) => ({ ...prev, casos_reportados: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Registrar Caso</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Causa</Label>
                  <Select
                    value={searchFilters.causa_id}
                    onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, causa_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las causas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todas las causas</SelectItem>
                      {SAMPLE_CAUSAS.map((causa) => (
                        <SelectItem key={causa.causa_id} value={causa.causa_id.toString()}>
                          {causa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Territorio</Label>
                  <Select
                    value={searchFilters.territorio_id}
                    onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, territorio_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los territorios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos los territorios</SelectItem>
                      {SAMPLE_TERRITORIOS.map((territorio) => (
                        <SelectItem key={territorio.territorio_id} value={territorio.territorio_id.toString()}>
                          {territorio.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Año</Label>
                  <Select
                    value={searchFilters.anio}
                    onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, anio: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Select
                    value={searchFilters.mes}
                    onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, mes: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos los meses</SelectItem>
                      {MESES.map((mes, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Morbilidad Table */}
          <Card>
            <CardHeader>
              <CardTitle>Casos Registrados</CardTitle>
              <CardDescription>Lista de casos de morbilidad por causa y territorio</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Causa</TableHead>
                        <TableHead>Territorio</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Casos</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {morbilidadCasos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No se encontraron casos de morbilidad
                          </TableCell>
                        </TableRow>
                      ) : (
                        morbilidadCasos.map((caso) => (
                          <TableRow key={caso.caso_id}>
                            <TableCell className="font-medium">{caso.causa_nombre}</TableCell>
                            <TableCell>{caso.territorio_nombre}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {MESES[caso.mes - 1]} {caso.anio}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-lg font-bold text-orange-600">
                                {caso.casos_reportados}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(caso.fecha_registro).toLocaleDateString("es-ES")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mortalidad Tab */}
        <TabsContent value="mortalidad" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Registros de Mortalidad</h2>
              <p className="text-muted-foreground">Registro de defunciones por causa y territorio</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Defunción
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Defunción</DialogTitle>
                  <DialogDescription>Ingresa los datos del registro de mortalidad</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMortalidadRegistro} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="causa_id">Causa</Label>
                      <Select
                        value={mortalidadForm.causa_id}
                        onValueChange={(value) => setMortalidadForm((prev) => ({ ...prev, causa_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar causa" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_CAUSAS.map((causa) => (
                            <SelectItem key={causa.causa_id} value={causa.causa_id.toString()}>
                              {causa.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="territorio_id">Territorio</Label>
                      <Select
                        value={mortalidadForm.territorio_id}
                        onValueChange={(value) => setMortalidadForm((prev) => ({ ...prev, territorio_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar territorio" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_TERRITORIOS.map((territorio) => (
                            <SelectItem key={territorio.territorio_id} value={territorio.territorio_id.toString()}>
                              {territorio.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="anio">Año</Label>
                      <Select
                        value={mortalidadForm.anio}
                        onValueChange={(value) => setMortalidadForm((prev) => ({ ...prev, anio: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mes">Mes</Label>
                      <Select
                        value={mortalidadForm.mes}
                        onValueChange={(value) => setMortalidadForm((prev) => ({ ...prev, mes: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MESES.map((mes, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {mes}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defunciones">Número de Defunciones</Label>
                    <Input
                      id="defunciones"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={mortalidadForm.defunciones}
                      onChange={(e) => setMortalidadForm((prev) => ({ ...prev, defunciones: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Registrar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Funcionalidad de mortalidad en desarrollo</p>
              <p className="text-sm text-muted-foreground mt-2">
                Los registros de mortalidad se mostrarán aquí una vez implementados
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambiente Tab */}
        <TabsContent value="ambiente" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Métricas Ambientales</h2>
              <p className="text-muted-foreground">Registro de métricas de calidad ambiental</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Métricas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Métricas Ambientales</DialogTitle>
                  <DialogDescription>Ingresa las métricas ambientales en formato JSON</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAmbienteMetricas} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="territorio_id">Territorio</Label>
                    <Select
                      value={ambienteForm.territorio_id}
                      onValueChange={(value) => setAmbienteForm((prev) => ({ ...prev, territorio_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar territorio" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_TERRITORIOS.map((territorio) => (
                          <SelectItem key={territorio.territorio_id} value={territorio.territorio_id.toString()}>
                            {territorio.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metricas">Métricas (JSON Array)</Label>
                    <Textarea
                      id="metricas"
                      placeholder={`[
  {
    "tipo_metrica": "Calidad del aire",
    "valor": 45.2,
    "unidad": "μg/m³",
    "fecha_medicion": "2024-01-15T10:00:00Z"
  },
  {
    "tipo_metrica": "Calidad del agua",
    "valor": 7.2,
    "unidad": "pH",
    "fecha_medicion": "2024-01-15T10:00:00Z"
  }
]`}
                      value={ambienteForm.metricas}
                      onChange={(e) => setAmbienteForm((prev) => ({ ...prev, metricas: e.target.value }))}
                      rows={10}
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa un array JSON con las métricas. Campos requeridos: tipo_metrica, valor, unidad,
                      fecha_medicion
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Registrar Métricas</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <Leaf className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Funcionalidad de métricas ambientales en desarrollo</p>
              <p className="text-sm text-muted-foreground mt-2">
                Las métricas ambientales se mostrarán aquí una vez implementadas
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
