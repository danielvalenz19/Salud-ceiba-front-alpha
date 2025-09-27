"use client"

import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { SessionMonitor } from "@/components/auth/session-monitor"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthGuard>
      <div className="h-screen flex flex-col">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="p-6">{children}</div>
          </main>
        </div>
        <Toaster />
        <SessionMonitor />
      </div>
    </AuthGuard>
  )
}
