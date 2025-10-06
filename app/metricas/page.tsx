"use client"

import { useEffect, useState } from "react"
import { getMetricas, putMetricas, type ListQuery, type MetricaUpsert } from "@/src/services/metricas.service"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { METRICAS_CATALOG, getMetricaDef, computeValue } from "@/src/lib/metricasCatalog"
import { BulkUpload } from "@/components/metricas/BulkUpload"
import { TimelineChart } from "@/components/metricas/TimelineChart"
import { downloadCSV, toCSV } from "@/utils/csv"

export default function MetricasPage() {
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({ page: 1, limit: 50, total: 0 })
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState<ListQuery>({ page: 1, limit: 50 })
  const [selectedInd, setSelectedInd] = useState<string | number>("")
  const { toast } = useToast()

  async function load(params: ListQuery = q) {
    setLoading(true)
    try {
      const data = await getMetricas(params)
      // Soporta tanto { data, meta } como array plano
      const list = Array.isArray(data) ? data : data?.data || []
      const metaResp = Array.isArray(data) ? { page: params.page ?? 1, limit: params.limit ?? 50, total: list.length } : data?.meta
      setRows(list)
      setMeta(metaResp || { page: 1, limit: 50, total: list.length })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudieron cargar las métricas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    try {
      setLoading(true)
      const payload: MetricaUpsert[] = [
        { ind_id: 301, territorio_id: 2, anio: 2025, mes: 10, valor_num: 120, valor_den: 150 },
      ]
      const resp = await putMetricas(payload)
      toast({ title: "OK", description: resp?.message || "Carga de métricas completada" })
      await load({ page: 1, limit: q.limit ?? 50 })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo cargar la muestra", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load({ page: 1, limit: 50 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build timeline data for the selected indicator (last 12 months if filtered)
  const timeline = (() => {
    const code = selectedInd || q.ind_id
    if (!code) return [] as Array<{ month: string; value: number }>
    const def = getMetricaDef(code)
    const points = rows
      .filter((r) => String(r.ind_id) === String(code))
      .map((r) => {
        const v = def ? computeValue(r, def.kind) : null
        return {
          month: `${r.anio}-${String(r.mes).padStart(2, "0")}`,
          value: v ?? (r.valor_den ? 0 : Number(r.valor_num ?? 0)),
        }
      })
      .sort((a, b) => a.month.localeCompare(b.month))
    return points
  })()

  function exportTable() {
    const enriched = rows.map((r) => {
      const def = getMetricaDef(r.ind_id)
      const calc = def ? computeValue(r, def.kind) : null
      return { ...r, calculado: calc }
    })
    downloadCSV("metricas.csv", toCSV(enriched))
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Métricas</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-sm">Territorio ID</Label>
                <Input
                  placeholder="e.g. 2"
                  value={q.territorio_id ?? ""}
                  onChange={(e) => setQ((p) => ({ ...p, territorio_id: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <Label className="text-sm">Indicador (id o SIGSA)</Label>
                <Input
                  placeholder="301 o SIGSA_ABC123"
                  value={(q.ind_id as any) ?? ""}
                  onChange={(e) => setQ((p) => ({ ...p, ind_id: e.target.value || undefined }))}
                />
              </div>
              <div>
                <Label className="text-sm">Desde (YYYY-MM)</Label>
                <Input
                  placeholder="2025-01"
                  value={q.periodo_desde ?? ""}
                  onChange={(e) => setQ((p) => ({ ...p, periodo_desde: e.target.value || undefined }))}
                />
              </div>
              <div>
                <Label className="text-sm">Hasta (YYYY-MM)</Label>
                <Input
                  placeholder="2025-12"
                  value={q.periodo_hasta ?? ""}
                  onChange={(e) => setQ((p) => ({ ...p, periodo_hasta: e.target.value || undefined }))}
                />
              </div>
              <div>
                <Label className="text-sm">Indicador catálogo</Label>
                <select
                  className="w-full border rounded h-9 px-2 bg-background"
                  value={selectedInd as any}
                  onChange={(e) => setSelectedInd(e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {METRICAS_CATALOG.map((m) => (
                    <option key={m.code} value={String(m.code)}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => load({ ...q, page: 1 })} disabled={loading}>Aplicar</Button>
              <Button variant="outline" onClick={() => { setQ({ page: 1, limit: 50 }); load({ page: 1, limit: 50 }) }} disabled={loading}>Limpiar</Button>
              <Button variant="secondary" onClick={handleUpload} disabled={loading}>Cargar ejemplo</Button>
              <Button variant="outline" onClick={exportTable} disabled={loading || rows.length === 0}>Exportar CSV</Button>
            </div>
            <div className="mt-4">
              <BulkUpload />
            </div>
          </CardContent>
        </Card>

        {timeline.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                Serie: {getMetricaDef(selectedInd || q.ind_id || "")?.name || selectedInd || q.ind_id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineChart
                data={timeline.map((p) => ({ month: p.month, value: p.value }))}
                series={[{ key: "value", name: "Valor" }]}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            {loading ? (
              <p className="p-4">Cargando…</p>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ind_id</TableHead>
                      <TableHead>indicador</TableHead>
                      <TableHead>territorio_id</TableHead>
                      <TableHead>periodo</TableHead>
                      <TableHead className="text-right">num</TableHead>
                      <TableHead className="text-right">den</TableHead>
                      <TableHead className="text-right">calculado</TableHead>
                      <TableHead>updated_at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length > 0 ? (
                      rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.ind_id}</TableCell>
                          <TableCell>{getMetricaDef(r.ind_id)?.name ?? ""}</TableCell>
                          <TableCell>{r.territorio_id}</TableCell>
                          <TableCell>{`${r.anio}-${String(r.mes).padStart(2, "0")}`}</TableCell>
                          <TableCell className="text-right">{r.valor_num}</TableCell>
                          <TableCell className="text-right">{r.valor_den ?? ""}</TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const def = getMetricaDef(r.ind_id)
                              const v = def ? computeValue(r, def.kind) : null
                              return v == null ? "" : v.toFixed(2)
                            })()}
                          </TableCell>
                          <TableCell>{r.updated_at?.slice(0, 19)?.replace("T", " ")}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8}>Sin datos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-2 text-sm text-muted-foreground">
              Total: {meta.total} • Página: {meta.page} • Límite: {meta.limit}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
