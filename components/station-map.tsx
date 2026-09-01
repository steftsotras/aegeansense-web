"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconMapPin } from "@tabler/icons-react"
import type { Station } from "@/lib/api"
import { AEGEANSENSE_COLORS, STATION_TYPE_COLORS } from "@/lib/chart-colors"

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

// Fix for default marker icons in Next.js
const createIcon = (color: string, variant: "default" | "newsprint") => {
  if (typeof window === "undefined") return null
  // Use dynamic import to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet")
  const isNewsprint = variant === "newsprint"
  const markerHtml = isNewsprint
    ? `<div style="
        display: grid;
        place-items: center;
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 9999px;
        border: 2px solid #f8faf9;
        box-shadow: 0 0 0 2px rgba(5, 91, 101, 0.2), 0 3px 10px rgba(5, 91, 101, 0.22);
      "><span style="
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: #f8faf9;
      "></span></div>`
    : `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`

  return L.divIcon({
    className: "custom-marker",
    html: markerHtml,
    iconSize: isNewsprint ? [20, 20] : [24, 24],
    iconAnchor: isNewsprint ? [10, 10] : [12, 24],
    popupAnchor: isNewsprint ? [0, -12] : [0, -24],
  })
}

const getStationColor = (type: string): string => {
  return STATION_TYPE_COLORS[type] || AEGEANSENSE_COLORS.tealSoft
}

const getStationTypeLabel = (type: string): string => {
  switch (type) {
    case "MicroclimateStation":
      return "Μικροκλιματικός Σταθμός"
    case "WeatherStation":
      return "Μετεωρολογικός Σταθμός"
    case "IndoorAirQuality":
      return "Σταθμός Ποιότητας Αέρα"
    default:
      return type
  }
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
          const color =
            variant === "newsprint"
              ? station.connection_status === "CONNECTED"
                ? "#1bd488"
                : "#68746f"
              : getStationColor(station.type)
          const icon = createIcon(color, variant) || undefined
          return (
            <Marker
              key={station.id}
              position={[lat, lng]}
              icon={icon || undefined}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">
                    {station.name || station.product_id || "Unnamed Station"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {getStationTypeLabel(station.type)}
                  </p>
                  {station.connection_status && (
                    <p className="text-xs">
                      Κατάσταση:{" "}
                      <span
                        className={
                          station.connection_status === "CONNECTED"
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {station.connection_status}
                      </span>
                    </p>
                  )}
                  {station.metrics?.airTemperature && (
                    <p className="text-xs mt-1">
                      Θερμοκρασία: {Number(station.metrics.airTemperature.value).toFixed(1)}
                      {station.metrics.airTemperature.unit}
                    </p>
                  )}
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

