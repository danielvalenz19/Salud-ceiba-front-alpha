"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MainLayout } from "@/components/layout/main-layout"
import { Building, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Home } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Sector {
  sector_id: number
  nombre: string
  territorio_id: number
  // TODO: Add other sector fields as needed
}

interface Territorio {
  territorio_id: number
  codigo: string
  nombre: string
}

export default function SectoresPage() {
  const [sectores, setSectores] = useState<Sector[]>([])
  const [territorios, setTerritorios] = useState<Territorio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTerritorio, setSelectedTerritorio] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSectores, setTotalSectores] = useState(0)
  const { toast } = useToast()

  const pageSize = 20

  const loadSectores = async () => {
    setIsLoading(true)
    setError("")

    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      }

      if (selectedTerritorio !== "all") {
        params.territorio_id = Number.parseInt(selectedTerritorio)
      }

      const response = await apiClient.getSectores(params)

      if (response.data) {
        setSectores(Array.isArray(response.data) ? response.data : [])
        setTotalSectores(response.meta?.total || 0)
        setTotalPages(Math.ceil((response.meta?.total || 0) / pageSize))
      }
    } catch (error) {
      console.error("Sectores loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar sectores")
      toast({
        title: "Error",
        description: "No se pudieron cargar los sectores",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTerritorios = async () => {
    try {
      const response = await apiClient.getTerritorios()
      if (response.data) {
        setTerritorios(response.data)
      }
    } catch (error) {
      console.error("Territorios loading error:", error)
    }
  }

  useEffect(() => {
    loadTerritorios()
  }, [])

  useEffect(() => {
    loadSectores()
  }, [currentPage, selectedTerritorio])

  const handleTerritorioFilter = (value: string) => {
    setSelectedTerritorio(value)
    setCurrentPage(1)
  }

  const handleDeleteSector = async (sectorId: number) => {
    if (
      !confirm("¿Estás seguro de que deseas eliminar este sector? Esta acción puede fallar si hay viviendas activas.")
    ) {
      return
    }

    try {
      await apiClient.deleteSector(sectorId)
      toast({
        title: "Sector eliminado",
        description: "El sector ha sido eliminado exitosamente",
      })
      loadSectores() // Reload the list
    } catch (error) {
      console.error("Sector deletion error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar sector",
        variant: "destructive",
      })
    }
  }

  const getTerritorioNombre = (territorioId: number) => {
    const territorio = territorios.find((t) => t.territorio_id === territorioId)
    return territorio ? territorio.nombre : `ID: ${territorioId}`
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Sectores</h1>
          <p className="text-muted-foreground">Administra todos los sectores del sistema de salud comunitaria</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra sectores por territorio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="w-full md:w-64">
                <Label>Territorio</Label>
                <Select value={selectedTerritorio} onValueChange={handleTerritorioFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los territorios" />
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sectores Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sectores ({totalSectores})</CardTitle>
                <CardDescription>Lista de sectores registrados en el sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sectores.length === 0 ? (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No se encontraron sectores</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Territorio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectores.map((sector) => (
                      <TableRow key={sector.sector_id}>
                        <TableCell>
                          <Badge variant="secondary">{sector.sector_id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{sector.nombre}</TableCell>
                        <TableCell>{getTerritorioNombre(sector.territorio_id)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/sectores/${sector.sector_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/sectores/${sector.sector_id}/viviendas`}>
                              <Button variant="ghost" size="sm">
                                <Home className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSector(sector.sector_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({totalSectores} sectores total)
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
