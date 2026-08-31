import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api, type Station } from "@/lib/api"
import { HighchartsDashboard } from "@/components/highcharts-dashboard"
import { StationMap } from "@/components/station-map"
import { StationStatusBadge } from "@/components/station-status-badge"
import { PageShell, PageHeader } from "@/components/page-shell"

export const dynamic = "force-dynamic"

async function fetchStation(stationId: string): Promise<Station | null> {
  try {
    return await api.getStation(stationId)
  } catch (error) {
    console.error("Error fetching station:", error)
    return null
  }
}

const typeLabels: Record<string, string> = {
  MicroclimateStation: "Μικροκλιματικός Σταθμός",
  WeatherStation: "Μετεωρολογικός Σταθμός",
  IndoorAirQuality: "Σταθμός Ποιότητας Αέρα",
}

const metricLabels: Record<string, { label: string; icon: string; unit: string }> = {
  airTemperature: { label: "Θερμοκρασία Αέρα", icon: "🌡", unit: "°C" },
  airRelativeHumidity: { label: "Σχετική Υγρασία", icon: "💧", unit: "%" },
  soilTemperature: { label: "Θερμοκρασία Εδάφους", icon: "🌱", unit: "°C" },
  soilMoisture: { label: "Υγρασία Εδάφους", icon: "🌾", unit: "%" },
  soilElectricalConductivity: { label: "Ηλ. Αγωγιμότητα", icon: "⚡", unit: "dS/m" },
  soilSalinity: { label: "Αλατότητα Εδάφους", icon: "🧂", unit: "ppm" },
  soilTDS: { label: "TDS Εδάφους", icon: "🧪", unit: "ppm" },
  leafWetness: { label: "Υγρασία Φύλλων", icon: "🍃", unit: "%" },
  rain: { label: "Βροχόπτωση", icon: "🌧", unit: "mm" },
  rainRate: { label: "Ένταση Βροχής", icon: "⛈", unit: "mm/h" },
  solarRadiation: { label: "Ηλιακή Ακτινοβολία", icon: "☀", unit: "W/m²" },
  windSpeed: { label: "Ταχύτητα Ανέμου", icon: "💨", unit: "m/s" },
  gustWindSpeed: { label: "Ριπές Ανέμου", icon: "🌪", unit: "m/s" },
  windDirection: { label: "Διεύθυνση Ανέμου", icon: "🧭", unit: "°" },
  PM10: { label: "PM10", icon: "🏭", unit: "µg/m³" },
  PM2d5: { label: "PM2.5", icon: "🏭", unit: "µg/m³" },
  PM1d0: { label: "PM1.0", icon: "🏭", unit: "µg/m³" },
  SO2: { label: "SO₂", icon: "🏭", unit: "ppb" },
  vocIndex: { label: "Δείκτης VOC", icon: "🌬", unit: "" },
  ambientIlluminance: { label: "Φωτεινότητα", icon: "💡", unit: "lux" },
}

export default async function StationDashboardPage({
  params,
}: {
  params: Promise<{ stationId: string }>
}) {
  const { stationId } = await params
  const station = await fetchStation(stationId)

  if (!station) {
    notFound()
  }

  const stationName = station.name || station.product_id || station.serial_number || "Άγνωστος Σταθμός"
  const metrics = station.metrics || {}
  const metricEntries = Object.entries(metrics)

  return (
    <PageShell>
      <div className="@container/main flex flex-col gap-8">
        {/* Station Header */}
        <PageHeader
          icon={
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          title={stationName}
          subtitle={
            <span className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="rounded-full text-[10px] border-primary/15 px-2.5">
                {typeLabels[station.type] || station.type}
              </Badge>
              <StationStatusBadge station={station} />
            </span>
          }
          actions={
            station.last_seen ? (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Τελ. Ενημέρωση</p>
                <p className="text-sm text-foreground tabular-nums">
                  {new Date(station.last_seen).toLocaleString("el-GR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ) : undefined
          }
        />

        {/* Map + Latest Readings Row */}
        <div className="grid grid-cols-1 @3xl/main:grid-cols-3 gap-4">
            {/* Station Map */}
            {station.latitude && station.longitude && (
              <div className="@3xl/main:col-span-1">
                <Card className="app-card border-border/50 overflow-hidden h-full flex flex-col gap-0 pb-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-medium">Τοποθεσία</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 flex-1 min-h-[260px]">
                    <StationMap stations={[station]} height="100%" frameless />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Latest Readings Grid */}
            <div className={station.latitude && station.longitude ? "@3xl/main:col-span-2" : "@3xl/main:col-span-3"}>
              <Card className="app-card border-border/50 overflow-hidden h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Τελευταίες Μετρήσεις</CardTitle>
                  <CardDescription className="text-xs">
                    Τρέχουσες τιμές αισθητήρων
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metricEntries.length > 0 ? (
                    <div className="grid grid-cols-2 @xl/main:grid-cols-3 @3xl/main:grid-cols-4 gap-3">
                      {metricEntries.map(([key, reading]) => {
                        const meta = metricLabels[key] || { label: key, icon: "📊", unit: "" }
                        return (
                          <div
                            key={key}
                            className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/30"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{meta.icon}</span>
                              <span className="text-[11px] text-muted-foreground truncate">{meta.label}</span>
                            </div>
                            <div className="font-display text-xl tabular-nums text-foreground">
                              {Number(reading.value).toFixed(1)}
                              <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                {reading.unit || meta.unit}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(reading.recorded_at).toLocaleString("el-GR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμες μετρήσεις</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        {/* Historical Data Charts */}
        <div>
          <div className="mb-4">
            <h2 className="font-display text-lg tracking-tight text-foreground">
              Ιστορικά Δεδομένα
            </h2>
            <p className="text-sm text-muted-foreground">
              Χρονοσειρές και τάσεις μετρήσεων
            </p>
          </div>
          <HighchartsDashboard entityId={stationId} />
        </div>
      </div>
    </PageShell>
  )
}
