"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartsSectionLoader } from "@/components/chart-loader"
import { ChartCard } from "./chart-card"
import {
  api,
  getAllMetricChartData,
  type HistoricalData,
} from "@/lib/api"

interface HighchartsDashboardProps {
  entityId?: string
}

// Metric label mappings for display (Greek)
const METRIC_LABELS: Record<string, string> = {
  airTemperature: "Θερμοκρασία Αέρα",
  airRelativeHumidity: "Σχετική Υγρασία",
  soilTemperature: "Θερμοκρασία Εδάφους",
  soilMoisture: "Υγρασία Εδάφους",
  soilElectricalConductivity: "Ηλεκτρική Αγωγιμότητα",
  soilSalinity: "Αλατότητα Εδάφους",
  soilTDS: "TDS Εδάφους",
  leafWetness: "Υγρασία Φύλλων",
  rain: "Βροχόπτωση",
  rainRate: "Ένταση Βροχής",
  solarRadiation: "Ηλιακή Ακτινοβολία",
  windSpeed: "Ταχύτητα Ανέμου",
  gustWindSpeed: "Ριπές Ανέμου",
  windDirection: "Διεύθυνση Ανέμου",
  PM10: "PM10",
  PM2d5: "PM2.5",
  PM1d0: "PM1.0",
  SO2: "SO₂",
  vocIndex: "Δείκτης VOC",
  ambientIlluminance: "Φωτεινότητα",
}

// Unit mappings for y-axis labels
const METRIC_UNITS: Record<string, { axis: string; short: string }> = {
  airTemperature: { axis: "Θερμοκρασία (°C)", short: "°C" },
  airRelativeHumidity: { axis: "Υγρασία (%)", short: "%" },
  soilTemperature: { axis: "Θερμοκρασία (°C)", short: "°C" },
  soilMoisture: { axis: "Υγρασία (%)", short: "%" },
  soilElectricalConductivity: { axis: "EC (dS/m)", short: "dS/m" },
  soilSalinity: { axis: "Αλατότητα (ppm)", short: "ppm" },
  soilTDS: { axis: "TDS (ppm)", short: "ppm" },
  leafWetness: { axis: "Υγρασία (%)", short: "%" },
  rain: { axis: "Βροχόπτωση (mm)", short: "mm" },
  rainRate: { axis: "Ένταση (mm/h)", short: "mm/h" },
  solarRadiation: { axis: "Ακτινοβολία (W/m²)", short: "W/m²" },
  windSpeed: { axis: "Ταχύτητα (m/s)", short: "m/s" },
  gustWindSpeed: { axis: "Ταχύτητα (m/s)", short: "m/s" },
  windDirection: { axis: "Διεύθυνση (°)", short: "°" },
  PM10: { axis: "Συγκέντρωση (µg/m³)", short: "µg/m³" },
  PM2d5: { axis: "Συγκέντρωση (µg/m³)", short: "µg/m³" },
  PM1d0: { axis: "Συγκέντρωση (µg/m³)", short: "µg/m³" },
  SO2: { axis: "Συγκέντρωση (ppb)", short: "ppb" },
  vocIndex: { axis: "Δείκτης", short: "" },
  ambientIlluminance: { axis: "Φωτεινότητα (lux)", short: "lux" },
}

export function HighchartsDashboard({
  entityId,
}: HighchartsDashboardProps) {
  const [data, setData] = React.useState<HistoricalData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchHistoricalData = React.useCallback(async (id: string) => {
    if (!id) {
      setData(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch the full available history. Without an explicit `from`, the
      // backend defaults to only the last 30 days (relative to now), which
      // hides older readings and shows empty charts for stations whose most
      // recent reading is more than 30 days old. `to` still defaults to now.
      const result = await api.getReadings(id, { from: new Date(0) })
      setData(result)
    } catch (err) {
      console.error("Error fetching historical data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch historical data")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (entityId) {
      fetchHistoricalData(entityId)
    }
  }, [entityId, fetchHistoricalData])

  // Prepare all chart data using adapter
  const allChartData = React.useMemo(() => {
    if (!data?.series) return {}
    return getAllMetricChartData(data)
  }, [data])

  // Get available metrics sorted (active first, inactive last)
  const sortedAttributes = React.useMemo(() => {
    if (!data?.series) return []

    const attributes = data.series.map((s) => s.metric)

    return attributes.sort((a, b) => {
      const aData = allChartData[a] || []
      const bData = allChartData[b] || []
      const aHasData = aData.length > 0
      const bHasData = bData.length > 0

      if (aHasData && !bHasData) return -1
      if (!aHasData && bHasData) return 1
      return 0
    })
  }, [data, allChartData])

  if (!entityId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">
              Επιλέξτε σταθμό από το μενού για προβολή δεδομένων.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Loading State - one loader for the whole section */}
      {isLoading && <ChartsSectionLoader />}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Σφάλμα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid - rendered all at once, once data is ready */}
      {!isLoading && !error && data?.series && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedAttributes.map((attrName) => {
            const rawData = allChartData[attrName] || []
            const units = METRIC_UNITS[attrName] || { axis: "Τιμή", short: "" }

            return (
              <ChartCard
                key={attrName}
                title={METRIC_LABELS[attrName] || attrName}
                metricKey={attrName}
                rawData={rawData}
                yAxisTitle={units.axis}
                unit={units.short}
                height={350}
                defaultPeriod="monthly"
              />
            )
          })}
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !error && (!data?.series || sortedAttributes.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">
                Δεν υπάρχουν ιστορικά δεδομένα για τον επιλεγμένο σταθμό.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
