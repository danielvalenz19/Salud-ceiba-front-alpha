"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient, type User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  hasRole: (role: string | string[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Check if user has specific role(s)
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false

    if (Array.isArray(role)) {
      return role.includes(user.rol)
    }

    return user.rol === role
  }

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ["*"], // Admin has all permissions
      coordinador: [
        "users.read",
        "users.create",
        "users.update",
        "territories.read",
        "territories.create",
        "territories.update",
        "sectors.read",
        "sectors.create",
        "sectors.update",
        "houses.read",
        "houses.create",
        "houses.update",
        "people.read",
        "people.create",
        "people.update",
        "events.read",
        "events.create",
        "events.update",
      ],
      promotor: [
        "territories.read",
        "sectors.read",
        "houses.read",
        "houses.create",
        "houses.update",
        "people.read",
        "people.create",
        "people.update",
        "events.read",
        "events.create",
        "events.update",
      ],
    }

    const userPermissions = rolePermissions[user.rol] || []

    // Admin has all permissions
    if (userPermissions.includes("*")) return true

    return userPermissions.includes(permission)
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log("[v0] Initializing auth context...")

      try {
        if (apiClient.isAuthenticated()) {
          console.log("[v0] Token found, fetching user profile...")
          const response = await apiClient.getProfile()

          if (response.data) {
            console.log("[v0] User profile loaded:", response.data.email)
            setUser(response.data)
          }
        } else {
          console.log("[v0] No valid token found")
        }
      } catch (error) {
        console.error("[v0] Auth initialization error:", error)
        // Clear invalid token
        localStorage.removeItem("token")
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    console.log("[v0] Attempting login for:", email)

    const response = await apiClient.login(email, password)

    if (response.data?.user) {
      console.log("[v0] Login successful for:", response.data.user.email)
      setUser(response.data.user)
    } else {
      throw new Error("Invalid login response")
    }
  }

  const logout = async () => {
    console.log("[v0] Logging out user...")

    try {
      await apiClient.logout()
    } catch (error) {
      console.error("[v0] Logout API error:", error)
    } finally {
      setUser(null)
      localStorage.removeItem("token")
    }
  }

  const refreshToken = async () => {
    console.log("[v0] Refreshing token...")

    try {
      const response = await apiClient.refreshToken()

      if (response.data?.user) {
        console.log("[v0] Token refreshed successfully")
        setUser(response.data.user)
      }
    } catch (error) {
      console.error("[v0] Token refresh failed:", error)
      // If refresh fails, logout user
      await logout()
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    hasRole,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
