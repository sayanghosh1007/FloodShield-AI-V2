import type {
  AlertItem,
  MetricKey,
  MetricReading,
  RegionSummary,
  Severity,
  WeatherSnapshot,
} from '@/types';
import { seededRandom } from '@/lib/utils';

/**
 * Mock flood telemetry API.
 *
 * In a production deployment these functions would be backed by Supabase
 * tables or external sensor APIs. For this build we generate deterministic,
 * realistic-looking telemetry so the dashboard is fully functional offline.
 */

const NOW = Date.now();
const iso = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();

function series(seed: string, base: number, variance: number, points = 24): number[] {
  return Array.from({ length: points }, (_, i) => {
    const r = seededRandom(`${seed}-${i}`);
    return Number((base + (r - 0.5) * variance).toFixed(2));
  });
}

interface MetricSpec {
  key: MetricKey;
  label: string;
  unit: string;
  icon: string;
  base: number;
  variance: number;
  threshold?: { warning: number; critical: number };
  severityFromValue?: (v: number) => Severity;
  statusFromValue?: (v: number) => string;
}

const METRIC_SPECS: MetricSpec[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    icon: 'Thermometer',
    base: 27.4,
    variance: 6,
    severityFromValue: (v) => (v > 38 ? 'warning' : v > 32 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v > 38 ? 'Heat stress' : v > 32 ? 'Warm' : 'Normal'),
  },
  {
    key: 'humidity',
    label: 'Humidity',
    unit: '%',
    icon: 'Droplets',
    base: 82,
    variance: 18,
    severityFromValue: (v) => (v > 90 ? 'watch' : v > 80 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v > 90 ? 'Saturated' : v > 80 ? 'High' : 'Comfortable'),
  },
  {
    key: 'rainfall',
    label: 'Rainfall',
    unit: 'mm/h',
    icon: 'CloudRain',
    base: 14.6,
    variance: 22,
    threshold: { warning: 20, critical: 35 },
    severityFromValue: (v) => (v >= 35 ? 'critical' : v >= 20 ? 'warning' : v >= 10 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v >= 35 ? 'Torrential' : v >= 20 ? 'Heavy' : v >= 10 ? 'Moderate' : 'Light'),
  },
  {
    key: 'windSpeed',
    label: 'Wind Speed',
    unit: 'km/h',
    icon: 'Wind',
    base: 24,
    variance: 16,
    severityFromValue: (v) => (v > 60 ? 'warning' : v > 40 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v > 60 ? 'Gale' : v > 40 ? 'Strong' : 'Breeze'),
  },
  {
    key: 'windDirection',
    label: 'Wind Direction',
    unit: '°',
    icon: 'Compass',
    base: 158,
    variance: 60,
    severityFromValue: () => 'info',
    statusFromValue: (v) => compassLabel(v),
  },
  {
    key: 'pressure',
    label: 'Pressure',
    unit: 'hPa',
    icon: 'Gauge',
    base: 1006,
    variance: 12,
    severityFromValue: (v) => (v < 995 ? 'warning' : v < 1000 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v < 995 ? 'Falling' : v < 1000 ? 'Low' : 'Steady'),
  },
  {
    key: 'visibility',
    label: 'Visibility',
    unit: 'km',
    icon: 'Eye',
    base: 7.2,
    variance: 6,
    severityFromValue: (v) => (v < 2 ? 'warning' : v < 5 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v < 2 ? 'Poor' : v < 5 ? 'Reduced' : 'Clear'),
  },
  {
    key: 'cloudCover',
    label: 'Cloud Cover',
    unit: '%',
    icon: 'Cloud',
    base: 78,
    variance: 30,
    severityFromValue: (v) => (v > 90 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v > 90 ? 'Overcast' : v > 60 ? 'Cloudy' : 'Partly clear'),
  },
  {
    key: 'riverLevel',
    label: 'River Level',
    unit: 'm',
    icon: 'Waves',
    base: 5.8,
    variance: 2.4,
    threshold: { warning: 7, critical: 8.5 },
    severityFromValue: (v) => (v >= 8.5 ? 'critical' : v >= 7 ? 'warning' : v >= 6 ? 'watch' : 'info'),
    statusFromValue: (v) => (v >= 8.5 ? 'Critical' : v >= 7 ? 'Flood stage' : v >= 6 ? 'Rising' : 'Normal'),
  },
  {
    key: 'reservoirLevel',
    label: 'Reservoir Level',
    unit: '%',
    icon: 'Database',
    base: 86,
    variance: 18,
    threshold: { warning: 92, critical: 98 },
    severityFromValue: (v) => (v >= 98 ? 'critical' : v >= 92 ? 'warning' : v >= 85 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v >= 98 ? 'Spillway risk' : v >= 92 ? 'Near capacity' : v >= 85 ? 'High' : 'Normal'),
  },
  {
    key: 'soilMoisture',
    label: 'Soil Moisture',
    unit: '%',
    icon: 'Sprout',
    base: 64,
    variance: 22,
    severityFromValue: (v) => (v > 85 ? 'watch' : v > 70 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v > 85 ? 'Saturated' : v > 70 ? 'Moist' : 'Moderate'),
  },
  {
    key: 'uvIndex',
    label: 'UV Index',
    unit: 'UVI',
    icon: 'Sun',
    base: 6.4,
    variance: 5,
    severityFromValue: (v) => (v >= 8 ? 'warning' : v >= 6 ? 'advisory' : 'info'),
    statusFromValue: (v) => (v >= 8 ? 'Very high' : v >= 6 ? 'High' : v >= 3 ? 'Moderate' : 'Low'),
  },
];

function compassLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

function buildMetric(spec: MetricSpec, station: string): MetricReading {
  const s = series(`${station}-${spec.key}`, spec.base, spec.variance);
  const value = s[s.length - 1];
  const prev = s[s.length - 2] ?? value;
  const change = prev === 0 ? 0 : Number((((value - prev) / prev) * 100).toFixed(1));
  const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';
  return {
    key: spec.key,
    label: spec.label,
    value,
    unit: spec.unit,
    icon: spec.icon,
    trend,
    change,
    series: s,
    severity: spec.severityFromValue ? spec.severityFromValue(value) : 'info',
    status: spec.statusFromValue ? spec.statusFromValue(value) : 'Normal',
    threshold: spec.threshold,
  };
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  await delay(650);
  const station = 'Riverside Sensor Array 04';
  const region = 'Eastern Flood Basin';
  return {
    station,
    region,
    coordinates: { lat: 28.6139, lng: 77.209 },
    lastUpdated: iso(2),
    metrics: METRIC_SPECS.map((spec) => buildMetric(spec, station)),
  };
}

export async function getAlerts(): Promise<AlertItem[]> {
  await delay(500);
  return [
    {
      id: 'alert-001',
      severity: 'critical',
      title: 'River overflow imminent — Sector 7',
      region: 'Eastern Flood Basin',
      message:
        'River level exceeded critical threshold (8.5m). Immediate evacuation advised for low-lying zones A2–A5.',
      issuedAt: iso(18),
      expiresAt: iso(-180),
      status: 'active',
    },
    {
      id: 'alert-002',
      severity: 'warning',
      title: 'Heavy rainfall alert — 24h forecast',
      region: 'Northern Highlands',
      message: 'Cumulative rainfall projected to exceed 120mm over the next 24 hours.',
      issuedAt: iso(45),
      expiresAt: iso(-720),
      status: 'active',
    },
    {
      id: 'alert-003',
      severity: 'watch',
      title: 'Reservoir approaching spillway capacity',
      region: 'Central Reservoir Dam 03',
      message: 'Reservoir level at 92%. Controlled release initiated. Monitoring continues.',
      issuedAt: iso(90),
      expiresAt: iso(-360),
      status: 'monitoring',
    },
    {
      id: 'alert-004',
      severity: 'advisory',
      title: 'Soil saturation rising in agricultural belt',
      region: 'Southern Plains',
      message: 'Soil moisture above 80%. Runoff risk elevated for the next storm cycle.',
      issuedAt: iso(140),
      expiresAt: iso(-480),
      status: 'monitoring',
    },
    {
      id: 'alert-005',
      severity: 'info',
      title: 'Sensor maintenance completed — Station 04',
      region: 'Eastern Flood Basin',
      message: 'Calibration cycle complete. Telemetry stream restored to nominal.',
      issuedAt: iso(220),
      expiresAt: iso(-60),
      status: 'resolved',
    },
  ];
}

