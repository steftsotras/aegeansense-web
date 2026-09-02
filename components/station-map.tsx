"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowRight, IconMapPin } from "@tabler/icons-react"
import type { MetricReading, Station } from "@/lib/api"

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

// Leaflet only measures its container once on init; if the layout settles
// afterwards the tiles stop short of the edge. Re-measure on any resize.
const MapAutoResize = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod
      return function MapAutoResize() {
        const map = useMap()
        useEffect(() => {
          map.invalidateSize()
          const observer = new ResizeObserver(() => map.invalidateSize())
          observer.observe(map.getContainer())
          return () => observer.disconnect()
        }, [map])
        return null
      }
    }),
  { ssr: false }
)

type MarkerStatus = "connected" | "recent" | "stale"

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

const MARKER_STATUS: Record<
  MarkerStatus,
  { color: string; foreground: string; label: string }
> = {
  connected: {
    color: "#1bd488",
    foreground: "#033e46",
    label: "Συνδεδεμένος",
  },
  recent: {
    color: "#d5a43a",
    foreground: "#3f3108",
    label: "Τελευταία ένδειξη εντός μήνα",
  },
  stale: {
    color: "#68746f",
    foreground: "#ffffff",
    label: "Τελευταία ένδειξη πριν από πάνω από μήνα",
  },
}

function getMarkerStatus(station: Pick<Station, "connection_status" | "last_seen">): MarkerStatus {
  if (station.connection_status === "CONNECTED") return "connected"
  if (!station.last_seen) return "stale"

  const lastSeen = new Date(station.last_seen).getTime()
  if (!Number.isFinite(lastSeen)) return "stale"

  return Date.now() - lastSeen <= ONE_MONTH_MS ? "recent" : "stale"
}

function getStationTypeIconSvg(type: string): string {
  const svgStart =
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'

  switch (type) {
    case "IndoorAirQuality":
      return `${svgStart}<path d="M3 21h18"/><path d="M5 21V9l6 3V8l8 4v9"/><path d="M9 21v-4h6v4"/><path d="M8 6V3"/><path d="M11 6V2"/></svg>`
    case "WeatherStation":
      return `${svgStart}<path d="M7 15a4 4 0 1 1 1.2-7.8A5.5 5.5 0 0 1 18.5 10H19a3 3 0 0 1 0 6H7z"/><path d="m8 19-1 2"/><path d="m13 19-1 2"/><path d="m18 19-1 2"/></svg>`
    case "MicroclimateStation":
      return `${svgStart}<path d="M10 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0z"/><path d="M13 11v6"/></svg>`
    default:
      return `${svgStart}<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2"/></svg>`
  }
}

