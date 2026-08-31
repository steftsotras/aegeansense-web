"use client"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface ChartLoaderProps {
  height?: number | string
  message?: string
  className?: string
}

/**
 * Simple centered loading state for a chart area.
 */
export function ChartLoader({
  height = 400,
  message = "Φόρτωση δεδομένων...",
  className,
}: ChartLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/5",
        className
      )}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <Spinner size="lg" className="text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * One loading state for the whole historical charts section. Stays up until
 * all data is ready, then the charts render together - no per-chart popping.
 */
export function ChartsSectionLoader() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-card/40">
      <Spinner size="lg" className="text-primary" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Φόρτωση ιστορικών δεδομένων…
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Προετοιμασία γραφημάτων
        </p>
      </div>
    </div>
  )
}

/**
 * Inline loading indicator for smaller UI elements
 */
export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Spinner size="sm" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}

/**
 * Full page/section loading overlay
 */
export function LoadingOverlay({ message = "Φόρτωση..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" className="text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