export async function getRegions(): Promise<RegionSummary[]> {
  await delay(420);
  return [
    { id: 'r1', name: 'Eastern Flood Basin', risk: 'critical', riverLevel: 8.7, rainfall24h: 96, population: 184000, status: 'Evacuation active' },
    { id: 'r2', name: 'Northern Highlands', risk: 'warning', riverLevel: 6.4, rainfall24h: 74, population: 92000, status: 'Heavy rain forecast' },
    { id: 'r3', name: 'Central Reservoir Belt', risk: 'watch', riverLevel: 5.2, rainfall24h: 41, population: 210000, status: 'Controlled release' },
    { id: 'r4', name: 'Southern Plains', risk: 'advisory', riverLevel: 3.9, rainfall24h: 28, population: 305000, status: 'Runoff monitoring' },
    { id: 'r5', name: 'Coastal Delta', risk: 'info', riverLevel: 2.6, rainfall24h: 12, population: 421000, status: 'Stable' },
  ];
}

/** Region map markers (lat/lng) for the operations console GIS map. */
export interface RegionMapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: Severity;
  population: number;
  riverLevel: number;
}

export async function getRegionPins(): Promise<RegionMapPin[]> {
  await delay(300);
  return [
    { id: 'r1', name: 'Eastern Flood Basin', lat: 25.61, lng: 85.14, risk: 'critical', population: 184000, riverLevel: 8.7 },
    { id: 'r2', name: 'Northern Highlands', lat: 30.34, lng: 78.05, risk: 'warning', population: 92000, riverLevel: 6.4 },
    { id: 'r3', name: 'Central Reservoir Belt', lat: 22.3, lng: 76.4, risk: 'watch', population: 210000, riverLevel: 5.2 },
    { id: 'r4', name: 'Southern Plains', lat: 13.5, lng: 78.4, risk: 'advisory', population: 305000, riverLevel: 3.9 },
    { id: 'r5', name: 'Coastal Delta', lat: 16.5, lng: 81.5, risk: 'info', population: 421000, riverLevel: 2.6 },
    { id: 'r6', name: 'Brahmaputra Valley', lat: 26.58, lng: 92.8, risk: 'critical', population: 156000, riverLevel: 9.1 },
    { id: 'r7', name: 'Western Ghats', lat: 15.3, lng: 74.2, risk: 'warning', population: 67000, riverLevel: 5.8 },
  ];
}

