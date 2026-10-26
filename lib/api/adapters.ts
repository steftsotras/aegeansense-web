/**
 * API Adapters
 *
 * These utilities help bridge the new backend API response format with
 * your existing frontend code (like Highcharts formatters).
 *
 * This allows you to migrate gradually without rewriting everything at once.
 */

import type { Station, HistoricalData, MetricSeries, DataPoint } from './types';

// =============================================================================
// Highcharts Adapters
// =============================================================================

/**
 * Highcharts-ready series point [timestamp_ms, value]
 */
export type HighchartsPoint = [number, number];

/**
 * Highcharts series configuration
 */
export interface HighchartsSeries {
  name: string;
  data: HighchartsPoint[];
  unit?: string;
  tooltip?: {
    valueSuffix?: string;
  };
}

/**
 * Convert API historical data to Highcharts series format.
 *
 * @param historicalData - Response from api.getReadings()
 * @returns Array of Highcharts-ready series
 *
 * @example
 * const data = await api.getReadings(stationId, { metrics: 'airTemperature', agg: 'hour' });
 * const series = toHighchartsSeries(data);
 * // Use in Highcharts: chart.update({ series })
 */
export function toHighchartsSeries(historicalData: HistoricalData): HighchartsSeries[] {
  return historicalData.series.map(series => ({
    name: series.label,
    data: series.data.map(point => [
      new Date(point.recorded_at).getTime(),
      point.value
    ]),
    unit: series.unit ?? undefined,
    tooltip: {
      valueSuffix: series.unit ? ` ${series.unit}` : undefined
    }
  }));
}

/**
 * Convert a single metric series to Highcharts format.
 *
 * @param series - A single MetricSeries from the API response
 * @returns Highcharts-ready series object
 */
export function metricSeriesToHighcharts(series: MetricSeries): HighchartsSeries {
  return {
    name: series.label,
    data: series.data.map(point => [
      new Date(point.recorded_at).getTime(),
      point.value
    ]),
    unit: series.unit ?? undefined,
    tooltip: {
      valueSuffix: series.unit ? ` ${series.unit}` : undefined
    }
  };
}

/**
 * Get data for a specific metric from the historical response.
 *
 * @param historicalData - Response from api.getReadings()
 * @param metricName - The metric to extract (e.g., 'airTemperature')
 * @returns The metric series or null if not found
 */
export function getMetricSeries(
  historicalData: HistoricalData,
  metricName: string
): MetricSeries | null {
  return historicalData.series.find(s => s.metric === metricName) ?? null;
}

/**
 * Extract chart data for a specific metric as [timestamp, value] array.
 *
 * @param historicalData - Response from api.getReadings()
 * @param metricName - The metric to extract
 * @returns Array of [timestamp_ms, value] pairs
 */
export function getMetricChartData(
  historicalData: HistoricalData,
  metricName: string
): HighchartsPoint[] {
  const series = getMetricSeries(historicalData, metricName);
  if (!series) return [];

  return series.data.map(point => [
    new Date(point.recorded_at).getTime(),
    point.value
  ]);
}

/**
 * Convert all series in historical data to a map of chart data.
 *
 * @param historicalData - Response from api.getReadings()
 * @returns Object mapping metric names to chart data arrays
 */
export function getAllMetricChartData(
  historicalData: HistoricalData
): Record<string, HighchartsPoint[]> {
  const result: Record<string, HighchartsPoint[]> = {};

  for (const series of historicalData.series) {
    result[series.metric] = series.data.map(point => [
      new Date(point.recorded_at).getTime(),
      point.value
    ]);
  }

  return result;
}

// =============================================================================
// Legacy Format Adapters (for existing code compatibility)
// =============================================================================

/**
 * Legacy FINoT-style historical response format.
 * This matches what your existing highcharts-formatters.ts expects.
 */
export interface LegacyHistoricalResponse {
  result: {
    index: string[];  // Array of ISO timestamps
    attributes: Array<{
      attrName: string;
      values: (number | null)[];
    }>;
  };
}

/**
 * Convert new API format to legacy FINoT format.
 *
 * Use this if you want to keep using your existing highcharts-formatters.ts
 * without modification.
 *
 * @param historicalData - Response from api.getReadings()
 * @returns Data in the legacy FINoT response format
 *
 * @example
 * const data = await api.getReadings(stationId);
 * const legacyFormat = toLegacyFormat(data);
 * // Now you can use your existing formatters:
 * const series = convertToHighchartsSeries(legacyFormat);
 */
