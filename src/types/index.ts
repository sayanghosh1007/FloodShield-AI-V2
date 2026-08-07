/**
 * FloodShield AI — Shared domain types
 * Central type definitions used across the dashboard, API layer, and components.
 */

export type Trend = 'up' | 'down' | 'stable';

export type Severity = 'info' | 'advisory' | 'watch' | 'warning' | 'critical';

export type Theme = 'light' | 'dark';

export type ChartSeries = {
  label: string;
  color: string;
  points: number[];
};

export type MetricKey =
  | 'temperature'
  | 'humidity'
  | 'rainfall'
  | 'windSpeed'
  | 'windDirection'
  | 'pressure'
  | 'visibility'
  | 'cloudCover'
  | 'riverLevel'
  | 'reservoirLevel'
  | 'soilMoisture'
  | 'uvIndex';

export interface MetricReading {
  key: MetricKey;
  label: string;
  value: number;
  unit: string;
  icon: string;
  trend: Trend;
  /** Percent change vs. prior reading window */
  change: number;
  /** Historical sparkline values (oldest -> newest) */
  series: number[];
  severity: Severity;
  /** Human-readable status, e.g. "Normal", "Rising", "Critical" */
  status: string;
  /** Optional reference threshold */
  threshold?: { warning: number; critical: number };
}

export interface WeatherSnapshot {
  station: string;
  region: string;
  coordinates: { lat: number; lng: number };
  lastUpdated: string;
  metrics: MetricReading[];
}

export interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  region: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'resolved' | 'monitoring';
}

export interface NavSection {
  id: string;
  label: string;
  icon: string;
  to: string;
  badge?: string;
}

export interface RegionSummary {
  id: string;
  name: string;
  risk: Severity;
  riverLevel: number;
  rainfall24h: number;
  population: number;
  status: string;
}
