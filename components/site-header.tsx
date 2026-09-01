"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"

const routeConfig: Record<string, { title: string; parent?: { title: string; href: string } }> = {
  "/": { title: "Αρχική" },
  "/stations": { title: "Σταθμοί" },
  "/dashboard": { title: "Πίνακας Ελέγχου" },
  "/sync": { title: "Συγχρονισμός" },
  "/about": { title: "Σχετικά" },
}

function getRouteInfo(pathname: string) {
  if (routeConfig[pathname]) return routeConfig[pathname]
  if (pathname.startsWith("/dashboard/")) {
    return { title: "Σταθμός", parent: { title: "Πίνακας Ελέγχου", href: "/dashboard" } }
  }
  if (pathname.startsWith("/stations/")) {
    return { title: "Σταθμός", parent: { title: "Σταθμοί", href: "/stations" } }
  }
  return { title: "Σελίδα" }
}

export function SiteHeader() {
  const pathname = usePathname()
  const routeInfo = getRouteInfo(pathname)
  const isHome = pathname === "/"

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Αρχική
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {!isHome && (
              <>
                <BreadcrumbSeparator />
                {routeInfo.parent ? (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={routeInfo.parent.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          {routeInfo.parent.title}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-sm font-medium">{routeInfo.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm font-medium">{routeInfo.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          {/* <Image
            src="/ellada-2.0-logo_gr.png"
            alt="Ελλάδα 2.0"
            width={116}
            height={43}
            className="hidden h-7 w-auto object-contain sm:block"
            priority
          /> */}
          {/* <Separator orientation="vertical" className="mx-1 hidden data-[orientation=vertical]:h-5 sm:block" /> */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 border border-primary/12">
            <div className="w-1.5 h-1.5 rounded-full bg-primary app-pulse" />
            <span className="text-[11px] font-semibold text-primary tracking-wide">LIVE</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
