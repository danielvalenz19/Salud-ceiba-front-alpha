"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MainLayout } from "@/components/layout/main-layout"
import { Users, Activity, MapPin, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DashboardStats {
  totalUsers: number
  monthlyEvents: number
  totalTerritories: number
  totalSectors: number
}

interface ChartData {
  month: string
  eventos: number
  metricas: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [territorios, setTerritorios] = useState<Array<{ territorio_id: number; nombre: string }>>([])
  const [selectedTerritorio, setSelectedTerritorio] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Load basic stats
      const [usersResponse, territoriosResponse] = await Promise.all([
        apiClient.getUsers({ page: 1, limit: 1 }), // Just to get total count
        apiClient.getTerritorios(),
      ])

      // Get current month events
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const eventsResponse = await apiClient.getEventos({
        from: firstDayOfMonth.toISOString().split("T")[0],
        to: lastDayOfMonth.toISOString().split("T")[0],
        page: 1,
        limit: 1, // Just to get total count
      })

      setStats({
        totalUsers: usersResponse.meta?.total || 0,
        monthlyEvents: eventsResponse.meta?.total || 0,
        totalTerritories: territoriosResponse.data?.length || 0,
        totalSectors: 0, // TODO: Add sectors count when needed
      })

      setTerritorios(territoriosResponse.data || [])

      // Load chart data
      await loadChartData()
    } catch (error) {
      console.error("Dashboard data loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar datos del dashboard")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadChartData = async () => {
    try {
      const months = Number.parseInt(selectedPeriod)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const periodDesde = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`
      const periodHasta = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`

      const metricasParams: any = {
        periodo_desde: periodDesde,
        periodo_hasta: periodHasta,
      }

      if (selectedTerritorio !== "all") {
        metricasParams.territorio_id = Number.parseInt(selectedTerritorio)
      }

      const metricasResponse = await apiClient.getMetricas(metricasParams)

      // Process chart data - group by month
      const chartDataMap = new Map<string, { eventos: number; metricas: number }>()

      // Initialize months
      for (let i = 0; i < months; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthName = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
        chartDataMap.set(monthKey, { eventos: 0, metricas: 0 })
      }

      // Add metrics data
      if (metricasResponse.data) {
        metricasResponse.data.forEach((metrica: any) => {
          const monthKey = `${metrica.anio}-${String(metrica.mes).padStart(2, "0")}`
          if (chartDataMap.has(monthKey)) {
            const existing = chartDataMap.get(monthKey)!
            chartDataMap.set(monthKey, {
              ...existing,
              metricas: existing.metricas + (metrica.valor_num || 0),
            })
          }
        })
      }

      // Convert to array and sort by date
      const chartArray = Array.from(chartDataMap.entries())
        .map(([monthKey, data]) => {
          const [year, month] = monthKey.split("-")
          const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
          const monthName = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
          return {
            month: monthName,
            ...data,
          }
        })
        .sort((a, b) => {
          const dateA = new Date(a.month)
          const dateB = new Date(b.month)
          return dateA.getTime() - dateB.getTime()
        })

      setChartData(chartArray)
    } catch (error) {
      console.error("Chart data loading error:", error)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      loadChartData()
    }
  }, [selectedTerritorio, selectedPeriod])

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    isLoading,
  }: {
    title: string
    value: number | string
    description: string
    icon: any
    isLoading: boolean
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-primary">{value}</div>}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del sistema de salud comunitaria</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Usuarios Totales"
            value={stats?.totalUsers || 0}
            description="Usuarios registrados en el sistema"
            icon={Users}
            isLoading={isLoading}
          />
          <StatCard
            title="Eventos del Mes"
            value={stats?.monthlyEvents || 0}
            description="Eventos registrados este mes"
            icon={Activity}
            isLoading={isLoading}
          />
          <StatCard
            title="Territorios"
            value={stats?.totalTerritories || 0}
            description="Territorios configurados"
            icon={MapPin}
            isLoading={isLoading}
          />
          <StatCard
            title="Tendencia"
            value="↗ +12%"
            description="Crecimiento vs mes anterior"
            icon={TrendingUp}
            isLoading={isLoading}
          />
        </div>

        {/* Chart Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Métricas Mensuales</CardTitle>
                <CardDescription>Evolución de métricas por territorio y período</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={selectedTerritorio} onValueChange={setSelectedTerritorio}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar territorio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los territorios</SelectItem>
                    {territorios.map((territorio) => (
                      <SelectItem key={territorio.territorio_id} value={territorio.territorio_id.toString()}>
                        {territorio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={loadChartData} size="sm">
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="metricas"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Métricas"
                    />
                    <Line
                      type="monotone"
                      dataKey="eventos"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      name="Eventos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <Users className="h-6 w-6" />
                <span>Gestionar Usuarios</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <MapPin className="h-6 w-6" />
                <span>Ver Territorios</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <Activity className="h-6 w-6" />
                <span>Registrar Evento</span>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col space-y-2 bg-transparent">
                <a href="/metricas">
                <TrendingUp className="h-6 w-6" />
                <span>Ver Métricas</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
