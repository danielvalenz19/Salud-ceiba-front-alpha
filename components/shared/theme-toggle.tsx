"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

type Props = {
  className?: string
}

export default function ThemeToggle({ className }: Props) {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by rendering only on client
  useEffect(() => setMounted(true), [])

  const current = theme === "system" ? systemTheme : theme
  const isDark = current === "dark"

  const toggle = () => setTheme(isDark ? "light" : "dark")

  if (!mounted) return null

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onClick={toggle}
            className={cn("relative h-9 w-9", className)}
          >
            {/* Sun icon shows in light, moon in dark */}
            <Sun className={cn("h-4 w-4 transition-all", isDark ? "scale-0 rotate-90" : "scale-100 rotate-0")} />
            <Moon className={cn("absolute h-4 w-4 transition-all", isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90")} />
            <span className="sr-only">Alternar tema</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isDark ? "Modo oscuro" : "Modo claro"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
