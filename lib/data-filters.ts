/**
 * Data filtering and processing utilities for time-series chart data
 */

export interface DateRange {
    start: Date
    end: Date
  }
  
  /**
   * Get the available date range from chart data
   */
  export function getDataDateRange(
    data: Array<[number, number | null]>
  ): DateRange | null {
    if (data.length === 0) return null
  
    const timestamps = data.map(([ts]) => ts)
    return {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    }
  }
  
  /**
   * Filter data to a specific day
   */
  export function filterByDay(
    data: Array<[number, number | null]>,
    date: Date
  ): Array<[number, number | null]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
  
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
  
    return data.filter(
      ([ts]) => ts >= startOfDay.getTime() && ts <= endOfDay.getTime()
    )
  }
  
  /**
   * Filter data to a specific month
   */
  export function filterByMonth(
    data: Array<[number, number | null]>,
    year: number,
    month: number // 0-indexed (0 = January)
  ): Array<[number, number | null]> {
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
  
    return data.filter(
      ([ts]) => ts >= startOfMonth.getTime() && ts <= endOfMonth.getTime()
    )
  }
  
  /**
   * Trim leading zeros/nulls before actual data starts
   * More aggressive - looks for actual meaningful values
   */
  export function trimLeadingZeros(
    data: Array<[number, number | null]>,
    threshold: number = 0.001
  ): Array<[number, number | null]> {
    if (data.length === 0) return []
  
    // Find first valid non-zero value
    let firstValidIndex = -1
    for (let i = 0; i < data.length; i++) {
      const value = data[i][1]
      if (value !== null && value !== 0 && Math.abs(value) > threshold) {
        firstValidIndex = i
        break
      }
    }
  
    // All zeros or nulls - return empty
    if (firstValidIndex === -1) return []
  
    // No leading zeros
    if (firstValidIndex === 0) return data
  
    // Start from first valid value (no need to keep zeros before)
    return data.slice(firstValidIndex)
  }
  
  /**
   * Trim trailing zeros/nulls after data ends
   */
  export function trimTrailingZeros(
    data: Array<[number, number | null]>,
    threshold: number = 0.001
  ): Array<[number, number | null]> {
    if (data.length === 0) return []
  
    // Find last valid non-zero value
    let lastValidIndex = -1
    for (let i = data.length - 1; i >= 0; i--) {
      const value = data[i][1]
      if (value !== null && value !== 0 && Math.abs(value) > threshold) {
        lastValidIndex = i
        break
      }
    }
  
    if (lastValidIndex === -1) return []
    if (lastValidIndex === data.length - 1) return data
  
    return data.slice(0, lastValidIndex + 1)
  }
  
  /**
   * Trim both leading and trailing zeros
   */
  export function trimZeros(
    data: Array<[number, number | null]>,
    threshold: number = 0.001
  ): Array<[number, number | null]> {
    const trimmedLeading = trimLeadingZeros(data, threshold)
    return trimTrailingZeros(trimmedLeading, threshold)
  }
  
  /**
   * Check if data has any valid (non-null, non-zero) readings
   */
  export function hasValidReadings(
    data: Array<[number, number | null]>,
    threshold: number = 0.001
  ): boolean {
    return data.some(
      ([, value]) => value !== null && Math.abs(value) > threshold
    )
  }
  
  /**
   * Get navigation dates for a given period
   */
  export function getNavigationDates(
    currentDate: Date,
    mode: "daily" | "monthly",
    direction: "prev" | "next"
  ): Date {
    const newDate = new Date(currentDate)
  
    if (mode === "daily") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    } else if (mode === "monthly") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
  
    return newDate
  }
  
  /**
   * Check if navigation is possible in a given direction
   */
  export function canNavigate(
    currentDate: Date,
    dateRange: DateRange | null,
    mode: "daily" | "monthly",
    direction: "prev" | "next"
  ): boolean {
    if (!dateRange) return false
  
    if (direction === "prev") {
      if (mode === "daily") {
        const prevDay = new Date(currentDate)
        prevDay.setDate(prevDay.getDate() - 1)
        prevDay.setHours(23, 59, 59, 999)
        return prevDay >= dateRange.start
      } else {
        // For monthly, check if previous month overlaps with data range
        const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        return prevMonthStart >= new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), 1)
      }
    } else {
      if (mode === "daily") {
        const nextDay = new Date(currentDate)
        nextDay.setDate(nextDay.getDate() + 1)
        nextDay.setHours(0, 0, 0, 0)
        return nextDay <= dateRange.end
      } else {
        const nextMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        const dataEndMonth = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth() + 1, 0)
        return nextMonthStart <= dataEndMonth
      }
    }
  }
  
  /**
   * Format date for display based on mode
   */
  export function formatDateForMode(date: Date, mode: "daily" | "monthly" | "raw" | "hourly"): string {
    if (mode === "daily") {
      return date.toLocaleDateString("el-GR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
    if (mode === "monthly") {
      return date.toLocaleDateString("el-GR", {
        month: "long",
        year: "numeric",
      })
    }
    return "Όλα τα δεδομένα"
  }
  
  /**
   * Get the latest date with valid data in the dataset
   */
  export function getLatestDataDate(
    data: Array<[number, number | null]>,
    threshold: number = 0.001
  ): Date | null {
    if (data.length === 0) return null
  
    // Find the latest timestamp with a valid non-zero value
    for (let i = data.length - 1; i >= 0; i--) {
      const value = data[i][1]
      if (value !== null && Math.abs(value) > threshold) {
        return new Date(data[i][0])
      }
    }
  
    // Fallback to latest timestamp
    return new Date(data[data.length - 1][0])
  }
  
  /**
   * Get the start of the month containing the given date
   */
  export function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }
  
  /**
   * Get the end of the month containing the given date
   */
  export function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  }