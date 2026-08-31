/**
 * AegeanSense data-visualization colors.
 * The core identity stays teal/green; restrained warm accents preserve
 * distinction when several scientific series share one chart.
 */

export const AEGEANSENSE_COLORS = {
  canvas: "#fbfcfc",
  surface: "#e0e5e9",
  tealSoft: "#b2c9c5",
  green: "#1bd488",
  teal: "#45828b",
  tealDeep: "#055b65",
  amber: "#d5a43a",
  coral: "#c9675a",
} as const

// Scientific color palette - muted, professional tones
// Primary chart color - a neutral scientific blue
export const DEFAULT_CHART_COLOR = AEGEANSENSE_COLORS.teal

// Main color palette for chart lines - subdued scientific colors
export const METRIC_COLORS: Record<string, string> = {
  // Temperature metrics - Warm but muted
  airTemperature: "#c45c4a",      // Muted terracotta red
  soilTemperature: "#b87333",     // Copper/earth tone

  // Humidity metrics - Cool blues
  airRelativeHumidity: "#4b7bab", // Steel blue
  soilMoisture: "#5b8fa8",        // Slate blue
  leafWetness: "#6a9ab0",         // Dusty blue

  // Soil metrics - Earth tones
  soilElectricalConductivity: "#8b7355", // Taupe
  soilSalinity: "#7a6852",        // Warm gray
  soilTDS: "#6b5b4f",             // Dark taupe

  // Precipitation - Cool indigo
  rain: "#5c6b8a",                // Slate indigo
  rainRate: "#7b6b99",            // Dusty purple

  // Solar/Light - Warm amber (muted)
  solarRadiation: "#b8860b",      // Dark goldenrod
  ambientIlluminance: "#c4a35a",  // Muted gold

  // Wind - Muted teal/green
  windSpeed: "#4a8b7b",           // Muted teal
  gustWindSpeed: "#5a9b7b",       // Sage green
  windDirection: "#6a8b6a",       // Dusty green

  // Air Quality - Neutral grays
  PM10: "#6b7b8b",                // Blue gray
  PM2d5: "#5b6b7b",               // Darker blue gray
  PM1d0: "#4b5b6b",               // Dark slate
  SO2: "#8b6b6b",                 // Dusty rose gray
  vocIndex: "#7b6b8b",            // Dusty purple gray
}

// Category groupings for organizing metrics in UI
export const METRIC_CATEGORIES: Record<string, string[]> = {
  temperature: ["airTemperature", "soilTemperature"],
  humidity: ["airRelativeHumidity", "soilMoisture", "leafWetness"],
  soil: ["soilElectricalConductivity", "soilSalinity", "soilTDS"],
  precipitation: ["rain", "rainRate"],
  solar: ["solarRadiation", "ambientIlluminance"],
  wind: ["windSpeed", "gustWindSpeed", "windDirection"],
  airQuality: ["PM10", "PM2d5", "PM1d0", "SO2", "vocIndex"],
}

// Category labels in Greek
export const CATEGORY_LABELS: Record<string, string> = {
  temperature: "Θερμοκρασία",
  humidity: "Υγρασία",
  soil: "Έδαφος",
  precipitation: "Βροχόπτωση",
  solar: "Ηλιακή Ακτινοβολία",
  wind: "Άνεμος",
  airQuality: "Ποιότητα Αέρα",
}

// Category colors (for sidebar grouping)
export const CATEGORY_COLORS: Record<string, string> = {
  temperature: "#c45c4a",
  humidity: "#4b7bab",
  soil: "#8b7355",
  precipitation: "#5c6b8a",
  solar: "#b8860b",
  wind: "#4a8b7b",
  airQuality: "#6b7b8b",
}

/**
 * Get the color for a specific metric
 * Falls back to the default scientific blue
 */
export function getMetricColor(metric: string): string {
  return METRIC_COLORS[metric] || DEFAULT_CHART_COLOR
}

/**
 * Get the category a metric belongs to
 */
export function getMetricCategory(metric: string): string | null {
  for (const [category, metrics] of Object.entries(METRIC_CATEGORIES)) {
    if (metrics.includes(metric)) {
      return category
    }
  }
  return null
}

/**
 * Generate a subtle gradient fill for area charts
 * Very light fill to not overwhelm the scientific presentation
 */
export function getMetricGradient(metric: string): {
  linearGradient: { x1: number; y1: number; x2: number; y2: number }
  stops: Array<[number, string]>
} {
  const baseColor = getMetricColor(metric)

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return {
    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
    stops: [
      [0, hexToRgba(baseColor, 0.15)],
      [0.7, hexToRgba(baseColor, 0.05)],
      [1, hexToRgba(baseColor, 0.0)],
    ],
  }
}

/**
 * Station type colors for sidebar icons
 */
export const STATION_TYPE_COLORS: Record<string, string> = {
  WeatherStation: AEGEANSENSE_COLORS.teal,
  MicroclimateStation: AEGEANSENSE_COLORS.green,
  IndoorAirQuality: AEGEANSENSE_COLORS.tealDeep,
}

/**
 * Connection status colors
 */
export const CONNECTION_STATUS_COLORS = {
  CONNECTED: AEGEANSENSE_COLORS.green,
  DISCONNECTED: AEGEANSENSE_COLORS.coral,
  UNKNOWN: AEGEANSENSE_COLORS.tealSoft,
} as const

export type ConnectionStatus = keyof typeof CONNECTION_STATUS_COLORS