/** Dense flood-area markers spread all over India (replaces the 7-region pins). */
const INDIA_FLOOD_AREAS: RegionMapPin[] = [
  { id: 'fa-1', name: 'Ganga floodplain — Patna', lat: 25.61, lng: 85.14, risk: 'critical', population: 184000, riverLevel: 8.7 },
  { id: 'fa-2', name: 'Brahmaputra valley', lat: 26.58, lng: 92.8, risk: 'critical', population: 156000, riverLevel: 9.1 },
  { id: 'fa-3', name: 'Kosi flood area', lat: 26.7, lng: 86.9, risk: 'critical', population: 92000, riverLevel: 8.2 },
  { id: 'fa-4', name: 'Sundarbans delta', lat: 21.9, lng: 88.9, risk: 'critical', population: 120000, riverLevel: 7.8 },
  { id: 'fa-5', name: 'Yamuna lowlands — Delhi', lat: 28.6, lng: 77.2, risk: 'warning', population: 210000, riverLevel: 6.8 },
  { id: 'fa-6', name: 'Gandak plains', lat: 27.3, lng: 84.4, risk: 'warning', population: 88000, riverLevel: 6.5 },
  { id: 'fa-7', name: 'Ghaghara basin', lat: 27.0, lng: 81.5, risk: 'warning', population: 76000, riverLevel: 6.2 },
  { id: 'fa-8', name: 'Teesta flood area', lat: 26.9, lng: 88.6, risk: 'warning', population: 58000, riverLevel: 6.3 },
  { id: 'fa-9', name: 'Godavari basin', lat: 18.5, lng: 80.3, risk: 'warning', population: 145000, riverLevel: 6.0 },
  { id: 'fa-10', name: 'Mahanadi delta', lat: 20.5, lng: 85.9, risk: 'watch', population: 130000, riverLevel: 5.4 },
  { id: 'fa-11', name: 'Subarnarekha basin', lat: 22.3, lng: 86.4, risk: 'watch', population: 54000, riverLevel: 5.0 },
  { id: 'fa-12', name: 'Damodar floodplain', lat: 23.0, lng: 87.5, risk: 'watch', population: 67000, riverLevel: 4.8 },
  { id: 'fa-13', name: 'Krishna delta', lat: 16.5, lng: 81.5, risk: 'watch', population: 98000, riverLevel: 4.6 },
  { id: 'fa-14', name: 'Brahmani delta', lat: 20.9, lng: 86.2, risk: 'watch', population: 58000, riverLevel: 5.1 },
  { id: 'fa-15', name: 'Baitarani floodplain', lat: 21.5, lng: 86.5, risk: 'watch', population: 41000, riverLevel: 4.7 },
  { id: 'fa-16', name: 'Manas plains', lat: 26.5, lng: 90.9, risk: 'watch', population: 44000, riverLevel: 5.2 },
  { id: 'fa-17', name: 'Narmada valley', lat: 22.0, lng: 74.5, risk: 'advisory', population: 71000, riverLevel: 3.9 },
  { id: 'fa-18', name: 'Tapti basin', lat: 21.2, lng: 75.6, risk: 'advisory', population: 48000, riverLevel: 3.5 },
  { id: 'fa-19', name: 'Cauvery floodplain', lat: 11.0, lng: 78.7, risk: 'advisory', population: 62000, riverLevel: 3.8 },
  { id: 'fa-20', name: 'Chambal ravines', lat: 26.0, lng: 77.8, risk: 'info', population: 32000, riverLevel: 3.0 },
  { id: 'fa-21', name: 'Mahi floodplain', lat: 22.3, lng: 73.0, risk: 'info', population: 28000, riverLevel: 2.8 },
  { id: 'fa-22', name: 'Sabarmati basin', lat: 23.0, lng: 72.6, risk: 'info', population: 24000, riverLevel: 2.6 },
  { id: 'fa-23', name: 'Pennar basin', lat: 14.4, lng: 79.8, risk: 'info', population: 22000, riverLevel: 2.4 },
  { id: 'fa-24', name: 'Luni basin', lat: 25.8, lng: 71.4, risk: 'info', population: 12000, riverLevel: 1.9 },
];

/** Flood-area markers spread all over India for the operations console map. */
export async function getIndiaFloodAreas(): Promise<RegionMapPin[]> {
  await delay(300);
  return INDIA_FLOOD_AREAS;
}

/** Detailed weather + river telemetry for a specific flood region. */
export interface RegionWeatherDetail {
  id: string;
  name: string;
  /** Per-metric current readings for the weather detail cards. */
  conditions: {
    key: MetricKey;
    label: string;
    value: number;
    unit: string;
    icon: string;
    severity: Severity;
  }[];
  /** River-level trend series for 24h / 48h / 72h horizons. */
  river: {
    warningLevel: number;
    criticalLevel: number;
    series24h: number[];
    series48h: number[];
    series72h: number[];
  };
}

