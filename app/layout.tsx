import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AppSidebar } from "@/components/dashboard-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { api, type Station } from "@/lib/api"
import "./globals.css";


const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "AegeanSense",
  title: {
    default: "AegeanSense",
    template: "%s | AegeanSense",
  },
  description: "AegeanSense: real-time environmental monitoring for microclimate, weather, soil, and air quality across the Aegean.",
  icons: {
    icon: [
      { url: "/logo.ico", sizes: "any" },
      { url: "/logo-aegeansense-symbol.png", type: "image/png" },
    ],
    apple: "/logo-aegeansense-symbol.png",
  },
};

async function fetchStations(): Promise<Station[]> {
  try {
    return await api.getStations({}, { next: { revalidate: 120 } })
  } catch (error) {
    console.error("Error fetching stations for sidebar:", error)
    return []
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stations = await fetchStations()

  return (
    <html lang="el" suppressHydrationWarning>
      <body
        className={` ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="app-theme"
        >
          <SidebarProvider
            defaultOpen
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" stations={stations} />
            <SidebarInset>
              <SiteHeader />
              <main className="relative">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
