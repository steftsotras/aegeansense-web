/**
 * API Client
 * 
 * Main entry point for the the backend API integration.
 * 
 * @example
 * // Import the default API instance
 * import { api } from '@/lib/api';
 * const stations = await api.getStations();
 * 
 * // Or create a custom instance
 * import { ApiClient } from '@/lib/api';
 * const api = new ApiClient('https://custom-url.com');
 * 
 * // Import types
 * import type { Station, HistoricalData } from '@/lib/api';
 * 
 * // Import adapters for Highcharts integration
 * import { toHighchartsSeries, toLegacyFormat } from '@/lib/api';
 * 
 * // Import utilities
 * import { formatMetricValue, timeAgo, getStatusColor } from '@/lib/api';
 */

// =============================================================================
// Client Exports
// =============================================================================

export {
  ApiClient,
  ApiError,
  api,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  decodeAdminToken,
} from './client';

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core types
  Station,
  MetricReading,
  
  // Historical data
  HistoricalData,
  MetricSeries,
  DataPoint,
  
  // Latest readings
  LatestReadings,
  
  // Metrics
  MetricDefinition,
  KnownMetric,
  
  // Sync (Admin)
  SyncStatus,
  SyncRunInfo,
  SyncProgress,
  SyncResult,
  SyncLogInfo,

  // Admin
  AdminLoginResponse,
  FinotProfile,
  FinotProfileCreate,
  FinotProfileUpdate,

  // System
  HealthStatus,
  
  // Request options
  ReadingsOptions,
  StationsFilter,
} from './types';

export { METRIC_INFO } from './types';

// =============================================================================
// Adapter Exports
// =============================================================================

export {
  // Highcharts adapters
  toHighchartsSeries,
  metricSeriesToHighcharts,
  getMetricSeries,
  getMetricChartData,
  getAllMetricChartData,
  
  // Legacy format adapters (for migration)
  toLegacyFormat,
  toLegacyStation,
  toLegacyStations,
  
  // Data processing
  downsampleLTTB,
  getSeriesStats,
} from './adapters';

export type {
  HighchartsPoint,
  HighchartsSeries,
  LegacyHistoricalResponse,
  LegacyFormattedStation,
} from './adapters';

// =============================================================================
// Utility Exports
// =============================================================================

export {
  // Value formatting
  formatMetricValue,
  formatNumber,
  
  // Time utilities
  timeAgo,
  formatDate,
  getDateRange,
  
  // Status utilities
  getStatusColor,
  getStatusClass,
  getStatusText,
  
  // Station type utilities
  getStationTypeLabel,
  getStationTypeIcon,
  getStationTypeColor,
  
  // Validation
  hasValidCoordinates,
  isReasonableValue,
} from './utils';

// =============================================================================
// Default Export
// =============================================================================

// Export the default API instance as default
export { api as default } from './client';
