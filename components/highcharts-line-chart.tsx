"use client"

import * as React from "react"
import { ChartLoader } from "@/components/chart-loader"
import { getMetricColor, getMetricGradient } from "@/lib/chart-colors"
import { useDarkMode } from "@/hooks/use-dark-mode"

interface HighchartsLineChartProps {
  data: Array<[number, number | null]>
  yAxisTitle?: string
  seriesName?: string
  metricKey?: string
  height?: number
  enableZoom?: boolean
  areaFill?: boolean
  chartRef?: React.MutableRefObject<{ downloadCSV?: () => void; exportChart?: (options: unknown, config?: unknown) => void; fullscreen?: { toggle: () => void } } | null>
}

export function HighchartsLineChart({
  data,
  yAxisTitle = "Value",
  seriesName = "Data",
  metricKey,
  height = 350,
  enableZoom = true,
  areaFill = true,
  chartRef: externalChartRef,
}: HighchartsLineChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const chartInstanceRef = React.useRef<{ destroy: () => void } | null>(null)
  const [isClient, setIsClient] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const isDark = useDarkMode()

  // Get color based on metric key
  const seriesColor = metricKey ? getMetricColor(metricKey) : "#45828b"
  const gradientFill = metricKey ? getMetricGradient(metricKey) : undefined

  // Color scheme based on dark mode
  const colors = React.useMemo(() => {
    if (isDark) {
      return {
        backgroundColor: "#064049",
        textColor: "#edf6f4",
        mutedTextColor: "#b2c9c5",
        borderColor: "rgba(255, 255, 255, 0.1)", // Subtle borders
        gridLineColor: "rgba(255, 255, 255, 0.08)", // Very subtle grid lines
        crosshairColor: "rgba(255, 255, 255, 0.2)", // Crosshair
        tooltipBg: "#074851",
        tooltipBorder: "rgba(255, 255, 255, 0.15)", // Tooltip border
        tooltipText: "#edf6f4",
        resetButtonBg: "#074851",
        resetButtonBorder: "rgba(255, 255, 255, 0.15)", // Reset button border
        resetButtonText: "#b2c9c5",
      }
    } else {
      return {
        backgroundColor: "#ffffff",
        textColor: "#055b65",
        mutedTextColor: "#45828b",
        borderColor: "#e0e5e9",
        gridLineColor: "rgba(228, 228, 231, 0.5)",
        crosshairColor: "rgba(113, 113, 122, 0.3)",
        tooltipBg: "#ffffff",
        tooltipBorder: "#b2c9c5",
        tooltipText: "#055b65",
        resetButtonBg: "#fbfcfc",
        resetButtonBorder: "#e0e5e9",
        resetButtonText: "#45828b",
      }
    }
  }, [isDark])

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  React.useEffect(() => {
    if (!isClient || !containerRef.current) return

    const initChart = async () => {
      setIsLoading(true)

      try {
        const HighchartsModule = await import("highcharts")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Highcharts = (HighchartsModule.default || HighchartsModule) as any

        if (!Highcharts?.Chart?.prototype) {
          throw new Error("Highcharts failed to load")
        }

        // Load export modules
        try {
          const ExportingModule = await import("highcharts/modules/exporting")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exportingFn = (ExportingModule as any).default || ExportingModule
          if (typeof exportingFn === "function") {
            exportingFn(Highcharts)
          }
        } catch {
          console.debug("Exporting module not loaded")
        }

        try {
          const ExportDataModule = await import("highcharts/modules/export-data")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exportDataFn = (ExportDataModule as any).default || ExportDataModule
          if (typeof exportDataFn === "function") {
            exportDataFn(Highcharts)
          }
        } catch {
          console.debug("Export-data module not loaded")
        }

        // Destroy existing chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        if (!containerRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: any = {
          chart: {
            type: areaFill ? "area" : "line",
            height,
            zoomType: enableZoom ? "x" : undefined,
            panning: enableZoom ? { enabled: true, type: "x" } : undefined,
            panKey: "shift",
            backgroundColor: colors.backgroundColor,
            style: {
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            spacing: [10, 10, 15, 10],
            resetZoomButton: {
              theme: {
                fill: colors.resetButtonBg,
                stroke: colors.resetButtonBorder,
                style: {
                  color: colors.resetButtonText,
                  fontSize: "11px",
                },
                r: 4,
                padding: 6,
              },
              position: {
                align: "right",
                x: -10,
                y: 10,
              },
            },
          },
          title: {
            text: undefined,
          },
          xAxis: {
            type: "datetime",
            labels: {
              style: {
                color: colors.mutedTextColor,
                fontSize: "10px",
              },
            },
            dateTimeLabelFormats: {
              millisecond: "%H:%M:%S",
              second: "%H:%M:%S",
              minute: "%H:%M",
              hour: "%H:%M",
              day: "%e %b",
              week: "%e %b",
              month: "%b '%y",
              year: "%Y",
            },
            lineColor: colors.borderColor,
            tickColor: colors.borderColor,
            gridLineWidth: 0,
            crosshair: {
              color: colors.crosshairColor,
              dashStyle: "Dot",
              width: 1,
            },
          },
          yAxis: {
            title: {
              text: yAxisTitle,
              style: {
                color: colors.mutedTextColor,
                fontSize: "11px",
                fontWeight: "normal",
              },
            },
            labels: {
              style: {
                color: colors.mutedTextColor,
                fontSize: "10px",
              },
            },
            gridLineColor: colors.gridLineColor,
            gridLineDashStyle: "Dot",
          },
          legend: {
            enabled: false,
          },
          tooltip: {
            shared: true,
            crosshairs: true,
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderRadius: 6,
            shadow: {
              color: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.08)",
              offsetX: 0,
              offsetY: 2,
              width: 4,
            },
            style: {
              color: colors.tooltipText,
              fontSize: "11px",
            },
            xDateFormat: "%d/%m/%Y %H:%M",
            headerFormat: `<span style="font-size:10px;color:${colors.mutedTextColor}">{point.key}</span><br/>`,
            pointFormat: '<span style="color:{point.color}">●</span> <b>{point.y:.2f}</b><br/>',
          },
          plotOptions: {
            area: {
              fillColor: gradientFill,
              marker: {
                enabled: true,
                radius: 3,
                symbol: "circle",
                states: {
                  hover: {
                    enabled: true,
                    radius: 4,
                  },
                },
              },
              lineWidth: 1.5,
              states: {
                hover: {
                  lineWidth: 2,
                },
              },
              threshold: null,
            },
            line: {
              marker: {
                enabled: true,
                radius: 2,
                states: {
                  hover: {
                    enabled: true,
                    radius: 4,
                  },
                },
              },
              lineWidth: 1.5,
              states: {
                hover: {
                  lineWidth: 2,
                },
              },
            },
          },
          series: [
            {
              type: areaFill ? "area" : "line",
              name: seriesName,
              data: data,
              color: seriesColor,
            },
          ],
          exporting: {
            enabled: true,
            buttons: {
              contextButton: {
                enabled: false,
              },
            },
            csv: {
              dateFormat: "%Y-%m-%d %H:%M:%S",
            },
            chartOptions: {
              chart: {
                backgroundColor: colors.backgroundColor,
              },
            },
          },
          credits: {
            enabled: false,
          },
          accessibility: {
            enabled: false,
          },
          time: {
            useUTC: false,
          },
        }

        const chart = Highcharts.chart(containerRef.current, options)
        chartInstanceRef.current = chart

        if (externalChartRef) {
          externalChartRef.current = chart
        }
      } catch (error) {
        console.error("Error initializing Highcharts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initChart()

    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy()
        } catch {
          // Ignore
        }
        chartInstanceRef.current = null
      }
    }
  }, [isClient, data, yAxisTitle, seriesName, seriesColor, gradientFill, height, enableZoom, areaFill, externalChartRef, isDark, colors])

  if (!isClient) {
    return <ChartLoader height={height} />
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <ChartLoader height={height} />
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height: `${height}px`, opacity: isLoading ? 0 : 1 }}
        className="transition-opacity duration-300"
      />
    </div>
  )
}

