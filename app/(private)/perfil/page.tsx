"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserRound } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function PerfilPage() {
  const { user } = useAuth()

  const nombre = user?.nombre ?? "Usuario"
  const correo = user?.email ?? "usuario@correo.com"
  const rol = (user as any)?.rol ?? (user as any)?.role ?? "Operador"
  const registrado = user?.creado_en?.slice(0, 10) ?? "2025-01-01"

  const initials = nombre
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil de usuario</h1>
          <p className="text-muted-foreground">Información de tu cuenta y preferencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-foreground text-background">{initials || "US"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-semibold">{nombre}</div>
                <div className="text-sm text-muted-foreground">{correo}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Rol</span>
                <Badge variant="outline">{rol}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Miembro desde</span>
                <span className="text-muted-foreground">{registrado}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos básicos</CardTitle>
              <CardDescription>Solo lectura por ahora.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={nombre} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input value={correo} readOnly />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>Puedes alternar el modo oscuro desde el menú del avatar.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Abre el menú del perfil (arriba a la derecha) para cambiar el tema y la contraseña.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>Cambia tu contraseña desde el menú del avatar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    document
                      .querySelector<HTMLButtonElement>('[aria-label="Abrir menú de perfil"]')
                      ?.click()
                  }}
                >
                  Abrir menú de perfil
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
