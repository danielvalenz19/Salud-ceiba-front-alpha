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
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CoberturaData {
  mes: number
  cobertura_pct: number
  meta_pct?: number
  poblacion_objetivo?: number
  poblacion_cubierta?: number
}

interface CoberturaResponse {
  territorio_id: number
  territorio_nombre: string
  anio: number
  coberturas: CoberturaData[]
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

const SAMPLE_TERRITORIOS = [
  { territorio_id: 1, nombre: "Región Central" },
  { territorio_id: 2, nombre: "Región Norte" },
  { territorio_id: 3, nombre: "Región Sur" },
  { territorio_id: 4, nombre: "Región Este" },
  { territorio_id: 5, nombre: "Región Oeste" },
]

export default function CoberturasPage() {
  const [selectedTerritorio, setSelectedTerritorio] = useState<string>("1")
  const [selectedAnio, setSelectedAnio] = useState<string>(new Date().getFullYear().toString())
  const [vacunacionData, setVacunacionData] = useState<CoberturaResponse | null>(null)
  const [nutricionData, setNutricionData] = useState<CoberturaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadCoberturas = async () => {
    if (!selectedTerritorio || !selectedAnio) return

    try {
      setLoading(true)

      // Load vaccination coverage
      const vacunacionResponse = await apiClient.getVacunacionCoberturas({
        territorio_id: Number.parseInt(selectedTerritorio),
        anio: Number.parseInt(selectedAnio),
      })

      // Load nutrition coverage
      const nutricionResponse = await apiClient.getNutricionCoberturas({
        territorio_id: Number.parseInt(selectedTerritorio),
        anio: Number.parseInt(selectedAnio),
      })

      if (vacunacionResponse.data) {
        setVacunacionData(vacunacionResponse.data)
      }

      if (nutricionResponse.data) {
        setNutricionData(nutricionResponse.data)
      }
    } catch (error) {
      console.error("Error loading coberturas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de cobertura",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoberturas()
  }, [selectedTerritorio, selectedAnio])

  const formatChartData = (coberturas: CoberturaData[]) => {
    return coberturas.map((item) => ({
      mes: MESES[item.mes - 1],
      cobertura: item.cobertura_pct,
      meta: item.meta_pct || 80, // Default meta 80%
    }))
  }

  const calculatePromedio = (coberturas: CoberturaData[]) => {
    if (!coberturas.length) return 0
    const sum = coberturas.reduce((acc, item) => acc + item.cobertura_pct, 0)
    return Math.round((sum / coberturas.length) * 100) / 100
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coberturas de Salud</h1>
          <p className="text-muted-foreground">Monitoreo de coberturas de vacunación y nutrición por territorio</p>
        </div>

        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
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
              <Select value={selectedTerritorio} onValueChange={setSelectedTerritorio}>
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

            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Año</label>
              <Select value={selectedAnio} onValueChange={setSelectedAnio}>
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
      <Tabs defaultValue="vacunacion" className="space-y-6">
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
                        <p className="text-2xl font-bold">{calculatePromedio(vacunacionData.coberturas)}%</p>
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
                        <p className="text-2xl font-bold">
                          {Math.max(...vacunacionData.coberturas.map((c) => c.cobertura_pct))}%
                        </p>
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
                        <p className="text-lg font-bold">
                          {getStatusText(calculatePromedio(vacunacionData.coberturas))}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full ${getStatusColor(calculatePromedio(vacunacionData.coberturas))} flex items-center justify-center`}
                      >
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
                    Cobertura mensual vs meta para {vacunacionData.territorio_nombre} - {vacunacionData.anio}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(vacunacionData.coberturas)}>
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
                        {vacunacionData.coberturas.map((item) => (
                          <TableRow key={item.mes}>
                            <TableCell className="font-medium">{MESES[item.mes - 1]}</TableCell>
                            <TableCell>
                              <span className="font-mono text-lg">{item.cobertura_pct}%</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(item.cobertura_pct)} text-white`}>
                                {getStatusText(item.cobertura_pct)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.poblacion_objetivo || "N/A"}</TableCell>
                            <TableCell>{item.poblacion_cubierta || "N/A"}</TableCell>
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
                        <p className="text-2xl font-bold">{calculatePromedio(nutricionData.coberturas)}%</p>
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
                        <p className="text-2xl font-bold">
                          {Math.max(...nutricionData.coberturas.map((c) => c.cobertura_pct))}%
                        </p>
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
                        <p className="text-lg font-bold">
                          {getStatusText(calculatePromedio(nutricionData.coberturas))}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full ${getStatusColor(calculatePromedio(nutricionData.coberturas))} flex items-center justify-center`}
                      >
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
                    Cobertura mensual vs meta para {nutricionData.territorio_nombre} - {nutricionData.anio}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formatChartData(nutricionData.coberturas)}>
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
                        {nutricionData.coberturas.map((item) => (
                          <TableRow key={item.mes}>
                            <TableCell className="font-medium">{MESES[item.mes - 1]}</TableCell>
                            <TableCell>
                              <span className="font-mono text-lg">{item.cobertura_pct}%</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(item.cobertura_pct)} text-white`}>
                                {getStatusText(item.cobertura_pct)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.poblacion_objetivo || "N/A"}</TableCell>
                            <TableCell>{item.poblacion_cubierta || "N/A"}</TableCell>
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
  )
}