export function toLegacyFormat(historicalData: HistoricalData): LegacyHistoricalResponse {
  // Build a unified timestamp index from all series
  const timestampSet = new Set<string>();
  historicalData.series.forEach(series => {
    series.data.forEach(point => {
      timestampSet.add(point.recorded_at);
    });
  });

  // Sort timestamps
  const index = Array.from(timestampSet).sort();

  // Build attributes array
  const attributes = historicalData.series.map(series => {
    // Create a map for O(1) lookup
    const dataMap = new Map<string, number>();
    series.data.forEach(point => {
      dataMap.set(point.recorded_at, point.value);
    });

    // Build values array aligned with index
    const values = index.map(ts => dataMap.get(ts) ?? null);

    return {
      attrName: series.metric,
      values
    };
  });

  return {
    result: {
      index,
      attributes
    }
  };
}

// =============================================================================
// Station Adapters (for existing FormattedStation compatibility)
// =============================================================================

/**
 * Legacy formatted station type (matches your existing data-formatters.ts)
 */
export interface LegacyFormattedStation {
  id: string;
  name: string;
  type: string;
  status: string;
  statusColor: string;
  location: { lat: number; lon: number } | null;
  metrics: Record<string, { value: number; unit: string }>;
  lastSeen: string | null;
}

/**
 * Convert new Station format to legacy FormattedStation format.
 *
 * Use this if you want to keep your existing UI components unchanged.
 *
 * @param station - Station from api.getStations()
 * @returns Station in legacy format
 */
export function toLegacyStation(station: Station): LegacyFormattedStation {
  const statusColors: Record<string, string> = {
    'CONNECTED': '#1bd488',
    'DISCONNECTED': '#c9675a',
    'UNKNOWN': '#b2c9c5'
  };

  return {
    id: station.id,
    name: station.name || station.product_id || station.serial_number || 'Unknown Station',
    type: station.type,
    status: station.connection_status,
    statusColor: statusColors[station.connection_status] || '#b2c9c5',
    location: station.latitude && station.longitude
      ? { lat: station.latitude, lon: station.longitude }
      : null,
    metrics: Object.fromEntries(
      Object.entries(station.metrics).map(([key, reading]) => [
        key,
        { value: reading.value, unit: reading.unit || '' }
      ])
    ),
    lastSeen: station.last_seen
  };
}

/**
 * Convert array of stations to legacy format.
 */
export function toLegacyStations(stations: Station[]): LegacyFormattedStation[] {
  return stations.map(toLegacyStation);
}

// =============================================================================
// Data Processing Utilities
// =============================================================================

/**
 * Downsample data points using LTTB algorithm (Largest-Triangle-Three-Buckets).
 * Useful when displaying large datasets in charts.
 *
 * @param data - Array of data points
 * @param threshold - Maximum number of points to return
 * @returns Downsampled data array
 */
export function downsampleLTTB(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold || threshold < 3) {
    return data;
  }

  const sampled: DataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always keep the first point
  sampled.push(data[0]);

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = Math.min(avgRangeEnd, data.length) - avgRangeStart;

    // Calculate average point in next bucket (for area calculation)
    let avgX = 0;
    let avgY = 0;
    for (let j = avgRangeStart; j < avgRangeStart + avgRangeLength; j++) {
      avgX += new Date(data[j].recorded_at).getTime();
      avgY += data[j].value;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Point in current bucket
    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Point in previous bucket
    const prevPoint = sampled[sampled.length - 1];
    const prevX = new Date(prevPoint.recorded_at).getTime();
    const prevY = prevPoint.value;

    // Find point with largest triangle area
    let maxArea = -1;
    let maxAreaIdx = rangeStart;

    for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
      const currX = new Date(data[j].recorded_at).getTime();
      const currY = data[j].value;

      const area = Math.abs(
        (prevX - avgX) * (currY - prevY) -
        (prevX - currX) * (avgY - prevY)
      ) / 2;

      if (area > maxArea) {
        maxArea = area;
        maxAreaIdx = j;
      }
    }

    sampled.push(data[maxAreaIdx]);
  }

  // Always keep the last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Get summary statistics for a metric series.
 */
export function getSeriesStats(series: MetricSeries): {
  min: number;
  max: number;
  avg: number;
  count: number;
  latest: DataPoint | null;
} {
  if (series.data.length === 0) {
    return { min: 0, max: 0, avg: 0, count: 0, latest: null };
  }

  const values = series.data.map(d => d.value);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    count: values.length,
    latest: series.data[series.data.length - 1]
  };
}
