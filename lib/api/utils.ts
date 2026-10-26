/**
 * API - Utility Functions
 *
 * Helper functions for formatting, time calculations, and display.
 */

// =============================================================================
// Value Formatting
// =============================================================================

/**
 * Format a metric value with its unit.
 *
 * @param value - The numeric value
 * @param unit - The unit string (can be null)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "23.5 °C"
 *
 * @example
 * formatMetricValue(23.5, '°C') // "23.5 °C"
 * formatMetricValue(23.456, '%', 1) // "23.5 %"
 * formatMetricValue(1234, null, 0) // "1234"
 */
export function formatMetricValue(
  value: number,
  unit: string | null,
  decimals: number = 1
): string {
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format a large number with thousands separators.
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

// =============================================================================
// Time Utilities
// =============================================================================

/**
 * Get a human-readable "time ago" string.
 *
 * @param dateString - ISO date string
 * @returns Human-readable string like "2 hours ago"
 *
 * @example
 * timeAgo('2024-02-04T12:00:00Z') // "2 hours ago"
 */
export function timeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  return date.toLocaleDateString();
}

/**
 * Format a date for display.
 *
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  return new Date(dateString).toLocaleString(undefined, options);
}

/**
 * Get date range for common time periods.
 *
 * @param period - Time period identifier
 * @returns Object with from and to dates
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'year' | 'custom', customDays?: number): {
  from: Date;
  to: Date;
} {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(from.getDate() - 7);
      break;
    case 'month':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'custom':
      if (customDays) {
        from.setDate(from.getDate() - customDays);
      }
      break;
  }

  return { from, to };
}

// =============================================================================
// Status Utilities
// =============================================================================

/**
 * Get a color for connection status.
 *
 * @param status - Connection status string
 * @returns Hex color code
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'CONNECTED':
      return '#1bd488';
    case 'DISCONNECTED':
      return '#c9675a';
    default:
      return '#b2c9c5';
  }
}

/**
 * Get Tailwind CSS class for connection status.
 *
 * @param status - Connection status string
 * @returns Tailwind background color class
 */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'CONNECTED':
      return 'bg-green-500';
    case 'DISCONNECTED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get human-readable status text.
 *
 * @param status - Connection status string
 * @returns Human-readable status
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'CONNECTED':
      return 'Connected';
    case 'DISCONNECTED':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
}

// =============================================================================
// Station Type Utilities
// =============================================================================

/**
 * Get display name for station type.
 */
export function getStationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'MicroclimateStation': 'Microclimate Station',
    'WeatherStation': 'Weather Station',
    'IndoorAirQuality': 'Indoor Air Quality',
  };
  return labels[type] || type;
}

/**
 * Get icon/emoji for station type.
 */
export function getStationTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'MicroclimateStation': '🌡️',
    'WeatherStation': '☁️',
    'IndoorAirQuality': '🏠',
  };
  return icons[type] || '📡';
}

/**
 * Get color for station type (for map markers, etc.).
 */
export function getStationTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'MicroclimateStation': '#1bd488',
    'WeatherStation': '#45828b',
    'IndoorAirQuality': '#055b65',
  };
  return colors[type] || '#b2c9c5';
}

// =============================================================================
// Data Validation
// =============================================================================

/**
 * Check if a station has valid coordinates for mapping.
 */
export function hasValidCoordinates(station: { latitude: number | null; longitude: number | null }): boolean {
  return station.latitude !== null &&
         station.longitude !== null &&
         !isNaN(station.latitude) &&
         !isNaN(station.longitude);
}

/**
 * Check if a value is within reasonable bounds for a metric.
 */
export function isReasonableValue(metric: string, value: number): boolean {
  const bounds: Record<string, { min: number; max: number }> = {
    'airTemperature': { min: -50, max: 60 },
    'soilTemperature': { min: -20, max: 50 },
    'airRelativeHumidity': { min: 0, max: 100 },
    'soilMoisture': { min: 0, max: 100 },
    'leafWetness': { min: 0, max: 100 },
    'windSpeed': { min: 0, max: 200 },
    'windDirection': { min: 0, max: 360 },
    'rain': { min: 0, max: 500 },
    'solarRadiation': { min: 0, max: 1500 },
  };

  const metricBounds = bounds[metric];
  if (!metricBounds) return true;

  return value >= metricBounds.min && value <= metricBounds.max;
}
