"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, User, Activity, FileText, Hash } from "lucide-react"
import { apiClient, type Evento } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

export default function EventoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)

  const eventoId = params.id as string

  useEffect(() => {
    const loadEvento = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getEventoById(Number.parseInt(eventoId))
        if (response.data) {
          setEvento(response.data)
        }
      } catch (error) {
        console.error("Error loading evento:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el detalle del evento",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (eventoId) {
      loadEvento()
    }
  }, [eventoId, toast])

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No se encontró el evento solicitado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const moduleInfo = getModuleInfo(evento.ind_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Detalle del Evento</h1>
          <p className="text-muted-foreground">Información completa del evento clínico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Información Básica
            </CardTitle>
            <CardDescription>Datos principales del evento registrado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">ID del Evento</span>
              <Badge variant="outline" className="font-mono">
                #{evento.evento_id}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Módulo Clínico</span>
              <Badge className={`${moduleInfo?.color} text-white`}>{moduleInfo?.name}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Indicador</span>
              <span className="text-sm font-medium">{getIndicatorName(evento.ind_id)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">ID Indicador</span>
              <Badge variant="secondary" className="font-mono">
                {evento.ind_id}
              </Badge>
            </div>

            {evento.persona_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Persona
                </span>
                <Badge variant="outline" className="font-mono">
                  ID: {evento.persona_id}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha del Evento
              </span>
              <span className="text-sm font-medium">
                {new Date(evento.fecha_evento).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Values and Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Valores y Detalles
            </CardTitle>
            <CardDescription>Información específica del evento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {evento.valor_num !== null && evento.valor_num !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  Valor Numérico
                </span>
                <span className="text-lg font-bold font-mono text-primary">{evento.valor_num}</span>
              </div>
            )}

            {evento.valor_texto && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Valor Texto</span>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{evento.valor_texto}</p>
                </div>
              </div>
            )}

            {/* TODO: Add more fields as they become available from backend */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>TODO:</strong> Campos adicionales como sector_id, responsable_id, lote, y detalle_json se
                mostrarán aquí cuando estén disponibles en la respuesta del backend.
              </p>
            </div>

            {!evento.valor_num && !evento.valor_texto && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">No hay valores adicionales registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
          <CardDescription>Datos complementarios del evento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Tipo de Evento</p>
              <p className="text-xs text-muted-foreground">Evento Clínico</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Estado</p>
              <p className="text-xs text-muted-foreground">Registrado</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Módulo</p>
              <p className="text-xs text-muted-foreground">{moduleInfo?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
