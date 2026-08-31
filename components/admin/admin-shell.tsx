"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconShieldLock,
  IconLayoutDashboard,
  IconUsersGroup,
  IconRefresh,
  IconBuildingBroadcastTower,
  IconFlask,
  IconLogout,
} from "@tabler/icons-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useAdminAuth } from "@/lib/admin-auth"

const ADMIN_NAV = [
  { title: "Επισκόπηση", url: "/admin", icon: IconLayoutDashboard },
  { title: "Προφίλ FINoT", url: "/admin/profiles", icon: IconUsersGroup },
  { title: "Συγχρονισμός", url: "/admin/sync", icon: IconRefresh },
  { title: "Σταθμοί", url: "/admin/stations", icon: IconBuildingBroadcastTower },
  { title: "API Tester", url: "/admin/api-test", icon: IconFlask },
]

/**
 * Wrapper for all protected admin pages: redirects unauthenticated visitors
 * to /admin/login and renders the shared admin sub-navigation bar.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { ready, isAuthenticated, email, logout } = useAdminAuth()

  React.useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/admin/login")
    }
  }, [ready, isAuthenticated, router])

  if (!ready || !isAuthenticated) {
    return (
      <PageShell className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="text-primary" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1 rounded-full border border-border/50 bg-card/50 p-1 backdrop-blur-sm">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url)
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="size-3.5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <IconShieldLock className="size-3.5 text-primary" />
            {email}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => {
              logout()
              router.replace("/admin/login")
            }}
          >
            <IconLogout className="size-3.5" />
            Αποσύνδεση
          </Button>
        </div>
      </div>

      {children}
    </PageShell>
  )
}