interface RegionDetailSpec {
  name: string;
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  warningLevel: number;
  criticalLevel: number;
  riverBase: number;
}

const REGIONS_DETAIL: Record<string, RegionDetailSpec> = {
  r1: { name: 'Eastern Flood Basin', temp: 28.4, humidity: 91, rainfall: 18.2, windSpeed: 32, pressure: 994, visibility: 3.2, warningLevel: 7, criticalLevel: 8.5, riverBase: 8.7 },
  r2: { name: 'Northern Highlands', temp: 22.1, humidity: 78, rainfall: 9.6, windSpeed: 41, pressure: 1002, visibility: 6.8, warningLevel: 6, criticalLevel: 7.5, riverBase: 6.4 },
  r3: { name: 'Central Reservoir Belt', temp: 30.8, humidity: 64, rainfall: 4.1, windSpeed: 18, pressure: 1008, visibility: 9.5, warningLevel: 5.5, criticalLevel: 7, riverBase: 5.2 },
  r4: { name: 'Southern Plains', temp: 33.6, humidity: 58, rainfall: 1.8, windSpeed: 14, pressure: 1011, visibility: 11, warningLevel: 4.5, criticalLevel: 6, riverBase: 3.9 },
  r5: { name: 'Coastal Delta', temp: 31.2, humidity: 72, rainfall: 0.6, windSpeed: 22, pressure: 1009, visibility: 10, warningLevel: 4, criticalLevel: 5.5, riverBase: 2.6 },
  r6: { name: 'Brahmaputra Valley', temp: 26.8, humidity: 95, rainfall: 22.4, windSpeed: 28, pressure: 991, visibility: 2.8, warningLevel: 8, criticalLevel: 9.5, riverBase: 9.1 },
  r7: { name: 'Western Ghats', temp: 24.5, humidity: 84, rainfall: 12.3, windSpeed: 36, pressure: 1004, visibility: 5.5, warningLevel: 5, criticalLevel: 6.5, riverBase: 5.8 },
};

function riverSeries(base: number, variance: number, points: number, rising: boolean): number[] {
  return Array.from({ length: points }, (_, i) => {
    const t = i / Math.max(1, points - 1);
    const trend = rising ? -variance * 0.4 * (1 - t) : variance * 0.3 * (1 - t);
    const noise = (seededRandom(`river-${base}-${i}`) - 0.5) * variance * 0.5;
    return Number((base + trend + noise).toFixed(2));
  });
}

function severityFor(key: MetricKey, v: number): Severity {
  if (key === 'temperature') return v > 38 ? 'warning' : v > 32 ? 'advisory' : 'info';
  if (key === 'humidity') return v > 90 ? 'watch' : v > 80 ? 'advisory' : 'info';
  if (key === 'rainfall') return v >= 35 ? 'critical' : v >= 20 ? 'warning' : v >= 10 ? 'advisory' : 'info';
  if (key === 'windSpeed') return v > 60 ? 'warning' : v > 40 ? 'advisory' : 'info';
  if (key === 'pressure') return v < 995 ? 'warning' : v < 1000 ? 'advisory' : 'info';
  if (key === 'visibility') return v < 2 ? 'warning' : v < 5 ? 'advisory' : 'info';
  return 'info';
}

