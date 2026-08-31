/**
 * API Client
 * 
 * TypeScript client for the monitoring backend API.
 * This replaces direct FINoT API calls with calls to your backend.
 * 
 * Usage:
 *   import { api } from '@/lib/api';
 *   const stations = await api.getStations();
 */

import {
  Station,
  HistoricalData,
  LatestReadings,
  MetricDefinition,
  SyncStatus,
  SyncProgress,
  SyncRunInfo,
  SyncResult,
  SyncLogInfo,
  HealthStatus,
  ReadingsOptions,
  StationsFilter,
  AdminLoginResponse,
  FinotProfile,
  FinotProfileCreate,
  FinotProfileUpdate,
} from './types';

// =============================================================================
// Admin Token Storage
// =============================================================================

const ADMIN_TOKEN_KEY = 'aegeansense-admin-token';

/**
 * Get the stored admin JWT, or null when absent/expired/server-side.
 * Expired tokens are cleared eagerly so the UI falls back to the login page
 * instead of sending requests doomed to 401.
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return null;

  const payload = decodeAdminToken(token);
  if (!payload || (payload.exp && payload.exp * 1000 <= Date.now())) {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    return null;
  }
  return token;
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/** Decode the (unverified) JWT payload - used only for display/expiry checks. */
export function decodeAdminToken(token: string): { sub?: string; email?: string; exp?: number } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// =============================================================================
// API Error Class
// =============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// =============================================================================
// API Client Class
// =============================================================================

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Support both server-side and client-side environments
    this.baseUrl = (baseUrl || this.getDefaultUrl()).replace(/\/$/, '');
  }

  private getDefaultUrl(): string {
    // Server-side: use API_URL or NEXT_PUBLIC_API_URL
    if (typeof window === 'undefined') {
      return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }
    // Client-side: use NEXT_PUBLIC_API_URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = getAdminToken();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        let detail: string | undefined;
        try {
          const errorData = await response.json();
          detail = errorData.detail;
        } catch {
          // Ignore JSON parse errors
        }
        throw new ApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          detail
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network errors, etc.
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'Failed to connect to the API server'
      );
    }
  }

  private formatDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return date;
  }

  private buildQueryString(params: Record<string, unknown> | StationsFilter): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ---------------------------------------------------------------------------
  // Stations
  // ---------------------------------------------------------------------------

  /**
   * Get all stations with their latest metric readings.
   * 
   * @param filter - Optional filters for type and status
   * @param options - Fetch options (for Next.js caching)
   * @returns Array of stations with metrics
   * 
   * @example
   * // Get all stations
   * const stations = await api.getStations();
   * 
   * // Filter by type
   * const microclimate = await api.getStations({ type: 'MicroclimateStation' });
   * 
   * // Filter by connection status
   * const connected = await api.getStations({ status: 'CONNECTED' });
   * 
   * // With Next.js revalidation
   * const stations = await api.getStations({}, { next: { revalidate: 60 } });
   */
  async getStations(filter?: StationsFilter, options?: RequestInit): Promise<Station[]> {
    const query = this.buildQueryString(filter || {});
    return this.request<Station[]>(`/api/stations${query}`, options);
  }

  /**
   * Get a single station by ID.
   * 
   * @param stationId - Station UUID
   * @returns Station with metrics
   * 
   * @example
   * const station = await api.getStation('a39e85fc-f9ca-4425-a0fa-2794577f0510');
   */
  async getStation(stationId: string): Promise<Station> {
    return this.request<Station>(`/api/stations/${stationId}`);
  }

  /**
   * Get historical readings for a station.
   * 
   * @param stationId - Station UUID
   * @param options - Query options (from, to, metrics, agg)
   * @returns Historical data with time series
   * 
   * @example
   * // Last 30 days, all metrics
   * const data = await api.getReadings(stationId);
   * 
   * // Specific date range with daily aggregation
   * const data = await api.getReadings(stationId, {
   *   from: '2024-01-01',
   *   to: '2024-01-31',
   *   agg: 'day'
   * });
   * 
   * // Specific metrics only
   * const data = await api.getReadings(stationId, {
   *   metrics: ['airTemperature', 'airRelativeHumidity']
   * });
   */
  async getReadings(
    stationId: string,
    options: ReadingsOptions = {}
  ): Promise<HistoricalData> {
    const params: Record<string, unknown> = {};
    
    if (options.from) {
      params.from = this.formatDate(options.from);
    }
    if (options.to) {
      params.to = this.formatDate(options.to);
    }
    if (options.metrics) {
      params.metrics = Array.isArray(options.metrics)
        ? options.metrics.join(',')
        : options.metrics;
    }
    if (options.agg) {
      params.agg = options.agg;
    }

    const query = this.buildQueryString(params);
    return this.request<HistoricalData>(`/api/stations/${stationId}/readings${query}`);
  }

  /**
   * Get the most recent reading for each metric.
   * Fast endpoint ideal for dashboards.
   * 
   * @param stationId - Station UUID
   * @returns Object with metric names as keys
   * 
   * @example
   * const latest = await api.getLatestReadings(stationId);
   * console.log(`Temperature: ${latest.airTemperature?.value}°C`);
   */
  async getLatestReadings(stationId: string): Promise<LatestReadings> {
    return this.request<LatestReadings>(`/api/stations/${stationId}/latest`);
  }

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  /**
   * Get all metric definitions.
   * Useful for building dropdowns, displaying labels and units.
   * 
   * @returns Array of metric definitions
   * 
   * @example
   * const metrics = await api.getMetrics();
   * const metricLabels = Object.fromEntries(
   *   metrics.map(m => [m.name, m.label])
   * );
   */
  async getMetrics(): Promise<MetricDefinition[]> {
    return this.request<MetricDefinition[]>('/api/metrics');
  }

  // ---------------------------------------------------------------------------
  // Admin - auth & FINoT profiles (bearer token required except login)
  // ---------------------------------------------------------------------------

  /**
   * Authenticate an admin. The returned token must be stored via
   * `setAdminToken()` - subsequent requests attach it automatically.
   */
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    return this.request<AdminLoginResponse>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /** List all FINoT profiles. */
  async getProfiles(): Promise<FinotProfile[]> {
    return this.request<FinotProfile[]>('/api/admin/profiles');
  }

  /** Get a single FINoT profile. */
  async getProfile(profileId: number): Promise<FinotProfile> {
    return this.request<FinotProfile>(`/api/admin/profiles/${profileId}`);
  }

  /** Create a new FINoT profile. */
  async createProfile(payload: FinotProfileCreate): Promise<FinotProfile> {
    return this.request<FinotProfile>('/api/admin/profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Update a FINoT profile. Only provided fields are changed. */
  async updateProfile(profileId: number, payload: FinotProfileUpdate): Promise<FinotProfile> {
    return this.request<FinotProfile>(`/api/admin/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /** Delete a FINoT profile (its stations are kept, unassigned). */
  async deleteProfile(profileId: number): Promise<{ deleted: number }> {
    return this.request(`/api/admin/profiles/${profileId}`, { method: 'DELETE' });
  }

  // ---------------------------------------------------------------------------
  // Sync (Admin) - all endpoints act on one FINoT profile
  // ---------------------------------------------------------------------------

  /**
   * Get current sync status, optionally scoped to one profile.
   */
  async getSyncStatus(profileId?: number): Promise<SyncStatus> {
    const query = profileId !== undefined ? `?profile_id=${profileId}` : '';
    return this.request<SyncStatus>(`/api/sync/status${query}`);
  }

  /**
   * Get detailed sync progress for all entities, optionally scoped to one profile.
   */
  async getSyncProgress(profileId?: number): Promise<{ count: number; entities: SyncProgress[] }> {
    const query = profileId !== undefined ? `?profile_id=${profileId}` : '';
    return this.request(`/api/sync/progress${query}`);
  }

  /**
   * Get recent sync runs (history, across all profiles).
   */
  async getSyncRuns(limit: number = 10): Promise<SyncRunInfo[]> {
    return this.request<SyncRunInfo[]>(`/api/sync/runs?limit=${limit}`);
  }

  /**
   * Get recent per-step sync logs (e.g. station-metadata syncs).
   */
  async getSyncLogs(limit: number = 20): Promise<SyncLogInfo[]> {
    return this.request<SyncLogInfo[]>(`/api/sync/logs?limit=${limit}`);
  }

  /**
   * Run a full sync (stations + readings) for one profile, blocking until done.
   */
  async runSync(profileId: number, forceFull: boolean = false): Promise<SyncResult> {
    return this.request<SyncResult>(
      `/api/sync/?profile_id=${profileId}&force_full=${forceFull}`,
      { method: 'POST' }
    );
  }

  /**
   * Start a background sync job for one profile.
   */
  async startSync(
    profileId: number,
    forceFull: boolean = false
  ): Promise<{ status: string; message: string }> {
    return this.request(
      `/api/sync/start?profile_id=${profileId}&force_full=${forceFull}`,
      { method: 'POST' }
    );
  }

  /**
   * Sync only station metadata for one profile (fast, blocking).
   */
  async syncStationsOnly(profileId: number): Promise<{ stations_synced: number; completed_at: string }> {
    return this.request(`/api/sync/stations?profile_id=${profileId}`, { method: 'POST' });
  }

  /**
   * Sync recent readings for one profile using batch fetching.
   */
  async syncReadings(
    profileId: number,
    days: number = 30,
    forceFull: boolean = false
  ): Promise<{ readings_synced: number; days: number; completed_at: string }> {
    return this.request(
      `/api/sync/readings?profile_id=${profileId}&days=${days}&force_full=${forceFull}`,
      { method: 'POST' }
    );
  }

  /**
   * Test the FINoT connection for one profile.
   */
  async testConnection(
    profileId: number
  ): Promise<{ profile_id: number; configured: boolean; success?: boolean; error?: string }> {
    return this.request(`/api/sync/test?profile_id=${profileId}`, { method: 'POST' });
  }

  // ---------------------------------------------------------------------------
  // System
  // ---------------------------------------------------------------------------

  /**
   * Health check.
   * 
   * @returns Health status
   */
  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  /**
   * Full system test (FINoT + Database).
   * 
   * @returns Detailed test results
   */
  async test(): Promise<unknown> {
    return this.request('/test');
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Default API client instance.
 * Uses NEXT_PUBLIC_API_URL or API_URL environment variable.
 */
export const api = new ApiClient();
