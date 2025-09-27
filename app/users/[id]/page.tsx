"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MainLayout } from "@/components/layout/main-layout"
import { RoleGuard } from "@/components/auth/role-guard"
import { User, Edit, Calendar, Mail, Shield } from "lucide-react"
import { apiClient, type User as UserType } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function UserDetailPage() {
  const params = useParams()
  const userId = Number.parseInt(params.id as string)

  const [user, setUser] = useState<UserType | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadUser = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.getUserById(userId)
      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error("User loading error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar usuario")
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
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
    if (userId) {
      loadUser()
      loadRoles()
    }
  }, [userId])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !user) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "No se pudo cargar la información del usuario"}</AlertDescription>
        </Alert>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/users">Usuarios</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{user.nombre}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <User className="h-8 w-8 text-primary" />
              <span>{user.nombre}</span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary">ID: {user.user_id}</Badge>
              <Badge variant="outline">{user.rol}</Badge>
              <Badge variant={user.activo ? "default" : "destructive"}>{user.activo ? "Activo" : "Inactivo"}</Badge>
            </div>
          </div>
          <RoleGuard requiredRole={["admin", "coordinador"]}>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </RoleGuard>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información del Usuario</span>
              </CardTitle>
              <CardDescription>Datos básicos y configuración</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID de Usuario:</span>
                  <span className="font-medium">{user.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="font-medium">{user.nombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rol:</span>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{user.rol}</Badge>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={user.activo ? "default" : "destructive"}>{user.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
                {user.persona_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Persona:</span>
                    <span className="font-medium">{user.persona_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Detalles de la Cuenta</span>
              </CardTitle>
              <CardDescription>Información de registro y actividad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de Creación:</span>
                  <span className="font-medium">
                    {new Date(user.creado_en).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora de Creación:</span>
                  <span className="font-medium">{new Date(user.creado_en).toLocaleTimeString("es-ES")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        {user && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <EditUserDialog
              user={user}
              roles={roles}
              onClose={() => setIsEditDialogOpen(false)}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                loadUser()
              }}
            />
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}

function EditUserDialog({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: UserType
  roles: string[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    password: "",
    confirmPassword: "",
    activo: user.activo,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    // Validations
    if (!formData.nombre || !formData.email || !formData.rol) {
      setError("Nombre, email y rol son requeridos")
      setIsSubmitting(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un email válido")
      setIsSubmitting(false)
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsSubmitting(false)
      return
    }

    try {
      const updateData: any = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        activo: formData.activo,
      }

      if (formData.password) {
        updateData.password = formData.password
      }

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
          <Label htmlFor="edit-nombre">Nombre *</Label>
          <Input
            id="edit-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-email">Email *</Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="usuario@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-rol">Rol *</Label>
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
        </div>

        {formData.password && (
          <div className="space-y-2">
            <Label htmlFor="edit-confirm-password">Confirmar Contraseña *</Label>
            <Input
              id="edit-confirm-password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirmar nueva contraseña"
              required
            />
            <p className="text-sm text-muted-foreground">Cambiar la contraseña puede invalidar la sesión actual</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-activo">Estado *</Label>
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
