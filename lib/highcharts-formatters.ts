/**
 * Utilities for converting historical data from FINoT API format to Highcharts format
 */

export interface HistoricalDataResponse {
  status: number
  result: {
    attributes: Array<{
      attrName: string
      values: (number | null)[]
    }>
    index: string[]
    entityId?: string
    entityType?: string
  }
}

/**
 * Converts a timestamp string to Date.UTC milliseconds
 * Handles ISO 8601 format strings like "2025-10-01T10:13:18.000Z"
 */
function parseTimestamp(timestamp: string): number {
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${timestamp}`)
  }
  return date.getTime()
}

/**
 * Converts historical data for a single attribute to Highcharts format
 * Returns an array of [timestamp, value] pairs where timestamp is in milliseconds
 *
 * @param attributeName - The name of the attribute to extract
 * @param data - The historical data response
 * @returns Array of [timestamp, value] pairs in Highcharts format
 */
export function prepareHighchartsData(
  attributeName: string,
  data: HistoricalDataResponse | null
): Array<[number, number | null]> {
  if (!data?.result) {
    return []
  }

  const { attributes, index } = data.result

  if (!index || index.length === 0) {
    return []
  }

  // Find the attribute
  const attribute = attributes.find((attr) => attr.attrName === attributeName)
  if (!attribute) {
    return []
  }

  // Convert to Highcharts format: [[timestamp, value], ...]
  const chartData: Array<[number, number | null]> = []

  for (let i = 0; i < index.length; i++) {
    const timestamp = parseTimestamp(index[i])
    const value = attribute.values[i] ?? null
    chartData.push([timestamp, value])
  }

  return chartData
}

/**
 * Prepares data for multiple attributes
 * Returns an object mapping attribute names to their Highcharts data arrays
 */
export function prepareMultipleHighchartsData(
  data: HistoricalDataResponse | null
): Record<string, Array<[number, number | null]>> {
  if (!data?.result) {
    return {}
  }

  const { attributes, index } = data.result

  if (!index || index.length === 0 || !attributes || attributes.length === 0) {
    return {}
  }

  const result: Record<string, Array<[number, number | null]>> = {}

  for (const attribute of attributes) {
    result[attribute.attrName] = prepareHighchartsData(attribute.attrName, data)
  }

  return result
}

/**
 * Chunks data for progressive loading to prevent site staggering
 * Splits large datasets into smaller chunks that can be loaded incrementally
 */
export function chunkData<T>(
  data: T[],
  chunkSize: number = 1000
): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize))
  }

  return chunks
}

/**
 * Downsamples data to reduce the number of points for better performance
 * Uses a simple sampling strategy to keep every Nth point
 */
export function downsampleHighchartsData(
  data: Array<[number, number | null]>,
  maxPoints: number = 2000
): Array<[number, number | null]> {
  if (data.length <= maxPoints) {
    return data
  }

  const step = Math.ceil(data.length / maxPoints)
  const downsampled: Array<[number, number | null]> = []

  for (let i = 0; i < data.length; i += step) {
    downsampled.push(data[i])
  }

  // Always include the last point
  if (downsampled[downsampled.length - 1] !== data[data.length - 1]) {
    downsampled.push(data[data.length - 1])
  }

  return downsampled
}

/**
 * Aggregates data by day - takes the average of all values in each day
 */
export function aggregateByDay(
  data: Array<[number, number | null]>
): Array<[number, number | null]> {
  if (data.length === 0) return []

  // Group data by day
  const dayGroups = new Map<string, Array<[number, number | null]>>()

  for (const [timestamp, value] of data) {
    const date = new Date(timestamp)
    // Create a key for the day (YYYY-MM-DD)
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, [])
    }
    dayGroups.get(dayKey)!.push([timestamp, value])
  }

  // Calculate average for each day
  const aggregated: Array<[number, number | null]> = []

  for (const [, dayData] of dayGroups.entries()) {
    // Filter out null values for averaging
    const validValues = dayData.filter(([, v]) => v !== null).map(([, v]) => v as number)

    let avgValue: number | null = null
    if (validValues.length > 0) {
      avgValue = validValues.reduce((sum, val) => sum + val, 0) / validValues.length
    }

    // Use the first timestamp of the day (at midnight)
    const [firstTimestamp] = dayData[0]
    const dayStart = new Date(firstTimestamp)
    dayStart.setHours(0, 0, 0, 0)

    aggregated.push([dayStart.getTime(), avgValue])
  }

  // Sort by timestamp
  aggregated.sort((a, b) => a[0] - b[0])

  return aggregated
}

/**
 * Aggregates data by hour - takes the average of all values in each hour
 */
export function aggregateByHour(
  data: Array<[number, number | null]>
): Array<[number, number | null]> {
  if (data.length === 0) return []

  // Group data by hour
  const hourGroups = new Map<string, Array<[number, number | null]>>()

  for (const [timestamp, value] of data) {
    const date = new Date(timestamp)
    // Create a key for the hour (YYYY-MM-DD-HH)
    const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}`

    if (!hourGroups.has(hourKey)) {
      hourGroups.set(hourKey, [])
    }
    hourGroups.get(hourKey)!.push([timestamp, value])
  }

  // Calculate average for each hour
  const aggregated: Array<[number, number | null]> = []

  for (const [, hourData] of hourGroups.entries()) {
    // Filter out null values for averaging
    const validValues = hourData.filter(([, v]) => v !== null).map(([, v]) => v as number)

    let avgValue: number | null = null
    if (validValues.length > 0) {
      avgValue = validValues.reduce((sum, val) => sum + val, 0) / validValues.length
    }

    // Use the first timestamp of the hour (at start of hour)
    const [firstTimestamp] = hourData[0]
    const hourStart = new Date(firstTimestamp)
    hourStart.setMinutes(0, 0, 0)

    aggregated.push([hourStart.getTime(), avgValue])
  }

  // Sort by timestamp
  aggregated.sort((a, b) => a[0] - b[0])

  return aggregated
}

/**
 * Aggregates data by month - takes the average of all values in each month
 */
export function aggregateByMonth(
  data: Array<[number, number | null]>
): Array<[number, number | null]> {
  if (data.length === 0) return []

  // Group data by month
  const monthGroups = new Map<string, Array<[number, number | null]>>()

  for (const [timestamp, value] of data) {
    const date = new Date(timestamp)
    // Create a key for the month (YYYY-MM)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, [])
    }
    monthGroups.get(monthKey)!.push([timestamp, value])
  }

  // Calculate average for each month
  const aggregated: Array<[number, number | null]> = []

  for (const [, monthData] of monthGroups.entries()) {
    // Filter out null values for averaging
    const validValues = monthData.filter(([, v]) => v !== null).map(([, v]) => v as number)

    let avgValue: number | null = null
    if (validValues.length > 0) {
      avgValue = validValues.reduce((sum, val) => sum + val, 0) / validValues.length
    }

    // Use the first timestamp of the month (at start of month)
    const [firstTimestamp] = monthData[0]
    const monthStart = new Date(firstTimestamp)
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    aggregated.push([monthStart.getTime(), avgValue])
  }

  // Sort by timestamp
  aggregated.sort((a, b) => a[0] - b[0])

  return aggregated
}
