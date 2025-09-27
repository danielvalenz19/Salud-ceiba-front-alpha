"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: string | string[]
  requiredPermission?: string
  fallback?: React.ReactNode
  showFallback?: boolean
}

export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  showFallback = false,
}: RoleGuardProps) {
  const { hasRole, hasPermission } = useAuth()

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return showFallback ? <>{fallback}</> : null
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return showFallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
