"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, type Evento } from "@/lib/api"
import { ArrowLeft, Activity, Clock, Users } from "lucide-react"

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

function getIndicatorName(indId: number) {
  const indicator = SAMPLE_INDICATORS.find((ind) => ind.id === indId)
  return indicator?.name || `Indicador ${indId}`
}

function getModuleInfo(indId: number) {
  const indicator = SAMPLE_INDICATORS.find((ind) => ind.id === indId)
  if (indicator) return CLINICAL_MODULES.find((m) => m.id === (indicator as any).module)
  return CLINICAL_MODULES[0]
}

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(params?.id)
    if (!id) return
    let ignore = false
    ;(async () => {
      try {
        const res = await apiClient.getEventoById(id)
        if (!ignore && res.data) setEvento(res.data)
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [params?.id])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/eventos")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Detalle del Evento
            </CardTitle>
            <CardDescription>Información completa del evento clínico</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : !evento ? (
              <p className="text-muted-foreground">No se encontró el evento.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className={`${getModuleInfo(evento.ind_id)?.color} text-white`}>
                    {getModuleInfo(evento.ind_id)?.name}
                  </Badge>
                  <span className="font-medium">{getIndicatorName(evento.ind_id)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Persona</div>
                    {evento.persona_id ? (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> ID: {evento.persona_id}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Sin persona</div>
                    )}
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fecha</div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(evento.fecha_evento).toLocaleString("es-ES")}
                    </div>
                  </div>
                  {((evento as any).lote || (evento as any).valor_texto) && (
                    <div>
                      <div className="text-muted-foreground">Lote</div>
                      {(evento as any).lote ? (
                        <Badge variant="outline">{(evento as any).lote}</Badge>
                      ) : (evento as any).valor_texto?.includes("LOTE") ? (
                        <Badge variant="outline">{(evento as any).valor_texto}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  )}
                </div>

                {(evento as any).detalle_json && (
                  <div>
                    <div className="text-sm font-medium mb-2">Detalle JSON</div>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                      {JSON.stringify((evento as any).detalle_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
