"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MainLayout } from "@/components/layout/main-layout"
import { MapPin, Building, ChevronRight, BarChart3 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Territorio {
  territorio_id: number
  codigo: string
  nombre: string
}

export default function TerritoriosPage() {
  const [territorios, setTerritorios] = useState<Territorio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()
  // Create dialog state
  const [openCreate, setOpenCreate] = useState(false)
  const [createCodigo, setCreateCodigo] = useState("")
  const [createNombre, setCreateNombre] = useState("")
  const createCodigoRef = useRef<HTMLInputElement | null>(null)

  const [createLoading, setCreateLoading] = useState(false)

  // Edit dialog state
  const [openEdit, setOpenEdit] = useState(false)
  const [editRow, setEditRow] = useState<Territorio | null>(null)
  const [editCodigo, setEditCodigo] = useState("")
  const [editNombre, setEditNombre] = useState("")
  const editCodigoRef = useRef<HTMLInputElement | null>(null)

  const [editLoading, setEditLoading] = useState(false)

  const loadTerritorios = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getTerritorios()
      if (response.data) {
        setTerritorios(response.data)
      }
    } catch (error) {
      console.error("Territorios loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar territorios")
      toast({
        title: "Error",
        description: "No se pudieron cargar los territorios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTerritorios()
  }, [])

  // focus first input when dialogs open
  useEffect(() => {
    if (openCreate) {
      setTimeout(() => createCodigoRef.current?.focus(), 50)
    }
  }, [openCreate])

  useEffect(() => {
    if (openEdit) {
      setTimeout(() => editCodigoRef.current?.focus(), 50)
    }
  }, [openEdit])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión Territorial</h1>
          <p className="text-muted-foreground">
            Administra los territorios y su sectorización en el sistema de salud comunitaria
          </p>
        </div>

        {/* Single Edit Dialog - rendered once and controlled by state */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar territorio</DialogTitle>
              <DialogDescription>Modificar código y nombre</DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!editRow) return
                if (!editCodigo.trim() || !editNombre.trim()) {
                  toast({ title: "Validación", description: "Código y nombre son obligatorios", variant: "destructive" })
                  return
                }

                setEditLoading(true)
                try {
                  const resp = await apiClient.updateTerritorio(editRow.territorio_id, { codigo: editCodigo.trim(), nombre: editNombre.trim() })
                  if (resp.data && (resp.data as any).territorio_id) {
                    toast({ title: "Territorio actualizado", description: `${(resp.data as any).nombre} guardado` })
                    setOpenEdit(false)
                    await loadTerritorios()
                  } else if ((resp as any).message) {
                    toast({ title: "Error", description: (resp as any).message, variant: "destructive" })
                  }
                } catch (err) {
                  console.error(err)
                  toast({ title: "Error", description: "No se pudo actualizar el territorio", variant: "destructive" })
                } finally {
                  setEditLoading(false)
                }
              }}
            >
              <div className="grid gap-2">
                <Label>Código</Label>
                <Input ref={editCodigoRef as any} value={editCodigo} onChange={(e: any) => setEditCodigo(e.target.value)} />
                <Label>Nombre</Label>
                <Input value={editNombre} onChange={(e: any) => setEditNombre(e.target.value)} />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={editLoading}>{editLoading ? 'Guardando...' : 'Guardar'}</Button>
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Territorios Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Nuevo territorio button + create dialog */}
            <div>
              <Button onClick={() => setOpenCreate(true)} className="w-full">Nuevo territorio</Button>

              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo territorio</DialogTitle>
                    <DialogDescription>Crear un nuevo territorio</DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      // simple validation
                      if (!createCodigo.trim() || !createNombre.trim()) {
                        toast({ title: "Validación", description: "Código y nombre son obligatorios", variant: "destructive" })
                        return
                      }

                      setCreateLoading(true)
                      try {
                        const resp = await apiClient.createTerritorio({ codigo: createCodigo.trim(), nombre: createNombre.trim() })
                        if (resp.data) {
                          toast({ title: "Territorio creado", description: `${resp.data.nombre} creado correctamente` })
                          setOpenCreate(false)
                          setCreateCodigo("")
                          setCreateNombre("")
                          await loadTerritorios()
                        } else if (resp.message) {
                          toast({ title: "Error", description: resp.message, variant: "destructive" })
                        }
                      } catch (err) {
                        console.error(err)
                        toast({ title: "Error", description: "No se pudo crear el territorio", variant: "destructive" })
                      } finally {
                        setCreateLoading(false)
                      }
                    }}
                  >
                    <div className="grid gap-2">
                      <Label>Código</Label>
                      <Input ref={createCodigoRef as any} value={createCodigo} onChange={(e: any) => setCreateCodigo(e.target.value)} placeholder="Código (p.ej. T1)" />
                      <Label>Nombre</Label>
                      <Input value={createNombre} onChange={(e: any) => setCreateNombre(e.target.value)} placeholder="Nombre" />
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={createLoading}>{createLoading ? 'Creando...' : 'Crear'}</Button>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : territorios.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay territorios configurados</h3>
              <p className="text-muted-foreground">Los territorios se configuran desde el backend del sistema</p>
            </div>
          ) : (
            territorios.map((territorio) => (
              <Card key={territorio.territorio_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>{territorio.nombre}</span>
                      </CardTitle>
                      <CardDescription>Código: {territorio.codigo}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ID Territorio:</span>
                      <span className="font-medium">{territorio.territorio_id}</span>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Link href={`/territorios/${territorio.territorio_id}/sectores`}>
                        <Button variant="outline" className="w-full justify-between bg-transparent">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>Ver Sectores</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>

                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-between bg-transparent">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Estadísticas</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" onClick={() => { setEditRow(territorio); setEditCodigo(territorio.codigo); setEditNombre(territorio.nombre); setOpenEdit(true); }} className="w-full">Editar</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Stats */}
        {!isLoading && territorios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen Territorial</CardTitle>
              <CardDescription>Estadísticas generales de la configuración territorial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{territorios.length}</div>
                  <p className="text-sm text-muted-foreground">Territorios Configurados</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">-</div>
                  <p className="text-sm text-muted-foreground">Total Sectores</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">-</div>
                  <p className="text-sm text-muted-foreground">Total Viviendas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
