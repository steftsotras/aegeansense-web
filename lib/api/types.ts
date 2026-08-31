/**
 * API - Type Definitions
 * 
 * These types match the backend API response shapes.
 */

// =============================================================================
// Core Station Types
// =============================================================================

/**
 * A single metric reading with value, timestamp, and display info.
 */
export interface MetricReading {
  value: number;
  recorded_at: string;
  label: string;
  unit: string | null;
}

/**
 * A weather/climate monitoring station.
 */
export interface Station {
  id: string;
  type: string;
  name: string | null;
  serial_number: string | null;
  product_id: string | null;
  latitude: number | null;
  longitude: number | null;
  connection_status: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  last_seen: string | null;
  synced_at: string | null;
  metrics: Record<string, MetricReading>;
}

// =============================================================================
// Historical Data Types
// =============================================================================

/**
 * A single data point in a time series.
 */
export interface DataPoint {
  recorded_at: string;
  value: number;
}

/**
 * A time series for a specific metric.
 */
export interface MetricSeries {
  metric: string;
  label: string;
  unit: string | null;
  data: DataPoint[];
}

/**
 * Historical data response containing multiple metric series.
 */
export interface HistoricalData {
  station_id: string;
  from_date: string;
  to_date: string;
  series: MetricSeries[];
}

// =============================================================================
// Metric Definitions
// =============================================================================

/**
 * Definition of a metric (for dropdowns, labels, units).
 */
export interface MetricDefinition {
  name: string;
  label: string;
  unit_code: string | null;
  unit_symbol: string | null;
  description: string | null;
}

/**
 * Latest readings response - metric name to reading mapping.
 */
export interface LatestReadings {
  [metric: string]: {
    value: number;
    recorded_at: string;
    label: string;
    unit: string | null;
  };
}

// =============================================================================
// Sync Types (Admin)
// =============================================================================

/**
 * Information about a sync run.
 */
export interface SyncRunInfo {
  id: number;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  entities_synced: number;
  records_synced: number;
  error: string | null;
}

/**
 * Overall sync status.
 */
export interface SyncStatus {
  stations_in_db: number;
  readings_in_db: number;
  entities_fully_synced: number;
  entities_pending: number;
  latest_sync_run: SyncRunInfo | null;
}

/**
 * Sync progress for a single entity.
 */
export interface SyncProgress {
  entity_id: string;
  entity_type: string | null;
  is_complete: boolean;
  last_synced_to: string | null;
  earliest_data: string | null;
  latest_data: string | null;
  total_records: number;
  error: string | null;
}

/**
 * Result of a blocking full sync (POST /api/sync/).
 */
export interface SyncResult {
  stations_synced: number;
  readings_synced: number;
  completed_at: string;
}

/**
 * A per-step sync log entry (e.g. station-metadata syncs).
 */
export interface SyncLogInfo {
  id: number;
  type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records: number | null;
  error: string | null;
}

// =============================================================================
// Admin Types
// =============================================================================

/**
 * Response from POST /api/admin/login.
 */
export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * A FINoT tenant profile (admin-managed credentials for one FINoT account).
 * The password is write-only: never returned by the API.
 */
export interface FinotProfile {
  id: number;
  name: string;
  finot_url: string;
  finot_username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Payload for creating a FINoT profile.
 */
export interface FinotProfileCreate {
  name: string;
  finot_url: string;
  finot_username: string;
  finot_password: string;
  is_active?: boolean;
}

/**
 * Payload for updating a FINoT profile. Only provided fields are changed.
 */
export interface FinotProfileUpdate {
  name?: string;
  finot_url?: string;
  finot_username?: string;
  finot_password?: string;
  is_active?: boolean;
}

// =============================================================================
// System Types
// =============================================================================

/**
 * Health check response.
 */
export interface HealthStatus {
  status: string;
  finot_profiles_active: number;
}

// =============================================================================
// Request Options
// =============================================================================

/**
 * Options for fetching historical readings.
 */
export interface ReadingsOptions {
  /** Start date (ISO string or Date object) */
  from?: string | Date;
  /** End date (ISO string or Date object) */
  to?: string | Date;
  /** Specific metrics to fetch (comma-separated string or array) */
  metrics?: string | string[];
  /** Aggregation period */
  agg?: 'hour' | 'day' | 'month';
}

/**
 * Filter options for stations list.
 */
export interface StationsFilter {
  /** Filter by station type (e.g., 'MicroclimateStation', 'WeatherStation') */
  type?: string;
  /** Filter by connection status */
  status?: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
}

// =============================================================================
// Available Metrics (for reference)
// =============================================================================

/**
 * Known metric names in the system.
 * Use this for type-safe metric access.
 */
export type KnownMetric = 
  | 'airTemperature'
  | 'soilTemperature'
  | 'airRelativeHumidity'
  | 'soilMoisture'
  | 'leafWetness'
  | 'soilElectricalConductivity'
  | 'soilSalinity'
  | 'soilTDS'
  | 'rain'
  | 'rainRate'
  | 'solarRadiation'
  | 'windSpeed'
  | 'gustWindSpeed'
  | 'windDirection'
  | 'PM10'
  | 'PM2d5'
  | 'PM1d0'
  | 'SO2'
  | 'vocIndex'
  | 'ambientIlluminance';

/**
 * Metric metadata for display purposes.
 */
export const METRIC_INFO: Record<KnownMetric, { label: string; unit: string }> = {
  airTemperature: { label: 'Air Temperature', unit: '°C' },
  soilTemperature: { label: 'Soil Temperature', unit: '°C' },
  airRelativeHumidity: { label: 'Air Humidity', unit: '%' },
  soilMoisture: { label: 'Soil Moisture', unit: '%' },
  leafWetness: { label: 'Leaf Wetness', unit: '%' },
  soilElectricalConductivity: { label: 'Soil EC', unit: 'dS/m' },
  soilSalinity: { label: 'Soil Salinity', unit: 'ppm' },
  soilTDS: { label: 'Soil TDS', unit: 'ppm' },
  rain: { label: 'Rainfall', unit: 'mm' },
  rainRate: { label: 'Rain Rate', unit: 'mm/h' },
  solarRadiation: { label: 'Solar Radiation', unit: 'W/m²' },
  windSpeed: { label: 'Wind Speed', unit: 'm/s' },
  gustWindSpeed: { label: 'Gust Speed', unit: 'm/s' },
  windDirection: { label: 'Wind Direction', unit: '°' },
  PM10: { label: 'PM10', unit: 'µg/m³' },
  PM2d5: { label: 'PM2.5', unit: 'µg/m³' },
  PM1d0: { label: 'PM1.0', unit: 'µg/m³' },
  SO2: { label: 'SO₂', unit: 'ppb' },
  vocIndex: { label: 'VOC Index', unit: '' },
  ambientIlluminance: { label: 'Illuminance', unit: 'lux' },
};
