"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MainLayout } from "@/components/layout/main-layout"
import { Users, Search, Eye, Edit, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { apiClient, type PersonaBasic } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function PersonasPage() {
  const [personas, setPersonas] = useState<PersonaBasic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [dpiQuery, setDpiQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPersonas, setTotalPersonas] = useState(0)
  const { toast } = useToast()

  const pageSize = 20

  const loadPersonas = async () => {
    setIsLoading(true)
    setError("")

    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      }

      if (searchQuery.trim()) {
        params.q = searchQuery.trim()
      }

      if (dpiQuery.trim()) {
        params.dpi = dpiQuery.trim()
      }

      const response = await apiClient.getPersonas(params)

      if (response.data) {
        setPersonas(response.data)
        setTotalPersonas(response.meta?.total || 0)
        setTotalPages(Math.ceil((response.meta?.total || 0) / pageSize))
      }
    } catch (error) {
      console.error("Personas loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar personas")
      toast({
        title: "Error",
        description: "No se pudieron cargar las personas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPersonas()
  }, [currentPage, searchQuery, dpiQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleDpiSearch = (value: string) => {
    setDpiQuery(value)
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Personas</h1>
          <p className="text-muted-foreground">Búsqueda global de personas en el sistema de salud comunitaria</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Búsqueda</CardTitle>
            <CardDescription>Busca personas por nombre o DPI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar por nombre</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombres o apellidos..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Label htmlFor="dpi">Buscar por DPI</Label>
                <Input
                  id="dpi"
                  placeholder="Número de DPI..."
                  value={dpiQuery}
                  onChange={(e) => handleDpiSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personas Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personas ({totalPersonas})</CardTitle>
                <CardDescription>Lista de personas registradas en el sistema</CardDescription>
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
            ) : personas.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No se encontraron personas</p>
                {(searchQuery || dpiQuery) && (
                  <p className="text-sm text-muted-foreground mt-2">Intenta con otros términos de búsqueda</p>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombres</TableHead>
                      <TableHead>Apellidos</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>DPI</TableHead>
                      <TableHead>Fecha Nacimiento</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personas.map((persona) => (
                      <TableRow key={persona.persona_id}>
                        <TableCell>
                          <Badge variant="secondary">{persona.persona_id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{persona.nombres}</TableCell>
                        <TableCell>{persona.apellidos}</TableCell>
                        <TableCell>
                          <Badge variant={persona.sexo === "M" ? "default" : "outline"}>
                            {persona.sexo === "M" ? "M" : "F"}
                          </Badge>
                        </TableCell>
                        <TableCell>{persona.dpi || "Sin DPI"}</TableCell>
                        <TableCell>
                          {persona.fecha_nac ? new Date(persona.fecha_nac).toLocaleDateString("es-ES") : "Sin fecha"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/personas/${persona.persona_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/personas/${persona.persona_id}?edit=1`}>
                              <Button variant="ghost" size="sm" aria-label="Editar persona">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
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
                      Página {currentPage} de {totalPages} ({totalPersonas} personas total)
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
