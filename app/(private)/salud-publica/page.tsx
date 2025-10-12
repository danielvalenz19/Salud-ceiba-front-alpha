"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
import CausaSelect from "@/components/morbilidad/CausaSelect"
import {
  fetchTerritorios,
  getMorbilidadCasos,
  type MorbilidadRow,
  getMortalidadRegistros,
  type MortalidadAggRow,
  type MortalidadDetalleRow,
  createMortalidadRegistro,
  upsertAmbienteMetricas,
} from "@/src/services/adminRegs"
import { crearMorbilidad } from "@/src/services/morbilidad"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useCausas } from "@/hooks/useCausas"
import { mesToNumber, toNumberOrNull } from "@/src/utils/fechas"

const toNum = (v: any) => (v === undefined || v === null || v === "" ? undefined : Number(v))
type Territorio = { territorio_id: number; nombre: string }

type GrupoEdad = "0-<1" | "1-4" | "5-14" | "15+"

const getCausaDisplay = (
  row: { causa_nombre?: string | null; causa_id?: number | null } & Record<string, unknown>
) => {
  const raw = row && typeof row === "object" ? row["causa"] : undefined
  if (typeof raw === "string" && raw.trim()) return raw
  if (row.causa_nombre && row.causa_nombre.trim()) return row.causa_nombre
  return row.causa_id != null ? `#${row.causa_id}` : "Sin causa"
}

type MorbilidadFormState = {
  causa_id: number | null
  territorio_id: string
  anio: string
  mes: string
  cantidad: string
}