function buildRegionDetail(id: string, spec: RegionDetailSpec): RegionWeatherDetail {
  const rising = spec.riverBase >= spec.warningLevel;
  return {
    id,
    name: spec.name,
    conditions: [
      { key: 'temperature', label: 'Temperature', value: spec.temp, unit: '°C', icon: 'Thermometer', severity: severityFor('temperature', spec.temp) },
      { key: 'humidity', label: 'Humidity', value: spec.humidity, unit: '%', icon: 'Droplets', severity: severityFor('humidity', spec.humidity) },
      { key: 'rainfall', label: 'Rainfall', value: spec.rainfall, unit: 'mm/h', icon: 'CloudRain', severity: severityFor('rainfall', spec.rainfall) },
      { key: 'windSpeed', label: 'Wind Speed', value: spec.windSpeed, unit: 'km/h', icon: 'Wind', severity: severityFor('windSpeed', spec.windSpeed) },
      { key: 'pressure', label: 'Pressure', value: spec.pressure, unit: 'hPa', icon: 'Gauge', severity: severityFor('pressure', spec.pressure) },
      { key: 'visibility', label: 'Visibility', value: spec.visibility, unit: 'km', icon: 'Eye', severity: severityFor('visibility', spec.visibility) },
    ],
    river: {
      warningLevel: spec.warningLevel,
      criticalLevel: spec.criticalLevel,
      series24h: riverSeries(spec.riverBase, spec.riverBase * 0.12, 24, rising),
      series48h: riverSeries(spec.riverBase, spec.riverBase * 0.18, 48, rising),
      series72h: riverSeries(spec.riverBase, spec.riverBase * 0.25, 72, rising),
    },
  };
}

/** Synthesize region detail from any India flood-area pin. */
function buildDetailFromPin(pin: RegionMapPin): RegionWeatherDetail {
  const riskFactor = ({ critical: 1, warning: 0.75, watch: 0.5, advisory: 0.3, info: 0.15 } as const)[pin.risk] ?? 0.2;
  const rising = riskFactor >= 0.5;
  const warningLevel = Number((rising ? pin.riverLevel * 0.82 : pin.riverLevel * 1.2).toFixed(1));
  const criticalLevel = Number((rising ? pin.riverLevel * 0.93 : pin.riverLevel * 1.4).toFixed(1));
  const temp = Number((35 - (pin.lat - 18) * 0.45 - riskFactor * 2).toFixed(1));
  const humidity = Math.min(98, Math.round(55 + riskFactor * 35));
  const rainfall = Number((riskFactor * 22).toFixed(1));
  const windSpeed = Math.round(12 + riskFactor * 28);
  const pressure = Math.round(1012 - riskFactor * 18);
  const visibility = Number(Math.max(2, 12 - riskFactor * 8).toFixed(1));
  return {
    id: pin.id,
    name: pin.name,
    conditions: [
      { key: 'temperature', label: 'Temperature', value: temp, unit: '°C', icon: 'Thermometer', severity: severityFor('temperature', temp) },
      { key: 'humidity', label: 'Humidity', value: humidity, unit: '%', icon: 'Droplets', severity: severityFor('humidity', humidity) },
      { key: 'rainfall', label: 'Rainfall', value: rainfall, unit: 'mm/h', icon: 'CloudRain', severity: severityFor('rainfall', rainfall) },
      { key: 'windSpeed', label: 'Wind Speed', value: windSpeed, unit: 'km/h', icon: 'Wind', severity: severityFor('windSpeed', windSpeed) },
      { key: 'pressure', label: 'Pressure', value: pressure, unit: 'hPa', icon: 'Gauge', severity: severityFor('pressure', pressure) },
      { key: 'visibility', label: 'Visibility', value: visibility, unit: 'km', icon: 'Eye', severity: severityFor('visibility', visibility) },
    ],
    river: {
      warningLevel,
      criticalLevel,
      series24h: riverSeries(pin.riverLevel, pin.riverLevel * 0.12, 24, rising),
      series48h: riverSeries(pin.riverLevel, pin.riverLevel * 0.18, 48, rising),
      series72h: riverSeries(pin.riverLevel, pin.riverLevel * 0.25, 72, rising),
    },
  };
}

export async function getRegionWeatherDetail(regionId: string): Promise<RegionWeatherDetail> {
  await delay(400);
  const entry = Object.entries(REGIONS_DETAIL).find(([id]) => id === regionId);
  if (entry) return buildRegionDetail(entry[0], entry[1]);
  const pin = INDIA_FLOOD_AREAS.find((p) => p.id === regionId);
  if (pin) return buildDetailFromPin(pin);
  return buildRegionDetail('r1', REGIONS_DETAIL['r1']);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Worldwide flood hotspot — for the global flood map. */
export interface WorldFloodHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: Severity;
  depth: number;
  affected: number;
  country: string;
  since: string;
}

