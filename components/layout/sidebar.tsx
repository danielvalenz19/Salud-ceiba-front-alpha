"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, MapPin, Building, UserCheck, BarChart3, Stethoscope, Shield, Activity } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Usuarios",
    href: "/users",
    icon: Users,
  },
  {
    name: "Territorios",
    href: "/territorios",
    icon: MapPin,
  },
  {
    name: "Sectores",
    href: "/sectores",
    icon: Building,
  },
  {
    name: "Viviendas",
    href: "/viviendas",
    icon: Building,
  },
  {
    name: "Personas",
    href: "/personas",
    icon: UserCheck,
  },
  {
    name: "Eventos Clínicos",
    href: "/eventos",
    icon: Stethoscope,
  },
  {
    name: "Coberturas",
    href: "/coberturas",
    icon: Shield,
  },
  {
    name: "Salud Pública",
    href: "/salud-publica",
    icon: Activity,
  },
  {
    name: "Métricas",
    href: "/metricas",
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Navegación</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
