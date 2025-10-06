"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut, Moon, Sun, UserRound, KeyRound, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function ProfileMenu() {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const [openPwd, setOpenPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const getInitials = (name?: string) => {
    if (!name) return "US"
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  async function doLogout() {
    try {
      await logout()
    } catch {
      // ignore
    } finally {
      router.replace("/login")
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword.length < 8) {
      toast({ title: "Contraseña insegura", description: "Mínimo 8 caracteres.", variant: "destructive" })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "No coinciden", description: "La confirmación no coincide.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await apiClient.changePassword({
        current_password: form.currentPassword,
        new_password: form.newPassword,
      })
      toast({ title: "Listo", description: "Contraseña actualizada correctamente." })
      setOpenPwd(false)
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast({ title: "Error", description: "No se pudo cambiar la contraseña.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-full p-0 bg-foreground text-background hover:opacity-90"
            aria-label="Abrir menú de perfil"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-foreground text-background text-xs">
                {getInitials(user?.nombre)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

  <DropdownMenuContent align="end" sideOffset={8} className="w-64 bg-card text-card-foreground border-border" forceMount>
          <DropdownMenuLabel className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push("/perfil")} className="cursor-pointer">
            <UserRound className="h-4 w-4 mr-2" />
            Ver perfil
          </DropdownMenuItem>

          {theme === "dark" ? (
            <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
              <Sun className="h-4 w-4 mr-2" />
              Modo claro
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
              <Moon className="h-4 w-4 mr-2" />
              Modo oscuro
            </DropdownMenuItem>
          )}

          <Dialog open={openPwd} onOpenChange={setOpenPwd}>
            <DialogTrigger asChild>
              <DropdownMenuItem className="cursor-pointer">
                <KeyRound className="h-4 w-4 mr-2" />
                Cambiar contraseña
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogDescription>Actualiza tu contraseña de acceso.</DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={changePassword}>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenPwd(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={doLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
