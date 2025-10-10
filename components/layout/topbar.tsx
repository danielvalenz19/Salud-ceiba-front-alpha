"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Shield, Clock, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ProfileMenu from "@/components/profile/profile-menu"
import ThemeToggle from "@/components/shared/theme-toggle"

export function Topbar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Get user initials for avatar (robust: accept undefined/non-string)
  const getUserInitials = (nameLike: unknown) => {
    const name = typeof nameLike === "string" && nameLike.trim() ? nameLike.trim() : ""
    if (!name) return ""
    return name
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0) : ""))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Robust role normalization helper
  const toRoleKey = (roleLike: unknown): string => {
    if (roleLike == null) return ""
    if (typeof roleLike === "string") return roleLike
    if (Array.isArray(roleLike)) return toRoleKey(roleLike[0])
    if (typeof roleLike === "object") {
      const o = roleLike as any
      return toRoleKey(o.name ?? o.role ?? o.rol ?? o.type ?? o.id)
    }
    return String(roleLike)
  }

  // Get role color variant
  const getRoleVariant = (roleLike: unknown) => {
    switch (toRoleKey(roleLike).trim().toLowerCase()) {
      case "admin":
        return "destructive"
      case "coordinador":
        return "default"
      case "promotor":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Format last login time
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Hace menos de 1 hora"
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`
    }
  }

  return (
  <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 overflow-visible">
      <div className="flex h-16 items-center justify-between px-6">
  <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">Sistema de Salud Comunitaria</h1>
          {user && (() => {
            const displayRole = toRoleKey((user as any).rol ?? (user as any).role) || "Invitado"
            return (
              <Badge variant={getRoleVariant(displayRole)} className="text-xs">
                {displayRole}
              </Badge>
            )
          })()}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="hidden md:flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatLastLogin((user as any).ultimo_acceso || user.creado_en)}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          )}
          {/* Theme switcher */}
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
