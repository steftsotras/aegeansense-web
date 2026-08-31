"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, Image, FileText, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  HighchartsLineChart,
  exportChartCSV,
  exportChartPNG,
  exportChartSVG,
  toggleFullscreen,
} from "./highcharts-line-chart"
import { ChartLoader } from "@/components/chart-loader"
import { ChartStats, getDataPointCount } from "./chart-stats"
import { DateNavigator } from "./date-navigator"
import {
  type DateRange,
  filterByDay,
  filterByMonth,
  trimZeros,
  getDataDateRange,
  getLatestDataDate,
  hasValidReadings,
} from "@/lib/data-filters"
import {
  aggregateByDay,
  aggregateByHour,
  downsampleHighchartsData,
} from "@/lib/highcharts-formatters"

type TimePeriod = "raw" | "hourly" | "daily" | "monthly"

interface ChartCardProps {
  title: string
  metricKey: string
  rawData: Array<[number, number | null]>
  yAxisTitle?: string
  unit?: string
  height?: number
  className?: string
  defaultPeriod?: TimePeriod
  maxPoints?: number
}

export function ChartCard({
  title,
  metricKey,
  rawData,
  yAxisTitle = "Value",
  unit = "",
  height = 350,
  className,
  defaultPeriod = "monthly", // Default to monthly
  maxPoints = 2000,
}: ChartCardProps) {
  const chartRef = React.useRef<{ downloadCSV?: () => void; exportChart?: (options: unknown, config?: unknown) => void; fullscreen?: { toggle: () => void } } | null>(null)

  // Get the latest date from the data first
  const latestDate = React.useMemo(() => {
    const latest = getLatestDataDate(rawData)
    return latest || new Date()
  }, [rawData])

  // State - initialize with latest date
  const [timePeriod, setTimePeriod] = React.useState<TimePeriod>(defaultPeriod)
  const [selectedDate, setSelectedDate] = React.useState<Date>(latestDate)

  // Update selected date when rawData changes
  React.useEffect(() => {
    const latest = getLatestDataDate(rawData)
    if (latest) {
      setSelectedDate(latest)
    }
  }, [rawData])

  // Get date range from raw data
  const dateRange = React.useMemo<DateRange | null>(
    () => getDataDateRange(rawData),
    [rawData]
  )

  // Process data based on time period
  const processedData = React.useMemo(() => {
    if (rawData.length === 0) return []

    let data: Array<[number, number | null]>

    switch (timePeriod) {
      case "daily":
        // Filter to single day
        data = filterByDay(rawData, selectedDate)
        break

      case "monthly":
        // Filter to single month, then aggregate by day for cleaner display
        data = filterByMonth(rawData, selectedDate.getFullYear(), selectedDate.getMonth())
        // Aggregate to daily averages for monthly view
        if (data.length > 100) {
          data = aggregateByDay(data)
        }
        break

      case "hourly":
        // Show all data, aggregated by hour
        data = aggregateByHour(rawData)
        break

      case "raw":
      default:
        data = rawData
        break
    }

    // Trim leading/trailing zeros - be aggressive for cleaner charts
    data = trimZeros(data, 0.001)

    // Downsample if too many points
    return downsampleHighchartsData(data, maxPoints)
  }, [rawData, timePeriod, selectedDate, maxPoints])

  // Check if we have valid data to display
  const hasData = processedData.length > 0 && hasValidReadings(processedData)
  const pointCount = getDataPointCount(processedData)

  // Export handlers
  const handleExportCSV = () => exportChartCSV(chartRef)
  const handleExportPNG = () => exportChartPNG(chartRef, `${metricKey}-chart`)
  const handleExportSVG = () => exportChartSVG(chartRef, `${metricKey}-chart`)
  const handleFullscreen = () => toggleFullscreen(chartRef)

  return (
    <Card className={cn("flex flex-col", className)}>
      {/* Header */}
      <CardHeader className="pb-2 space-y-3">
        {/* Row 1: Title and Time Period Toggle */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold text-sm leading-none tracking-tight">{title}</h3>

          <ToggleGroup
            type="single"
            value={timePeriod}
            onValueChange={(value) => value && setTimePeriod(value as TimePeriod)}
            size="sm"
            className="h-7"
          >
            <ToggleGroupItem value="raw" className="text-xs px-2 h-7">
              Raw
            </ToggleGroupItem>
            <ToggleGroupItem value="hourly" className="text-xs px-2 h-7">
              Ωριαία
            </ToggleGroupItem>
            <ToggleGroupItem value="daily" className="text-xs px-2 h-7">
              Ημέρα
            </ToggleGroupItem>
            <ToggleGroupItem value="monthly" className="text-xs px-2 h-7">
              Μήνας
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Row 2: Stats and Date Navigator */}
        <div className="flex items-center justify-between gap-4 min-h-[28px]">
          {/* Stats - only show if we have valid data */}
          {hasData ? (
            <ChartStats data={processedData} unit={unit} />
          ) : (
            <span className="text-xs text-muted-foreground">Δεν υπάρχουν δεδομένα</span>
          )}

          {/* Date Navigator (only for daily/monthly) */}
          <DateNavigator
            mode={timePeriod}
            currentDate={selectedDate}
            dateRange={dateRange}
            onDateChange={setSelectedDate}
          />
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="pt-0 pb-2 flex-1">
        {hasData ? (
          <HighchartsLineChart
            data={processedData}
            yAxisTitle={yAxisTitle}
            seriesName={title}
            metricKey={metricKey}
            height={height}
            enableZoom={true}
            areaFill={true}
            chartRef={chartRef}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30"
            style={{ height }}
          >
            <p className="text-sm text-muted-foreground">
              Δεν υπάρχουν δεδομένα για την επιλεγμένη περίοδο
            </p>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <div className="px-6 pb-3 pt-1 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={!hasData}
              >
                <Download className="h-3.5 w-3.5" />
                Εξαγωγή
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={handleExportCSV} className="text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPNG} className="text-xs">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSVG} className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-2" />
                SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleFullscreen}
            disabled={!hasData}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Πλήρης οθόνη
          </Button>
        </div>

        {/* Point count */}
        {hasData && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {pointCount.toLocaleString("el-GR")} σημεία
          </span>
        )}
      </div>
    </Card>
  )
}

/**
 * Loading state for chart card
 */
export function ChartCardSkeleton({ height = 350 }: { height?: number }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="app-shimmer h-4 w-32 rounded bg-muted" />
          <div className="app-shimmer h-7 w-48 rounded bg-muted" />
        </div>
        <div className="app-shimmer h-5 w-64 rounded bg-muted" />
      </CardHeader>
      <CardContent className="pt-0 pb-2 flex-1">
        <ChartLoader height={height} />
      </CardContent>
      <div className="px-6 pb-3 pt-1 border-t border-border">
        <div className="app-shimmer h-7 w-32 rounded bg-muted" />
      </div>
    </Card>
  )
}