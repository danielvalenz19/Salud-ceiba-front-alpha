"use client"

import type React from "react"
import { RoleGuard } from "./role-guard"

interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showFallback?: boolean
}

export function AdminOnly({ children, fallback, showFallback = false }: AdminOnlyProps) {
  return (
    <RoleGuard requiredRole="admin" fallback={fallback} showFallback={showFallback}>
      {children}
    </RoleGuard>
  )
}
