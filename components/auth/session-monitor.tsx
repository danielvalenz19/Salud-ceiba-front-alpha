"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle } from "lucide-react"

export function SessionMonitor() {
  const { user, refreshToken, logout } = useAuth()
  const { toast } = useToast()
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)
  const [isExtending, setIsExtending] = useState(false)

  useEffect(() => {
    if (!user) return

    const checkTokenExpiry = () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        // Decode JWT token to get expiry time
        const payload = JSON.parse(atob(token.split(".")[1]))
        const expiryTime = payload.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()
        const timeLeft = expiryTime - currentTime

        console.log("[v0] Token expires in:", Math.floor(timeLeft / 1000 / 60), "minutes")

        // Show warning 5 minutes before expiry
        if (timeLeft <= 5 * 60 * 1000 && timeLeft > 0) {
          setTimeUntilExpiry(Math.floor(timeLeft / 1000))
          setShowExpiryWarning(true)
        }

        // Auto logout if token expired
        if (timeLeft <= 0) {
          console.log("[v0] Token expired, logging out")
          toast({
            title: "Sesión expirada",
            description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          })
          logout()
        }
      } catch (error) {
        console.error("[v0] Error checking token expiry:", error)
      }
    }

    // Check immediately
    checkTokenExpiry()

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000)

    return () => clearInterval(interval)
  }, [user, logout, toast])

  // Update countdown timer
  useEffect(() => {
    if (!showExpiryWarning || !timeUntilExpiry) return

    const countdown = setInterval(() => {
      setTimeUntilExpiry((prev) => {
        if (!prev || prev <= 1) {
          setShowExpiryWarning(false)
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [showExpiryWarning, timeUntilExpiry])

  const handleExtendSession = async () => {
    setIsExtending(true)
    try {
      await refreshToken()
      setShowExpiryWarning(false)
      setTimeUntilExpiry(null)
      toast({
        title: "Sesión extendida",
        description: "Tu sesión ha sido extendida exitosamente",
      })
    } catch (error) {
      console.error("[v0] Error extending session:", error)
      toast({
        title: "Error",
        description: "No se pudo extender la sesión. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      })
      logout()
    } finally {
      setIsExtending(false)
    }
  }

  const handleLogout = () => {
    setShowExpiryWarning(false)
    logout()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Dialog open={showExpiryWarning} onOpenChange={setShowExpiryWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Sesión por expirar</span>
            </DialogTitle>
            <DialogDescription>
              Tu sesión expirará pronto. ¿Deseas extender tu sesión para continuar trabajando?
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Tiempo restante: <strong>{timeUntilExpiry ? formatTime(timeUntilExpiry) : "0:00"}</strong>
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto bg-transparent">
              Cerrar Sesión
            </Button>
            <Button onClick={handleExtendSession} disabled={isExtending} className="w-full sm:w-auto">
              {isExtending ? "Extendiendo..." : "Extender Sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
