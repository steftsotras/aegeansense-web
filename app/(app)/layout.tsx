import { AppSidebar } from "@/components/dashboard-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { api, type Station } from "@/lib/api"

async function fetchStations(): Promise<Station[]> {
  try {
    return await api.getStations({}, { next: { revalidate: 120 } })
  } catch (error) {
    console.error("Error fetching stations for sidebar:", error)
    return []
  }
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const stations = await fetchStations()

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 58)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar stations={stations} />
      <SidebarInset>
        <SiteHeader />
        <main className="relative">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
