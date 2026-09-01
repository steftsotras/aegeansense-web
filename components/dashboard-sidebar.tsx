"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconHome,
  IconChartLine,
  IconShieldLock,
  IconInfoCircle,
  IconCloudRain,
  IconTemperature,
  IconBuildingFactory,
  IconCircleFilled,
  IconChevronRight,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { BrandWordmark } from "@/components/brand-wordmark"
import { getStationActivity, relativeTimeGreek } from "@/lib/station-status"
import type { Station } from "@/lib/api"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  stations?: Station[]
}

const STATION_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  WeatherStation: {
    icon: IconCloudRain,
    label: "Μετεωρολογικοί",
  },
  MicroclimateStation: {
    icon: IconTemperature,
    label: "Μικροκλιματικοί",
  },
  IndoorAirQuality: {
    icon: IconBuildingFactory,
    label: "Ποιότητα Αέρα",
  },
}

function groupStationsByType(stations: Station[]): Record<string, Station[]> {
  return stations.reduce((acc, station) => {
    const type = station.type || "Unknown"
    if (!acc[type]) acc[type] = []
    acc[type].push(station)
    return acc
  }, {} as Record<string, Station[]>)
}

function getStationName(station: Station): string {
  return station.name || station.product_id || station.serial_number || "Άγνωστος Σταθμός"
}

export function AppSidebar({
  stations = [],
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const groupedStations = React.useMemo(() => groupStationsByType(stations), [stations])

  const navItems = [
    { title: "Αρχική", url: "/", icon: IconHome },
    { title: "Πίνακας Ελέγχου", url: "/dashboard", icon: IconChartLine },
    { title: "Διαχείριση", url: "/admin", icon: IconShieldLock },
  ]

  // Check if we're on a station dashboard page
  const activeStationId = React.useMemo(() => {
    const match = pathname.match(/^\/dashboard\/(.+)$/)
    return match ? match[1] : null
  }, [pathname])

  // Auto-expand station groups that contain the active station
  const defaultOpenTypes = React.useMemo(() => {
    if (!activeStationId) return [] as string[]
    for (const [type, typeStations] of Object.entries(groupedStations)) {
      if (typeStations.some((s) => s.id === activeStationId)) {
        return [type]
      }
    }
    return [] as string[]
  }, [activeStationId, groupedStations])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        {/* Brand */}
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className="h-auto min-h-14 px-2 py-2 hover:bg-sidebar-accent/70"
                >
                  <Link href="/" aria-label="AegeanSense — Αρχική">
                    <BrandWordmark
                      className="w-[156px] max-w-full"
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-sidebar-border" />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold">
            Πλοήγηση
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)}
                    tooltip={item.title}
                    className="rounded-md text-sidebar-foreground/70 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground"
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-sidebar-border" />

        {/* Stations */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold">
            Σταθμοί
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(groupedStations).map(([type, typeStations]) => {
                const config = STATION_TYPE_CONFIG[type] || {
                  icon: IconCloudRain,
                  label: type,
                }
                const StationIcon = config.icon
                const isDefaultOpen = defaultOpenTypes.includes(type)

                return (
                  <Collapsible key={type} defaultOpen={isDefaultOpen} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={config.label} className="rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground">
                          <StationIcon className="size-4 text-sidebar-foreground/45" />
                          <span className="text-sm">{config.label}</span>
                          <span className="ml-auto text-[10px] text-sidebar-foreground/30 tabular-nums">{typeStations.length}</span>
                          <IconChevronRight className="ml-1 size-3 text-sidebar-foreground/30 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {typeStations.map((station) => {
                            const activity = getStationActivity(station)
                            const isActive = activeStationId === station.id
                            return (
                              <SidebarMenuSubItem key={station.id}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive}
                                  className="rounded-md data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                                >
                                  <Link
                                    href={`/dashboard/${station.id}`}
                                    className="flex w-full items-center gap-2"
                                    title={`${activity.label} · ${relativeTimeGreek(station.last_seen)}`}
                                  >
                                    <IconCircleFilled
                                      className={cn(
                                        "size-2! shrink-0",
                                        activity.status === "online" && "text-emerald-400!",
                                        activity.status === "idle" && "text-amber-400!",
                                        activity.status === "offline" && "text-rose-400!"
                                      )}
                                    />
                                    <span className="truncate text-xs">{getStationName(station)}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}

              {stations.length === 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled className="rounded-lg">
                    <span className="text-sidebar-foreground/30 text-sm">
                      Δεν βρέθηκαν σταθμοί
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* About - pushed to bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Πληροφορίες"
                  isActive={pathname === "/about"}
                  className="rounded-md text-sidebar-foreground/70 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground"
                >
                  <Link href="/about">
                    <IconInfoCircle className="size-4" />
                    <span>Πληροφορίες</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