type MortalidadFormState = {
  causa_id: number | null
  territorio_id: string
  fecha_defuncion: string
  lugar_defuncion: string
  certificador_id: string
}

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
  // catálogos
  const [authToken, setAuthToken] = useState<string | undefined>(undefined)
  const { causas, loading: causasLoading, error: causasError } = useCausas(authToken)
  const causaOptions = useMemo(() => causas.map((c) => ({ id: String(c.id), label: c.label })), [causas])
  const [territorios, setTerritorios] = useState<Territorio[]>([])

  // Morbilidad
  const [morRows, setMorRows] = useState<MorbilidadRow[]>([])
  const [morLoading, setMorLoading] = useState(false)
  const [grupoEdad, setGrupoEdad] = useState<GrupoEdad>("15+")

  // Mortalidad
  const [modoMort, setModoMort] = useState<"agregado" | "detalle">("agregado")
  const [mortAggRows, setMortAggRows] = useState<MortalidadAggRow[]>([])
  const [mortDetRows, setMortDetRows] = useState<MortalidadDetalleRow[]>([])
  const [mortLoading, setMortLoading] = useState(false)

  // Ambiente (placeholder contador)
  const [ambienteCount, setAmbienteCount] = useState(0)

  const [activeTab, setActiveTab] = useState("morbilidad")
  const { toast } = useToast()

  // Form states for Morbilidad
  const [morbilidadForm, setMorbilidadForm] = useState<MorbilidadFormState>({
    causa_id: null,
    territorio_id: "",
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    cantidad: "",
  })

  // Form states for Mortalidad (detalle requerido por backend)
  const [mortalidadForm, setMortalidadForm] = useState<MortalidadFormState>({
    causa_id: null,
    territorio_id: "",
    fecha_defuncion: "",
    lugar_defuncion: "",
    certificador_id: "",
  })

  // Form states for Ambiente
  const [ambienteForm, setAmbienteForm] = useState({
    territorio_id: "",
    metricas: "",
  })

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    causa_id: "",
    territorio_id: "",
    anio: new Date().getFullYear().toString(),
    mes: "",
  })

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  // catálogos iniciales
  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("accessToken") ?? undefined
    setAuthToken(token)
  }, [isAuthenticated])

  useEffect(() => {
    let active = true
    fetchTerritorios()
      .then((data) => {
        if (active) setTerritorios(data)
      })
      .catch((error) => {
        console.error("Error obteniendo territorios", error)
        if (active) {
          toast({
            title: "Catálogo no disponible",
            description: "No se pudieron cargar los territorios.",
            variant: "destructive",
          })
        }
      })

    return () => {
      active = false
    }
  }, [toast])

  useEffect(() => {
    if (!causasError) return
    toast({
      title: "Catálogo no disponible",
      description: "No se pudieron cargar las causas. Verifica tu sesión o la configuración del API.",
      variant: "destructive",
    })
  }, [causasError, toast])

  const cargarMorbilidad = async () => {
    try {
      setMorLoading(true)
      const data = await getMorbilidadCasos({
        causa_id: toNum(searchFilters.causa_id),
        territorio_id: toNum(searchFilters.territorio_id),
        anio: toNum(searchFilters.anio),
        mes: toNum(searchFilters.mes),
      })
      setMorRows(data)
    } catch (error) {
      console.error("Error loading morbilidad casos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los casos de morbilidad",
        variant: "destructive",
      })
    } finally {
      setMorLoading(false)
    }
  }


  const handleCreateMorbilidadCaso = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const causaId = toNumberOrNull(morbilidadForm.causa_id)

      if (causaId === null || causaId <= 0) {
        toast({
          title: "Causa inválida",
          description: "Selecciona una causa del listado.",
          variant: "destructive",
        })
        return
      }

      const territorioId = toNumberOrNull(morbilidadForm.territorio_id)
  if (territorioId === null || territorioId <= 0) {
        toast({
          title: "Territorio requerido",
          description: "Selecciona un territorio para registrar el caso.",
          variant: "destructive",
        })
        return
      }

      const anio = toNumberOrNull(morbilidadForm.anio)
  if (anio === null || anio < 1900) {
        toast({
          title: "Año inválido",
          description: "Selecciona un año válido.",
          variant: "destructive",
        })
        return
      }

      const mesNumero = mesToNumber(morbilidadForm.mes)
      if (!mesNumero || mesNumero < 1 || mesNumero > 12) {
        toast({
          title: "Mes inválido",
          description: "Selecciona un mes válido.",
          variant: "destructive",
        })
        return
      }

      const cantidad = toNumberOrNull(morbilidadForm.cantidad)
      if (cantidad === null || cantidad <= 0) {
        toast({
          title: "Cantidad inválida",
          description: "Ingresa un número mayor a cero para la cantidad de casos.",
          variant: "destructive",
        })
        return
      }

      const payload = {
        anio,
        mes: mesNumero,
        territorio_id: territorioId,
        datos: [{
          causa_id: causaId,
          grupo_edad: grupoEdad,
          cantidad,
        }],
      }

      await crearMorbilidad(payload)

      toast({
        title: "Caso registrado",
        description: "El caso de morbilidad se ha registrado exitosamente",
      })

      setIsCreateDialogOpen(false)
      setMorbilidadForm({
        causa_id: null,
        territorio_id: "",
        anio: new Date().getFullYear().toString(),
        mes: (new Date().getMonth() + 1).toString(),
        cantidad: "",
      })
      await cargarMorbilidad()
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
      const local = mortalidadForm.fecha_defuncion
      const iso = local ? new Date(local).toISOString() : ""
      const causaId = mortalidadForm.causa_id

      if (!causaId || Number.isNaN(causaId) || causaId <= 0) {
        toast({
          title: "Causa inválida",
          description: "Selecciona una causa del listado.",
          variant: "destructive",
        })
        return
      }
      if (!mortalidadForm.territorio_id) {
        toast({
          title: "Territorio requerido",
          description: "Selecciona un territorio para registrar la defunción.",
          variant: "destructive",
        })
        return
      }
      const payload = {
        causa_id: causaId,
        territorio_id: Number(mortalidadForm.territorio_id),
        fecha_defuncion: iso,
        lugar_defuncion: mortalidadForm.lugar_defuncion.trim(),
        certificador_id: Number(mortalidadForm.certificador_id),
      }

      await createMortalidadRegistro(payload)

      toast({ title: "Registro creado", description: "El registro de mortalidad se ha creado exitosamente" })
      setIsCreateDialogOpen(false)
      setMortalidadForm({
        causa_id: null,
        territorio_id: "",
        fecha_defuncion: "",
        lugar_defuncion: "",
        certificador_id: "",
      })
      await cargarMortalidad()
    } catch (error) {
      console.error("Error creating mortalidad registro:", error)
      toast({ title: "Error", description: "No se pudo crear el registro de mortalidad", variant: "destructive" })
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

  await upsertAmbienteMetricas(metricasWithTerritorio)

      toast({
        title: "Métricas registradas",
        description: `Se registraron ${metricas.length} métricas ambientales exitosamente`,
      })

      setIsCreateDialogOpen(false)
      setAmbienteForm({
        territorio_id: "",
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
      cargarMorbilidad()
    }
  }, [activeTab])

  const morTotal = useMemo(() => morRows.reduce((s, r) => s + (r.casos || 0), 0), [morRows])

  async function cargarMortalidad() {
    setMortLoading(true)
    try {
      const data = await getMortalidadRegistros({
        causa_id: toNum(searchFilters.causa_id),
        territorio_id: toNum(searchFilters.territorio_id),
        anio: toNum(searchFilters.anio),
        mes: toNum(searchFilters.mes),
        modo: modoMort,
        page: 1,
        limit: 50,
      })
      if (modoMort === "agregado") {
        setMortAggRows(data as MortalidadAggRow[])
        setMortDetRows([])
      } else {
        setMortDetRows(data as MortalidadDetalleRow[])
        setMortAggRows([])
      }
    } finally {
      setMortLoading(false)
    }
  }

  const mortTotal = useMemo(() => {
    return modoMort === "agregado"
      ? mortAggRows.reduce((s, r) => s + (r.total_defunciones || 0), 0)
      : mortDetRows.reduce((s, r) => s + (r.defunciones || 0), 0)
  }, [modoMort, mortAggRows, mortDetRows])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
  <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
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
                <p className="text-2xl font-bold">{morTotal}</p>
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
                <p className="text-2xl font-bold">{mortTotal}</p>
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
                <p className="text-2xl font-bold">{ambienteCount}</p>
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
                    <CausaSelect
                      token={authToken}
                      value={morbilidadForm.causa_id}
                      onChange={(id) => setMorbilidadForm((prev) => ({ ...prev, causa_id: id }))}
                      className="space-y-2"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="territorio_id">Territorio</Label>
                      <Select
                        value={morbilidadForm.territorio_id || undefined}
                        onValueChange={(value) => setMorbilidadForm((prev) => ({ ...prev, territorio_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar territorio" />
                        </SelectTrigger>
                        <SelectContent>
                          {territorios.map((territorio) => (
                            <SelectItem key={territorio.territorio_id} value={String(territorio.territorio_id)}>
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
                    <div className="space-y-2">
                      <Label htmlFor="grupo_edad">Grupo de edad</Label>
                      <Select value={grupoEdad} onValueChange={(v) => setGrupoEdad(v as GrupoEdad)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-<1">0-&lt;1</SelectItem>
                          <SelectItem value="1-4">1-4</SelectItem>
                          <SelectItem value="5-14">5-14</SelectItem>
                          <SelectItem value="15+">15+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casos_reportados">Casos Reportados</Label>
                    <Input
                      id="casos"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={morbilidadForm.cantidad}
                      onChange={(e) => setMorbilidadForm((prev) => ({ ...prev, cantidad: e.target.value }))}
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
                    onValueChange={(value) =>
                      setSearchFilters((prev) => ({ ...prev, causa_id: value === "__all__" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las causas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las causas</SelectItem>
                      {causasLoading ? (
                        <SelectItem value="__loading" disabled>
                          Cargando causas...
                        </SelectItem>
                      ) : causasError ? (
                        <SelectItem value="__error" disabled>
                          ¡{causasError}!
                        </SelectItem>
                      ) : causaOptions.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          Sin catálogo de causas (verifica login/endpoint)
                        </SelectItem>
                      ) : (
                        causaOptions.map((causa) => (
                          <SelectItem key={causa.id} value={causa.id}>
                            {causa.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Territorio</Label>
                  <Select
                    value={searchFilters.territorio_id}
                    onValueChange={(value) =>
                      setSearchFilters((prev) => ({ ...prev, territorio_id: value === "__all__" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los territorios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los territorios</SelectItem>
                      {territorios.map((territorio) => (
                        <SelectItem key={territorio.territorio_id} value={String(territorio.territorio_id)}>
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
                    onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, mes: value === "__all__" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los meses</SelectItem>
                      {MESES.map((mes, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <Button onClick={cargarMorbilidad} disabled={morLoading}>
                  {morLoading ? "Consultando..." : "Consultar"}
                </Button>
                <div className="text-sm text-muted-foreground">
                  Casos de Morbilidad: <b>{morTotal}</b>
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
              {morLoading ? (
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
                        <TableHead className="text-right">Casos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!morLoading && morRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No se encontraron casos de morbilidad
                          </TableCell>
                        </TableRow>
                      ) : (
                        morRows.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{getCausaDisplay(r as any)}</TableCell>
                            <TableCell>{r.territorio_nombre ?? r.territorio_id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{String(r.mes).padStart(2, "0")} {r.anio}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono text-lg font-bold text-orange-600">{r.casos}</span>
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
                    {/* Causa */}
                    <CausaSelect
                      token={authToken}
                      value={mortalidadForm.causa_id}
                      onChange={(id) => setMortalidadForm((prev) => ({ ...prev, causa_id: id }))}
                      className="space-y-2"
                    />

                    {/* Territorio */}
                    <div className="space-y-2">
                      <Label htmlFor="territorio_id">Territorio</Label>
                      <Select
                        value={mortalidadForm.territorio_id || undefined}
                        onValueChange={(value) => setMortalidadForm((prev) => ({ ...prev, territorio_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar territorio" />
                        </SelectTrigger>
                        <SelectContent>
                          {territorios.map((territorio) => (
                            <SelectItem key={territorio.territorio_id} value={String(territorio.territorio_id)}>
                              {territorio.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fecha defunción */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha_defuncion">Fecha de Defunción</Label>
                      <Input
                        id="fecha_defuncion"
                        type="datetime-local"
                        value={mortalidadForm.fecha_defuncion}
                        onChange={(e) => setMortalidadForm((prev) => ({ ...prev, fecha_defuncion: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Lugar */}
                    <div className="space-y-2">
                      <Label htmlFor="lugar_defuncion">Lugar de Defunción</Label>
                      <Input
                        id="lugar_defuncion"
                        placeholder="Hospital / Domicilio / Vía pública…"
                        value={mortalidadForm.lugar_defuncion}
                        onChange={(e) => setMortalidadForm((prev) => ({ ...prev, lugar_defuncion: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Certificador */}
                    <div className="space-y-2">
                      <Label htmlFor="certificador_id">Certificador (ID)</Label>
                      <Input
                        id="certificador_id"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={mortalidadForm.certificador_id}
                        onChange={(e) => setMortalidadForm((prev) => ({ ...prev, certificador_id: e.target.value }))}
                        required
                      />
                    </div>
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
          <Card className="p-4">
            <div className="flex gap-3 items-end">
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select value={modoMort} onValueChange={(v) => setModoMort(v as any)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agregado">Agregado</SelectItem>
                    <SelectItem value="detalle">Detalle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={cargarMortalidad} disabled={mortLoading}>
                {mortLoading ? "Consultando..." : "Consultar"}
              </Button>
              <div className="text-sm text-muted-foreground">
                Registros de Mortalidad: <b>{mortTotal}</b>
              </div>
            </div>
          </Card>

          {modoMort === "agregado" ? (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Causa</TableHead>
                        <TableHead>Territorio</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right">Defunciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mortLoading && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Cargando…
                          </TableCell>
                        </TableRow>
                      )}
                      {!mortLoading && mortAggRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Sin registros
                          </TableCell>
                        </TableRow>
                      )}
                      {!mortLoading &&
                        mortAggRows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{getCausaDisplay(r as any)}</TableCell>
                            <TableCell>{r.territorio_nombre ?? r.territorio_id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{String(r.mes).padStart(2, "0")} {r.anio}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{r.total_defunciones}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Causa</TableHead>
                        <TableHead>Territorio</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Defunciones</TableHead>
                        <TableHead>Lugar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mortLoading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Cargando…
                          </TableCell>
                        </TableRow>
                      )}
                      {!mortLoading && mortDetRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Sin registros
                          </TableCell>
                        </TableRow>
                      )}
                      {!mortLoading &&
                        mortDetRows.map((r) => (
                          <TableRow key={r.registro_id}>
                            <TableCell>{r.registro_id}</TableCell>
                            <TableCell>{getCausaDisplay(r as any)}</TableCell>
                            <TableCell>{r.territorio_nombre ?? r.territorio_id}</TableCell>
                            <TableCell>{new Date(r.fecha_defuncion).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">{r.defunciones}</TableCell>
                            <TableCell>{r.lugar_defuncion ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
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
                        {territorios.map((territorio) => (
                          <SelectItem key={territorio.territorio_id} value={String(territorio.territorio_id)}>
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
                      placeholder={`[\n  {\n    "tipo_metrica": "Calidad del aire",\n    "valor": 45.2,\n    "unidad": "μg/m³",\n    "fecha_medicion": "2024-01-15T10:00:00Z"\n  },\n  {\n    "tipo_metrica": "Calidad del agua",\n    "valor": 7.2,\n    "unidad": "pH",\n    "fecha_medicion": "2024-01-15T10:00:00Z"\n  }\n]`}
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
