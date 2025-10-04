"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminOnly } from "@/components/auth/admin-only"
import { RoleGuard } from "@/components/auth/role-guard"
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient, type User } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const pageSize = 20

  const loadUsers = async () => {
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

      if (selectedRole !== "all") {
        params.rol = selectedRole
      }

      if (selectedStatus !== "all") {
        params.activo = selectedStatus === "active"
      }

      const response = await apiClient.getUsers(params)

      if (response.data) {
        setUsers(response.data)
        setTotalUsers(response.meta?.total || 0)
        setTotalPages(Math.ceil((response.meta?.total || 0) / pageSize))
      }
    } catch (error) {
      console.error("Users loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar usuarios")
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await apiClient.getRoles()
      if (response.data) {
        setRoles(response.data)
      }
    } catch (error) {
      console.error("Roles loading error:", error)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [currentPage, searchQuery, selectedRole, selectedStatus])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("¿Estás seguro de que deseas desactivar este usuario?")) {
      return
    }

    try {
      await apiClient.deleteUser(userId)
      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado exitosamente",
      })
      loadUsers() // Reload the list
    } catch (error) {
      console.error("User deletion error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al desactivar usuario",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleViewUser = (user: User) => {
    window.location.href = `/users/${user.user_id}`
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios del sistema de salud comunitaria</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <CreateUserDialog
              roles={roles}
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                loadUsers()
              }}
            />
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra y busca usuarios en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label>Rol</Label>
                <Select value={selectedRole} onValueChange={handleRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Label>Estado</Label>
                <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuarios ({totalUsers})</CardTitle>
                <CardDescription>Lista de usuarios registrados en el sistema</CardDescription>
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
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.nombre}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.rol}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.activo ? "default" : "destructive"}>
                            {user.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.creado_en).toLocaleDateString("es-ES")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AdminOnly>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.user_id)}
                                disabled={!user.activo}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AdminOnly>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({totalUsers} usuarios total)
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

        {selectedUser && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <EditUserDialog
              key={selectedUser.user_id}
              user={selectedUser}
              roles={roles}
              onClose={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
              }}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
                loadUsers()
              }}
            />
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}

function CreateUserDialog({
  roles,
  onClose,
  onSuccess,
}: {
  roles: string[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "",
    password: "",
    persona_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!formData.nombre || !formData.email || !formData.rol || !formData.password) {
      setError("Todos los campos obligatorios deben ser completados")
      setIsSubmitting(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    const email = formData.email.trim()
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un email válido")
      setIsSubmitting(false)
      return
    }

    try {
      const userData: any = {
        nombre: formData.nombre.trim(),
        email,
        rol: (formData.rol || '').toLowerCase(),
        password: formData.password,
      }

      if (formData.persona_id) {
        userData.persona_id = Number.parseInt(formData.persona_id)
      }

      await apiClient.createUser(userData)

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      })
      onSuccess()
    } catch (error) {
      console.error("User creation error:", error)
      setError(error instanceof Error ? error.message : "Error al crear usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogDescription>Completa la información para crear un nuevo usuario en el sistema</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="usuario@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rol">Rol *</Label>
          <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="persona_id">ID Persona (opcional)</Label>
          <Input
            id="persona_id"
            type="number"
            value={formData.persona_id}
            onChange={(e) => setFormData({ ...formData, persona_id: e.target.value })}
            placeholder="123"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Usuario"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function EditUserDialog({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: User
  roles: string[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    nombre: user.nombre || "",
    email: user.email || "",
    rol: (user.rol || "").toLowerCase(),
    password: "",
    activo: ((): boolean => {
      const raw = (user as any)?.activo
      return typeof raw === 'number' ? raw === 1 : Boolean(raw)
    })(),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return
    setFormData({
      nombre: user.nombre || "",
      email: user.email || "",
      rol: (user.rol || "").toLowerCase(),
      password: "",
      activo: ((): boolean => {
        const raw = (user as any)?.activo
        return typeof raw === 'number' ? raw === 1 : Boolean(raw)
      })(),
    })
  }, [user?.user_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
      const email = (formData.email || "").trim()
      if (email && !emailRegex.test(email)) {
        setError("Email inválido. Debe tener dominio con punto (ej: usuario@empresa.com).")
        setIsSubmitting(false)
        return
      }

      const updateData: any = {
        nombre: (formData.nombre || '').trim(),
        email,
        rol: (formData.rol || '').toLowerCase(),
        activo: Boolean(formData.activo),
      }

      if (formData.password) {
        updateData.password = formData.password
      }

  console.log('PUT /users/:id URL =>', `/users/${user.user_id}`)
  console.log('PUT payload =>', updateData)
  await apiClient.updateUser(user.user_id, updateData)

      toast({
        title: "Usuario actualizado",
        description: formData.password
          ? "Usuario actualizado. La sesión puede invalidarse si cambió la contraseña."
          : "El usuario ha sido actualizado exitosamente",
      })
      onSuccess()
    } catch (error) {
      console.error("User update error:", error)
      setError(error instanceof Error ? error.message : "Error al actualizar usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogDescription>Modifica la información del usuario</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-nombre">Nombre</Label>
          <Input
            id="edit-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="usuario@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-rol">Rol</Label>
          <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
          <Input
            id="edit-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Dejar vacío para mantener actual"
          />
          {formData.password && (
            <p className="text-sm text-muted-foreground">Cambiar la contraseña puede invalidar la sesión actual</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-activo">Estado</Label>
          <Select
            value={formData.activo ? "true" : "false"}
            onValueChange={(value) => setFormData({ ...formData, activo: value === "true" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Actualizar Usuario"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
