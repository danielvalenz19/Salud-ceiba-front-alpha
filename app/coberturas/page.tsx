"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Shield, Heart, Calendar, TrendingUp, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"
import { getTerritorios, getCoberturaVacunacion, getCoberturaNutricion } from "@/services/coberturas"
import { toCSV, downloadCSV } from "@/utils/csv"

type MesRow = {
  mes: number
  cobertura: number
  meta: number
  poblacion_objetivo?: number | null
  poblacion_cubierta?: number | null
}

type CoberturaNormalized = {
  promedioAnual: number
  mejorMes: number
  estadoGeneral: string
  mensual: MesRow[]
}

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

export default function CoberturasPage() {
  const { toast } = useToast()
  const [territorios, setTerritorios] = useState<Array<{ id: number; nombre: string }>>([])
  const [selectedTerritorio, setSelectedTerritorio] = useState<number | null>(null)
  const [selectedAnio, setSelectedAnio] = useState<number>(new Date().getFullYear())
  const [tab, setTab] = useState<"vacunacion" | "nutricion">("vacunacion")
  const [vacunacionData, setVacunacionData] = useState<CoberturaNormalized | null>(null)
  const [nutricionData, setNutricionData] = useState<CoberturaNormalized | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar territorios al entrar
  useEffect(() => {
    ;(async () => {
      try {
        const t = await getTerritorios()
        setTerritorios(t)
        if (t.length) setSelectedTerritorio(t[0].id)
      } catch (e) {
        console.error("Error cargando territorios:", e)
        toast({ title: "Error", description: "No se pudieron cargar territorios", variant: "destructive" })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCoberturas = async () => {
    if (!selectedTerritorio || !selectedAnio) return
    try {
      setLoading(true)
      if (tab === "vacunacion") {
        const d = await getCoberturaVacunacion(selectedTerritorio, selectedAnio)
        setVacunacionData(d)
      } else {
        const d = await getCoberturaNutricion(selectedTerritorio, selectedAnio)
        setNutricionData(d)
      }
    } catch (error) {
      console.error("Error loading coberturas:", error)
      toast({ title: "Error", description: "No se pudieron cargar los datos de cobertura", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoberturas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerritorio, selectedAnio, tab])

  const formatChartData = (mensual?: MesRow[]) => {
    const list = Array.isArray(mensual) ? mensual : []
    return list.map((item) => ({ mes: MESES[item.mes - 1], cobertura: item.cobertura, meta: item.meta || 80 }))
  }

  const getStatusColor = (cobertura: number) => {
    if (cobertura >= 80) return "bg-green-500"
    if (cobertura >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusText = (cobertura: number) => {
    if (cobertura >= 80) return "Óptima"
    if (cobertura >= 60) return "Aceptable"
    return "Deficiente"
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const exportCSV = () => {
    const active = tab === "vacunacion" ? vacunacionData : nutricionData
    if (!active) return
    const rows = [
      { tipo: "Resumen", promedioAnual: active.promedioAnual, mejorMes: active.mejorMes, estadoGeneral: active.estadoGeneral },
      ...active.mensual.map((m) => ({ tipo: "Mensual", mes: MESES[m.mes - 1], cobertura: m.cobertura, meta: m.meta })),
    ]
    const csv = toCSV(rows)
    downloadCSV(`coberturas_${tab}_${selectedTerritorio ?? ""}_${selectedAnio}.csv`, csv)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coberturas de Salud</h1>
          <p className="text-muted-foreground">Monitoreo de coberturas de vacunación y nutrición por territorio</p>
        </div>

        <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={exportCSV} disabled={loading}>
          <Download className="h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Territorio</label>
              <Select value={selectedTerritorio?.toString() ?? ""} onValueChange={(v) => setSelectedTerritorio(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar territorio" />
                </SelectTrigger>
                <SelectContent>
                  {territorios.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Año</label>
              <Select value={selectedAnio.toString()} onValueChange={(v) => setSelectedAnio(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
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

            <div className="flex items-end">
              <Button onClick={loadCoberturas} disabled={loading}>
                {loading ? "Cargando..." : "Consultar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vacunacion" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Vacunación
          </TabsTrigger>
          <TabsTrigger value="nutricion" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Nutrición
          </TabsTrigger>
        </TabsList>

        {/* Vaccination Tab */}
        <TabsContent value="vacunacion" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <div className="lg:col-span-3">
                <Skeleton className="h-64" />
              </div>
            </div>
          ) : vacunacionData ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Promedio Anual</p>
                        <p className="text-2xl font-bold">{vacunacionData.promedioAnual}%</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center`}>
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Mejor Mes</p>
                        <p className="text-2xl font-bold">{vacunacionData.mejorMes}%</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado General</p>
                        <p className="text-lg font-bold">{vacunacionData.estadoGeneral}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full ${getStatusColor(vacunacionData.promedioAnual)} flex items-center justify-center`}>
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Cobertura de Vacunación</CardTitle>
                  <CardDescription>
                    Cobertura mensual vs meta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(vacunacionData?.mensual)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          formatter={(value, name) => [`${value}%`, name === "cobertura" ? "Cobertura" : "Meta"]}
                        />
                        <Line type="monotone" dataKey="cobertura" stroke="#3b82f6" strokeWidth={3} />
                        <Line type="monotone" dataKey="meta" stroke="#ef4444" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle Mensual</CardTitle>
                  <CardDescription>Datos específicos de cobertura por mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead>Cobertura</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Población Objetivo</TableHead>
                          <TableHead>Población Cubierta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(vacunacionData?.mensual ?? []).map((item) => (
                          <TableRow key={item.mes}>
                            <TableCell className="font-medium">{MESES[item.mes - 1]}</TableCell>
                            <TableCell>
                              <span className="font-mono text-lg">{item.cobertura}%</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(item.cobertura)} text-white`}>
                                {getStatusText(item.cobertura)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.poblacion_objetivo ?? "N/A"}</TableCell>
                            <TableCell>{item.poblacion_cubierta ?? "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay datos de cobertura de vacunación disponibles</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecciona un territorio y año para consultar los datos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutricion" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <div className="lg:col-span-3">
                <Skeleton className="h-64" />
              </div>
            </div>
          ) : nutricionData ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Promedio Anual</p>
                        <p className="text-2xl font-bold">{nutricionData.promedioAnual}%</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full bg-green-500 flex items-center justify-center`}>
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Mejor Mes</p>
                        <p className="text-2xl font-bold">{nutricionData.mejorMes}%</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado General</p>
                        <p className="text-lg font-bold">{nutricionData.estadoGeneral}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-full ${getStatusColor(nutricionData.promedioAnual)} flex items-center justify-center`}>
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Cobertura de Nutrición</CardTitle>
                  <CardDescription>
                    Cobertura mensual vs meta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formatChartData(nutricionData?.mensual)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          formatter={(value, name) => [`${value}%`, name === "cobertura" ? "Cobertura" : "Meta"]}
                        />
                        <Area type="monotone" dataKey="cobertura" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Line type="monotone" dataKey="meta" stroke="#ef4444" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle Mensual</CardTitle>
                  <CardDescription>Datos específicos de cobertura por mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead>Cobertura</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Población Objetivo</TableHead>
                          <TableHead>Población Cubierta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(nutricionData?.mensual ?? []).map((item) => (
                          <TableRow key={item.mes}>
                            <TableCell className="font-medium">{MESES[item.mes - 1]}</TableCell>
                            <TableCell>
                              <span className="font-mono text-lg">{item.cobertura}%</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(item.cobertura)} text-white`}>
                                {getStatusText(item.cobertura)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.poblacion_objetivo ?? "N/A"}</TableCell>
                            <TableCell>{item.poblacion_cubierta ?? "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay datos de cobertura de nutrición disponibles</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecciona un territorio y año para consultar los datos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  )
}
