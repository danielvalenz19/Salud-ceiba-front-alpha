"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string | string[]
  requiredPermission?: string
}

export function AuthGuard({ children, requiredRole, requiredPermission }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[v0] AuthGuard checking authentication...")

      // Wait for auth context to finish loading
      if (isLoading) {
        return
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log("[v0] User not authenticated, redirecting to login")
        router.push("/login")
        return
      }

      // Check role requirements
      if (requiredRole && !hasRole(requiredRole)) {
        console.log("[v0] User lacks required role:", requiredRole, "User role:", user?.rol)
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta página",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      // Check permission requirements
      if (requiredPermission && !hasPermission(requiredPermission)) {
        console.log("[v0] User lacks required permission:", requiredPermission)
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para realizar esta acción",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      console.log("[v0] Auth check passed for user:", user?.email)
      setIsChecking(false)
    }

    checkAuth()
  }, [isLoading, isAuthenticated, user, requiredRole, requiredPermission, hasRole, hasPermission, router, toast])

  // Show loading spinner while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or authorized
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