// The category is rendered as an inline icon; station health controls its color.
const createIcon = (station: Station, variant: "default" | "newsprint") => {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet")
  const status = MARKER_STATUS[getMarkerStatus(station)]
  const size = variant === "newsprint" ? 32 : 34
  const markerHtml = `<div title="${status.label}" style="
      display: grid;
      place-items: center;
      width: ${size}px;
      height: ${size}px;
      color: ${status.foreground};
      background-color: ${status.color};
      border-radius: 9999px;
      border: 2px solid rgba(255,255,255,0.94);
      box-shadow: 0 0 0 2px rgba(5,91,101,0.18), 0 4px 12px rgba(5,91,101,0.24);
    ">${getStationTypeIconSvg(station.type)}</div>`

  return L.divIcon({
    className: "custom-marker",
    html: markerHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

const METRIC_LABELS: Record<string, string> = {
  airTemperature: "Θερμοκρασία",
  airRelativeHumidity: "Υγρασία αέρα",
  soilTemperature: "Θερμ. εδάφους",
  soilMoisture: "Υγρασία εδάφους",
  leafWetness: "Υγρασία φύλλων",
  rain: "Βροχόπτωση",
  rainRate: "Ένταση βροχής",
  solarRadiation: "Ηλιακή ακτινοβολία",
  windSpeed: "Άνεμος",
  gustWindSpeed: "Ριπές ανέμου",
  PM10: "PM10",
  PM2d5: "PM2.5",
  PM1d0: "PM1.0",
  SO2: "SO₂",
  vocIndex: "Δείκτης VOC",
}

const METRIC_PRIORITIES: Record<string, string[]> = {
  IndoorAirQuality: ["PM2d5", "PM10", "vocIndex", "PM1d0", "SO2"],
  WeatherStation: ["airTemperature", "airRelativeHumidity", "windSpeed", "rainRate", "rain"],
  MicroclimateStation: [
    "airTemperature",
    "soilMoisture",
    "soilTemperature",
    "airRelativeHumidity",
    "leafWetness",
  ],
}

interface QuickMetric {
  key: string
  label: string
  reading: MetricReading
}

function getQuickMetrics(station: Station): QuickMetric[] {
  const readings = station.metrics || {}
  const selected: QuickMetric[] = []
  const seen = new Set<string>()

  for (const key of METRIC_PRIORITIES[station.type] || []) {
    const reading = readings[key]
    if (!reading) continue
    selected.push({ key, label: METRIC_LABELS[key] || reading.label || key, reading })
    seen.add(key)
    if (selected.length === 3) return selected
  }

  for (const [key, reading] of Object.entries(readings)) {
    if (seen.has(key)) continue
    selected.push({ key, label: METRIC_LABELS[key] || reading.label || key, reading })
    if (selected.length === 3) break
  }

  return selected
}

function formatMetricValue(reading: MetricReading): string {
  const value = Number(reading.value)
  if (!Number.isFinite(value)) return "—"
  return value.toLocaleString("el-GR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  })
}

interface StationMapProps {
  stations: Station[]
  height?: string
  className?: string
  showCard?: boolean
  /** Render without its own border/rounding/shadow so it can sit flush inside a card. */
  frameless?: boolean
  cardTitle?: string
  cardDescription?: string
  variant?: "default" | "newsprint"
}

export function StationMap({
  stations,
  height = "500px",
  className = "",
  showCard = false,
  frameless = false,
  cardTitle = "Station Locations",
  cardDescription = "Interactive map showing the location of all monitoring stations",
  variant = "default",
}: StationMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate center point (average of all station coordinates)
  const stationsWithLocation = stations.filter(
    (s) => s.latitude !== null && s.longitude !== null
  )

  if (stationsWithLocation.length === 0) {
    return (
      <div
        className={`w-full bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-muted-foreground">No station locations available</p>
      </div>
    )
  }

  const centerLat =
    stationsWithLocation.reduce((sum, s) => sum + (s.latitude as number), 0) /
    stationsWithLocation.length

  const centerLng =
    stationsWithLocation.reduce((sum, s) => sum + (s.longitude as number), 0) /
    stationsWithLocation.length

  if (!mounted) {
    return (
      <div
        className={`w-full bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  const mapContent = (
    <div
      className={`relative isolate z-0 w-full ${
        frameless ? "" : "rounded-lg overflow-hidden border shadow-lg"
      } ${variant === "newsprint" ? "station-map-newsprint" : ""} ${className}`}
      style={{ height, minHeight: "200px" }}
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapAutoResize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stationsWithLocation.map((station) => {
          const lat = station.latitude as number
          const lng = station.longitude as number
          const markerStatus = getMarkerStatus(station)
          const status = MARKER_STATUS[markerStatus]
          const quickMetrics = getQuickMetrics(station)
          const icon = createIcon(station, variant) || undefined
          return (
            <Marker
              key={station.id}
              position={[lat, lng]}
              icon={icon || undefined}
            >
              <Popup>
                <div className="min-w-[240px] p-1">
                  <h3 className="pr-3 text-sm font-semibold leading-5 text-foreground">
                    {station.name || station.product_id || "Άγνωστος σταθμός"}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span>{status.label}</span>
                  </div>

                  {quickMetrics.length > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {quickMetrics.map(({ key, label, reading }) => (
                        <div key={key} className="rounded-md bg-muted/70 px-2 py-2">
                          <p
                            className="truncate text-[9px] leading-3 text-muted-foreground"
                            title={label}
                          >
                            {label}
                          </p>
                          <p className="mt-1 whitespace-nowrap font-display text-sm tabular-nums text-foreground">
                            {formatMetricValue(reading)}
                            {reading.unit && (
                              <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                                {reading.unit}
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Δεν υπάρχουν πρόσφατες μετρήσεις
                    </p>
                  )}

                  <Link
                    href={`/dashboard/${station.id}`}
                    className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    Άνοιγμα στον πίνακα ελέγχου
                    <IconArrowRight className="size-3.5" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )

  if (showCard) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <IconMapPin className="h-6 w-6" />
            {cardTitle}
          </CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>{mapContent}</CardContent>
      </Card>
    )
  }

  return mapContent
}

