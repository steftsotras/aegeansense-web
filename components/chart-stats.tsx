"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp, Activity, Clock } from "lucide-react"

interface ChartStatsProps {
  data: Array<[number, number | null]>
  unit?: string
  className?: string
}

interface StatsData {
  min: number
  max: number
  avg: number
  latest: number
  latestTime: Date
  count: number
}

/**
 * Calculate statistics from chart data
 * Returns null if no valid data
 */
function calculateStats(data: Array<[number, number | null]>): StatsData | null {
  const validData = data.filter(
    (point): point is [number, number] => point[1] !== null && !isNaN(point[1])
  )

  if (validData.length === 0) return null

  const values = validData.map(([, v]) => v)
  const [latestTimestamp, latestValue] = validData[validData.length - 1]

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    latest: latestValue,
    latestTime: new Date(latestTimestamp),
    count: validData.length,
  }
}

/**
 * Format a number for display
 */
function formatValue(value: number, decimals: number = 2): string {
  if (Math.abs(value) >= 10000) {
    return value.toLocaleString("el-GR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }
  if (Math.abs(value) >= 100) {
    return value.toFixed(1)
  }
  return value.toFixed(decimals)
}

/**
 * Compact inline stats display for chart cards
 * Returns null if no valid data
 */
export function ChartStats({ data, unit = "", className }: ChartStatsProps) {
  const stats = React.useMemo(() => calculateStats(data), [data])

  // Return null if no valid readings
  if (!stats) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1" title="Ελάχιστο">
        <TrendingDown className="h-3 w-3 text-blue-500/70" />
        <span className="tabular-nums">{formatValue(stats.min)}</span>
        {unit && <span className="opacity-60">{unit}</span>}
      </span>

      <span className="inline-flex items-center gap-1" title="Μέγιστο">
        <TrendingUp className="h-3 w-3 text-red-500/70" />
        <span className="tabular-nums">{formatValue(stats.max)}</span>
        {unit && <span className="opacity-60">{unit}</span>}
      </span>

      <span className="inline-flex items-center gap-1" title="Μέσος Όρος">
        <Activity className="h-3 w-3 text-amber-500/70" />
        <span className="tabular-nums">{formatValue(stats.avg)}</span>
        {unit && <span className="opacity-60">{unit}</span>}
      </span>
    </div>
  )
}

/**
 * Extended stats display with latest value and time
 */
export function ChartStatsExtended({ data, unit = "", className }: ChartStatsProps) {
  const stats = React.useMemo(() => calculateStats(data), [data])

  if (!stats) {
    return null
  }

  return (
    <div className={cn("grid grid-cols-4 gap-3 text-xs", className)}>
      <div className="flex flex-col">
        <span className="text-muted-foreground flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-blue-500/70" />
          Ελάχ.
        </span>
        <span className="font-medium tabular-nums">
          {formatValue(stats.min)} {unit}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-red-500/70" />
          Μέγ.
        </span>
        <span className="font-medium tabular-nums">
          {formatValue(stats.max)} {unit}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-muted-foreground flex items-center gap-1">
          <Activity className="h-3 w-3 text-amber-500/70" />
          Μ.Ο.
        </span>
        <span className="font-medium tabular-nums">
          {formatValue(stats.avg)} {unit}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3 text-green-500/70" />
          Τελευτ.
        </span>
        <span className="font-medium tabular-nums">
          {formatValue(stats.latest)} {unit}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {stats.latestTime.toLocaleTimeString("el-GR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}

/**
 * Get data point count
 */
export function getDataPointCount(data: Array<[number, number | null]>): number {
  return data.filter(([, v]) => v !== null).length
}