/**
 * Programmatically export chart to CSV
 */
export function exportChartCSV(chartRef: React.MutableRefObject<{ downloadCSV?: () => void } | null>) {
  if (chartRef.current?.downloadCSV) {
    chartRef.current.downloadCSV()
  }
}

/**
 * Programmatically export chart to PNG
 */
export function exportChartPNG(chartRef: React.MutableRefObject<{ exportChart?: (options: unknown, config?: unknown) => void } | null>, filename?: string) {
  if (chartRef.current?.exportChart) {
    // Check if dark mode is active
    const isDark = document.documentElement.classList.contains("dark") || 
                   window.matchMedia("(prefers-color-scheme: dark)").matches
    const bgColor = isDark ? "#064049" : "#ffffff"
    chartRef.current.exportChart(
      { type: "image/png", filename: filename || "chart" },
      { chart: { backgroundColor: bgColor } }
    )
  }
}

/**
 * Programmatically export chart to SVG
 */
export function exportChartSVG(chartRef: React.MutableRefObject<{ exportChart?: (options: unknown, config?: unknown) => void } | null>, filename?: string) {
  if (chartRef.current?.exportChart) {
    // Check if dark mode is active
    const isDark = document.documentElement.classList.contains("dark") || 
                   window.matchMedia("(prefers-color-scheme: dark)").matches
    const bgColor = isDark ? "#064049" : "#ffffff"
    chartRef.current.exportChart(
      { type: "image/svg+xml", filename: filename || "chart" },
      { chart: { backgroundColor: bgColor } }
    )
  }
}

/**
 * Toggle fullscreen
 */
export function toggleFullscreen(chartRef: React.MutableRefObject<{ fullscreen?: { toggle: () => void } } | null>) {
  if (chartRef.current?.fullscreen) {
    chartRef.current.fullscreen.toggle()
  }
}
