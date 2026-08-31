"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type DateRange,
  canNavigate,
  getNavigationDates,
} from "@/lib/data-filters"

type NavigationMode = "raw" | "hourly" | "daily" | "monthly"

interface DateNavigatorProps {
  mode: NavigationMode
  currentDate: Date
  dateRange: DateRange | null
  onDateChange: (date: Date) => void
  className?: string
}

export function DateNavigator({
  mode,
  currentDate,
  dateRange,
  onDateChange,
  className,
}: DateNavigatorProps) {
  // Format date based on mode
  const displayDate = React.useMemo(() => {
    if (mode === "daily") {
      // Format: Δευ, 9 Δεκ 2025
      return currentDate.toLocaleDateString("el-GR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
    if (mode === "monthly") {
      // Format: Δεκέμβριος 2025
      return currentDate.toLocaleDateString("el-GR", {
        month: "long",
        year: "numeric",
      })
    }
    return ""
  }, [currentDate, mode])

  // Don't show navigator for raw/hourly modes
  if (mode === "raw" || mode === "hourly") {
    return null
  }

  const canGoPrev = canNavigate(currentDate, dateRange, mode, "prev")
  const canGoNext = canNavigate(currentDate, dateRange, mode, "next")

  const handlePrev = () => {
    if (canGoPrev) {
      onDateChange(getNavigationDates(currentDate, mode, "prev"))
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      onDateChange(getNavigationDates(currentDate, mode, "next"))
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handlePrev}
        disabled={!canGoPrev}
        title={mode === "daily" ? "Προηγούμενη ημέρα" : "Προηγούμενος μήνας"}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs font-normal min-w-[140px]"
        onClick={handleToday}
        title="Σήμερα"
      >
        <Calendar className="h-3 w-3 mr-1.5 opacity-50" />
        <span className="truncate">{displayDate}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleNext}
        disabled={!canGoNext}
        title={mode === "daily" ? "Επόμενη ημέρα" : "Επόμενος μήνας"}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}