/** Global active flood events — shows floods all over the world. */
export async function getWorldFloodHotspots(): Promise<WorldFloodHotspot[]> {
  await delay(400);
  const now = Date.now();
  const h = (hours: number) => new Date(now - hours * 3600_000).toISOString();
  return [
    { id: 'w1', name: 'Ganga Basin floods', lat: 25.61, lng: 85.14, risk: 'critical', depth: 2.4, affected: 184000, country: 'India', since: h(6) },
    { id: 'w2', name: 'Brahmaputra overflow', lat: 26.58, lng: 92.8, risk: 'critical', depth: 2.1, affected: 156000, country: 'India', since: h(12) },
    { id: 'w3', name: 'Koshi embankment breach', lat: 26.7, lng: 86.9, risk: 'warning', depth: 1.8, affected: 92000, country: 'Nepal', since: h(9) },
    { id: 'w4', name: 'Indus river flooding', lat: 30.2, lng: 71.5, risk: 'warning', depth: 1.6, affected: 134000, country: 'Pakistan', since: h(18) },
    { id: 'w5', name: 'Yangtze basin floods', lat: 30.6, lng: 114.3, risk: 'critical', depth: 2.8, affected: 410000, country: 'China', since: h(24) },
    { id: 'w6', name: 'Mekong delta inundation', lat: 10.0, lng: 105.8, risk: 'watch', depth: 1.2, affected: 78000, country: 'Vietnam', since: h(30) },
    { id: 'w7', name: 'Bangladesh lowland floods', lat: 23.7, lng: 90.4, risk: 'critical', depth: 2.2, affected: 320000, country: 'Bangladesh', since: h(8) },
    { id: 'w8', name: 'Mississippi river overflow', lat: 33.0, lng: -90.2, risk: 'watch', depth: 1.4, affected: 56000, country: 'USA', since: h(36) },
    { id: 'w9', name: 'Rhine basin high water', lat: 51.2, lng: 6.8, risk: 'advisory', depth: 0.9, affected: 18000, country: 'Germany', since: h(20) },
    { id: 'w10', name: 'Thames valley flooding', lat: 51.5, lng: -0.5, risk: 'advisory', depth: 0.7, affected: 12000, country: 'UK', since: h(28) },
    { id: 'w11', name: 'Amazon tributary floods', lat: -3.5, lng: -62.2, risk: 'watch', depth: 1.5, affected: 88000, country: 'Brazil', since: h(40) },
    { id: 'w12', name: 'Nile basin inundation', lat: 15.6, lng: 32.5, risk: 'watch', depth: 1.1, affected: 64000, country: 'Sudan', since: h(48) },
    { id: 'w13', name: 'Niger river floods', lat: 13.5, lng: 2.1, risk: 'warning', depth: 1.3, affected: 96000, country: 'Niger', since: h(33) },
    { id: 'w14', name: 'Queensland flood plain', lat: -27.5, lng: 152.0, risk: 'advisory', depth: 0.8, affected: 22000, country: 'Australia', since: h(44) },
    { id: 'w15', name: 'Jakarta urban flooding', lat: -6.2, lng: 106.8, risk: 'watch', depth: 1.0, affected: 45000, country: 'Indonesia', since: h(15) },
    { id: 'w16', name: 'Philippines typhoon surge', lat: 14.6, lng: 121.0, risk: 'critical', depth: 1.9, affected: 210000, country: 'Philippines', since: h(10) },
    { id: 'w17', name: 'Mozambique Limpopo floods', lat: -24.5, lng: 33.5, risk: 'warning', depth: 1.4, affected: 71000, country: 'Mozambique', since: h(52) },
    { id: 'w18', name: 'Somalia Shabelle floods', lat: 2.5, lng: 45.4, risk: 'watch', depth: 1.0, affected: 38000, country: 'Somalia', since: h(56) },
  ];
}
