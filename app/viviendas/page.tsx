"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MainLayout } from "@/components/layout/main-layout";
import { apiClient } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/lib/api";
import { Home, Users, Edit, ChevronLeft, ChevronRight, Search } from "lucide-react";

type Vivienda = {
  vivienda_id: number;
  sector_id: number;
  sector_nombre: string;
  codigo_familia: string;
  direccion?: string | null;
  lat?: number | null;
  lng?: number | null;
  personas_count?: number;
};

type ApiList = ApiResponse<Vivienda[]>;

export default function ViviendasPage() {
  const [items, setItems] = useState<Vivienda[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [qCodigo, setQCodigo] = useState("");
  const [sectorId, setSectorId] = useState<number | undefined>(undefined);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const { toast } = useToast();

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Vivienda | null>(null);
  const [editCodigo, setEditCodigo] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  async function load() {
    const res: ApiList = await apiClient.listViviendas({
      page,
      limit,
      codigo_familia: qCodigo || undefined,
      sector_id: sectorId,
    });
    const payload: any = (res && typeof res === "object" && "data" in res ? (res as any) : res) as ApiList;
    const data = Array.isArray(payload) ? payload : (payload?.data as any) ?? [];
    const meta = (payload as any)?.meta ?? { page, limit, total: Array.isArray(data) ? data.length : 0 };
    setItems(data as Vivienda[]);
    setTotal(meta?.total || 0);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [page, limit]); // filtros se disparan por botón “Buscar”

  useEffect(() => {
    if (editOpen && editing) {
      setEditCodigo(editing.codigo_familia ?? "");
      setEditDireccion(editing.direccion ?? "");
      setEditLat(editing.lat !== undefined && editing.lat !== null ? String(editing.lat) : "");
      setEditLng(editing.lng !== undefined && editing.lng !== null ? String(editing.lng) : "");
      setEditError("");
    }
  }, [editOpen, editing]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Viviendas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Gestión de Viviendas</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Buscar viviendas registradas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="col-span-2 flex items-center gap-2">
                <Input
                  placeholder="Código familia (prefijo)…"
                  value={qCodigo}
                  onChange={(e) => setQCodigo(e.target.value)}
                />
                <Button onClick={() => { setPage(1); load(); }}>
                  <Search className="h-4 w-4 mr-2" /> Buscar
                </Button>
              </div>
              <div className="col-span-2">
                {/* Si luego quieres el filtro por sector, reemplaza este input por un Select cargado desde /territorios y /sectores */}
                <Input
                  type="number"
                  placeholder="ID de Sector (opcional)"
                  onChange={(e) => setSectorId(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Viviendas</CardTitle>
            <CardDescription>Resultados: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="text-center">Personas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((v) => (
                  <TableRow key={v.vivienda_id}>
                    <TableCell>{v.vivienda_id}</TableCell>
                    <TableCell>{v.sector_nombre ?? v.sector_id}</TableCell>
                    <TableCell>{v.codigo_familia}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{v.direccion ?? "—"}</TableCell>
                    <TableCell className="text-center">{v.personas_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Link href={`/viviendas/${v.vivienda_id}/personas`}>
                          <Button variant="ghost" size="sm" title="Ver personas">
                            <Users className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar vivienda"
                          onClick={() => { setEditing(v); setEditOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Link href={`/sectores/${v.sector_id}/viviendas`}>
                          <Button variant="ghost" size="sm" title="Ir al sector">
                            <Home className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Edit Vivienda Modal */}
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Vivienda</DialogTitle>
              <DialogDescription>Actualiza los datos de la vivienda seleccionada</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editing) return;
                setEditError("");
                setEditSubmitting(true);

                // Validaciones
                if (!editCodigo.trim()) {
                  setEditError("El código de familia es requerido");
                  setEditSubmitting(false);
                  return;
                }
                if ((editLat && !editLng) || (editLng && !editLat)) {
                  setEditError("Si proporciona una coordenada debe proporcionar ambas");
                  setEditSubmitting(false);
                  return;
                }
                let latVal: number | null = null;
                let lngVal: number | null = null;
                if (editLat && editLng) {
                  latVal = Number.parseFloat(editLat);
                  lngVal = Number.parseFloat(editLng);
                  if (Number.isNaN(latVal) || latVal < -90 || latVal > 90) {
                    setEditError("La latitud debe estar entre -90 y 90");
                    setEditSubmitting(false);
                    return;
                  }
                  if (Number.isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
                    setEditError("La longitud debe estar entre -180 y 180");
                    setEditSubmitting(false);
                    return;
                  }
                }

                try {
                  await apiClient.updateVivienda(editing.vivienda_id, {
                    codigo_familia: editCodigo.trim(),
                    direccion: editDireccion.trim() || undefined,
                    lat: editLat ? latVal : null,
                    lng: editLng ? lngVal : null,
                  });
                  toast({ title: "Vivienda actualizada" });
                  setEditOpen(false);
                  setEditing(null);
                  await load();
                } catch (err: any) {
                  console.error("update vivienda error", err);
                  setEditError(err?.message || "Error al actualizar la vivienda");
                } finally {
                  setEditSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              {editError && (
                <Alert variant="destructive">
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit_codigo">Código de Familia *</Label>
                <Input id="edit_codigo" value={editCodigo} onChange={(e) => setEditCodigo(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_direccion">Dirección (opcional)</Label>
                <Input id="edit_direccion" value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_lat">Latitud (opcional)</Label>
                  <Input
                    id="edit_lat"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={editLat}
                    onChange={(e) => setEditLat(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_lng">Longitud (opcional)</Label>
                  <Input
                    id="edit_lng"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={editLng}
                    onChange={(e) => setEditLng(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditing(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editSubmitting}>
                  {editSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
