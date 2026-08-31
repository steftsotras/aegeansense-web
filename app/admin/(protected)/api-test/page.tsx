"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Copy, Download, RefreshCw } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import type { Station, HistoricalData } from "@/lib/api"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")

export default function ApiTesterPage() {
  // Station & metrics
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState<string>("")
  const [availableAttrs, setAvailableAttrs] = useState<string[]>([])
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([])

  // Query parameters (only what the backend /readings endpoint supports)
  const [agg, setAgg] = useState<string>("")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  // Response state
  const [loading, setLoading] = useState(false)
  const [loadingStations, setLoadingStations] = useState(true)
  const [response, setResponse] = useState<HistoricalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)

  // Fetch stations on mount
  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    setLoadingStations(true)
    try {
      const data = await api.getStations()
      setStations(data)
    } catch (err) {
      console.error("Failed to fetch stations:", err)
    } finally {
      setLoadingStations(false)
    }
  }

  // Update available metrics when station changes
  useEffect(() => {
    if (selectedStation) {
      const station = stations.find(s => s.id === selectedStation)
      setAvailableAttrs(station ? Object.keys(station.metrics) : [])
      setSelectedAttrs([]) // Reset selection
    }
  }, [selectedStation, stations])

  // Build the request URL preview from the current parameters
  const requestUrl = useMemo(() => {
    if (!selectedStation) return ""

    const params = new URLSearchParams()

    if (selectedAttrs.length > 0) {
      params.set("metrics", selectedAttrs.join(","))
    }
    if (agg) {
      params.set("agg", agg)
    }
    if (fromDate) {
      params.set("from", new Date(fromDate).toISOString())
    }
    if (toDate) {
      params.set("to", new Date(toDate).toISOString())
    }

    const queryString = params.toString()
    return `${API_BASE}/api/stations/${selectedStation}/readings${queryString ? `?${queryString}` : ""}`
  }, [selectedStation, selectedAttrs, agg, fromDate, toDate])

  const executeRequest = async () => {
    if (!selectedStation) return

    setLoading(true)
    setError(null)
    setResponse(null)

    const startTime = performance.now()

    try {
      const data = await api.getReadings(selectedStation, {
        metrics: selectedAttrs.length > 0 ? selectedAttrs : undefined,
        from: fromDate ? new Date(fromDate) : undefined,
        to: toDate ? new Date(toDate) : undefined,
        agg: (agg || undefined) as "hour" | "day" | "month" | undefined,
      })

      setResponseTime(Math.round(performance.now() - startTime))
      setResponse(data)
    } catch (err) {
      setResponseTime(Math.round(performance.now() - startTime))
      if (err instanceof ApiError) {
        setError(`HTTP ${err.status}: ${err.detail || err.message}`)
      } else {
        setError(err instanceof Error ? err.message : "Request failed")
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadJson = () => {
    if (!response) return
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `app-readings-${selectedStation}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const setQuickDateRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setFromDate(start.toISOString().slice(0, 16))
    setToDate(end.toISOString().slice(0, 16))
  }

  const clearParams = () => {
    setAgg("")
    setFromDate("")
    setToDate("")
    setSelectedAttrs([])
  }

  // Response stats derived from the HistoricalData series
  const stats = useMemo(() => {
    if (!response) return null

    const allTimestamps = response.series
      .flatMap(s => s.data.map(d => d.recorded_at))
      .sort()
    const totalPoints = response.series.reduce((sum, s) => sum + s.data.length, 0)

    return {
      dataPoints: totalPoints,
      series: response.series.length,
      firstTimestamp: allTimestamps[0] || "N/A",
      lastTimestamp: allTimestamps[allTimestamps.length - 1] || "N/A",
    }
  }, [response])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-foreground mb-1">API Tester</h1>
        <p className="text-sm text-muted-foreground">
          Δοκιμάστε διάφορους συνδυασμούς παραμέτρων για το backend Historical Data API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Station Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Επιλογή Σταθμού</CardTitle>
              <CardDescription>Επιλέξτε σταθμό για να δείτε τα διαθέσιμα metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={loadingStations ? "Φόρτωση..." : "Επιλέξτε σταθμό"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map(station => (
                      <SelectItem key={station.id} value={station.id}>
                        <span className="font-mono text-sm">{station.name || station.id}</span>
                        <span className="text-muted-foreground ml-2">({station.type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchStations} disabled={loadingStations}>
                  <RefreshCw className={`h-4 w-4 ${loadingStations ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {availableAttrs.length > 0 && (
                <div className="space-y-2">
                  <Label>Διαθέσιμα Metrics ({availableAttrs.length})</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-40 overflow-y-auto">
                    {availableAttrs.map(attr => (
                      <label key={attr} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={selectedAttrs.includes(attr)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAttrs([...selectedAttrs, attr])
                            } else {
                              setSelectedAttrs(selectedAttrs.filter(a => a !== attr))
                            }
                          }}
                        />
                        <span className="text-sm font-mono">{attr}</span>
                      </label>
                    ))}
                  </div>
                  {selectedAttrs.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Επιλεγμένα: {selectedAttrs.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aggregation Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aggregation</CardTitle>
              <CardDescription>
                Το backend υπολογίζει τον μέσο όρο (AVG) ανά περίοδο
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>agg (περίοδος)</Label>
                <Select value={agg || "none"} onValueChange={(value) => setAgg(value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Κανένα" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Κανένα (raw data)</SelectItem>
                    <SelectItem value="hour">hour</SelectItem>
                    <SelectItem value="day">day</SelectItem>
                    <SelectItem value="month">month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Χρονικό Εύρος</CardTitle>
              <CardDescription>Ορίστε from και to (ISO8601). Default: τελευταίες 30 ημέρες</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(1)}>
                  1 ημέρα
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                  7 ημέρες
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                  30 ημέρες
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>
                  90 ημέρες
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(365)}>
                  1 έτος
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>from</Label>
                  <Input
                    type="datetime-local"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>to</Label>
                  <Input
                    type="datetime-local"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={executeRequest}
              disabled={!selectedStation || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Εκτέλεση...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Εκτέλεση Request
                </>
              )}
            </Button>
            <Button variant="outline" onClick={clearParams}>
              Καθαρισμός
            </Button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Request URL Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Request URL
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(requestUrl)}
                  disabled={!requestUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block p-3 bg-muted rounded-lg text-sm break-all font-mono">
                {requestUrl || "Επιλέξτε σταθμό για να δείτε το URL"}
              </code>
            </CardContent>
          </Card>

          {/* Response Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Response Stats
                  {responseTime !== null && (
                    <Badge variant="secondary">{responseTime}ms</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data Points:</span>
                    <span className="ml-2 font-semibold">{stats.dataPoints}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Series:</span>
                    <span className="ml-2 font-semibold">{stats.series}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">First:</span>
                    <span className="ml-2 font-mono text-xs">{stats.firstTimestamp}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Last:</span>
                    <span className="ml-2 font-mono text-xs">{stats.lastTimestamp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Raw Response */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Raw Response
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                    disabled={!response}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadJson}
                    disabled={!response}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : response ? (
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[600px] font-mono">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Εκτελέστε ένα request για να δείτε τα αποτελέσματα
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
