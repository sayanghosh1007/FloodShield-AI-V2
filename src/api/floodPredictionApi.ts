import type { Severity } from '@/types';

/**
 * AI Flood Prediction data layer.
 *
 * Generates flood-inundation predictions across India for 24h, 48h, and 72h
 * horizons. Includes a gridded prediction field (risk / extent / depth), plus
 * critical-infrastructure overlays: roads, hospitals, shelters, villages, and
 * district boundaries.
 *
 * In production these would come from a hydrological model service; here we
 * generate a deterministic, realistic field so the dashboard is interactive.
 */

export type PredictionHorizon = 24 | 48 | 72;

export type PredictionLayerKey =
  | 'risk'
  | 'extent'
  | 'depth'
  | 'live'
  | 'high-alert'
  | 'roads'
  | 'hospitals'
  | 'shelters'
  | 'villages'
  | 'districts';

/**
 * 5-tier risk color scheme:
 *  - safe      → Green   (#10b981) — 0–0.15
 *  - low       → Yellow  (#eab308) — 0.15–0.35
 *  - moderate  → Orange  (#f97316) — 0.35–0.55
 *  - high      → Red     (#dc2626) — 0.55–0.78
 *  - extreme   → Dark Red (#7f1d1d) — 0.78–1.0
 */
export type RiskTier = 'safe' | 'low' | 'moderate' | 'high' | 'extreme';

export interface RiskColorStop {
  tier: RiskTier;
  label: string;
  color: string;
  fill: string;
  threshold: number;
}

export const RISK_COLOR_SCHEME: RiskColorStop[] = [
  { tier: 'safe', label: 'Safe', color: '#10b981', fill: 'rgba(16,185,129,0.25)', threshold: 0.15 },
  { tier: 'low', label: 'Low Risk', color: '#eab308', fill: 'rgba(234,179,8,0.30)', threshold: 0.35 },
  { tier: 'moderate', label: 'Moderate Risk', color: '#f97316', fill: 'rgba(249,115,22,0.40)', threshold: 0.55 },
  { tier: 'high', label: 'High Risk', color: '#dc2626', fill: 'rgba(220,38,38,0.50)', threshold: 0.78 },
  { tier: 'extreme', label: 'Extreme Flood Risk', color: '#7f1d1d', fill: 'rgba(127,29,29,0.60)', threshold: 1.0 },
];

export function riskTierOf(risk: number): RiskColorStop {
  return RISK_COLOR_SCHEME.find((s) => risk <= s.threshold) ?? RISK_COLOR_SCHEME[RISK_COLOR_SCHEME.length - 1];
}

export function riskColorHex(risk: number): string {
  return riskTierOf(risk).color;
}

export interface PredictionLayerMeta {
  key: PredictionLayerKey;
  label: string;
  icon: string;
  description: string;
  group: 'prediction' | 'infrastructure';
}

export const PREDICTION_LAYERS: PredictionLayerMeta[] = [
  { key: 'live', label: 'Live Floods', icon: 'Radio', description: 'Active flooding happening now', group: 'prediction' },
  { key: 'high-alert', label: 'High Alert Areas', icon: 'Siren', description: 'Districts under high alert', group: 'prediction' },
  { key: 'risk', label: 'Flood Risk', icon: 'ShieldAlert', description: 'Probability-weighted risk zones', group: 'prediction' },
  { key: 'extent', label: 'Flood Extent', icon: 'Waves', description: 'Modeled inundation boundary', group: 'prediction' },
  { key: 'depth', label: 'Flood Depth', icon: 'Droplets', description: 'Water depth above ground', group: 'prediction' },
  { key: 'roads', label: 'Roads', icon: 'Road', description: 'National & state highways', group: 'infrastructure' },
  { key: 'hospitals', label: 'Hospitals', icon: 'PlusSquare', description: 'Healthcare facilities at risk', group: 'infrastructure' },
  { key: 'shelters', label: 'Shelters', icon: 'Home', description: 'Designated relief shelters', group: 'infrastructure' },
  { key: 'villages', label: 'Villages', icon: 'Trees', description: 'Affected settlements', group: 'infrastructure' },
  { key: 'districts', label: 'Districts', icon: 'Map', description: 'District boundary overlays', group: 'infrastructure' },
];

export interface FloodCell {
  id: string;
  lng: number;
  lat: number;
  /** Flooded fraction 0..1 — "extent". */
  extent: number;
  /** Water depth in meters. */
  depth: number;
  /** Risk probability 0..1. */
  risk: number;
  severity: Severity;
  /** 5-tier risk classification. */
  tier: RiskTier;
}

/** A live, currently-active flood event — flooding happening right now. */
export interface LiveFlood {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** Affected radius in meters. */
  radius: number;
  /** Current water depth above ground (m). */
  depth: number;
  /** Number of people affected. */
  affected: number;
  /** When flooding began. */
  since: string;
  tier: RiskTier;
  source: string;
  /** River responsible for the flooding. */
  river: string;
  /** Indian state where the flooding is occurring. */
  state: string;
}

/** A district/area placed under a high-alert advisory. */
export interface HighAlertArea {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** Polygon ring [lng,lat]. */
  ring: number[][];
  reason: string;
  issuedAt: string;
  tier: RiskTier;
  affectedPopulation: number;
}

export interface InfraPoint {
  id: string;
  name: string;
  lng: number;
  lat: number;
  kind: 'hospital' | 'shelter' | 'village';
  atRisk: boolean;
  detail?: string;
  population?: number;
  capacity?: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  path: { lng: number; lat: number }[];
  flooded: boolean;
}

export interface DistrictBoundary {
  id: string;
  name: string;
  ring: number[][];
  risk: Severity;
  affectedPopulation: number;
}

export interface FloodPopupData {
  lng: number;
  lat: number;
  cell?: FloodCell;
  infra?: InfraPoint;
  nearby: {
    hospitals: number;
    shelters: number;
    villages: number;
    roadsFlooded: number;
  };
}

export interface FloodPredictionSnapshot {
  lastUpdated: string;
  modelVersion: string;
  confidence: number;
  horizons: Record<PredictionHorizon, {
    cells: FloodCell[];
    floodedAreaKm2: number;
    populationAffected: number;
    confidence: number;
  }>;
  liveFloods: LiveFlood[];
  highAlerts: HighAlertArea[];
  infra: InfraPoint[];
  roads: RoadSegment[];
  districts: DistrictBoundary[];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function severityFromRisk(r: number): Severity {
  if (r >= 0.78) return 'critical';
  if (r >= 0.55) return 'warning';
  if (r >= 0.35) return 'watch';
  if (r >= 0.15) return 'advisory';
  return 'info';
}

function tierFromRisk(risk: number): RiskTier {
  if (risk >= 0.78) return 'extreme';
  if (risk >= 0.55) return 'high';
  if (risk >= 0.35) return 'moderate';
  if (risk >= 0.15) return 'low';
  return 'safe';
}

/** Coefficient that grows the flood field over the 24/48/72h horizons. */
function horizonScale(h: PredictionHorizon): number {
  return h === 24 ? 0.55 : h === 48 ? 0.78 : 1.0;
}

function buildGrid(horizon: PredictionHorizon): FloodCell[] {
  const cols = 14;
  const rows = 16;
  const lngMin = 70, lngMax = 96, latMin = 8, latMax = 33;
  const scale = horizonScale(horizon);
  const cells: FloodCell[] = [];

  // Two flood "epicenters": Gangetic plain (Bihar/UP) and coastal Andhra.
  const epicenters = [
    { lng: 85.2, lat: 25.6, intensity: 0.9 },
    { lng: 81.8, lat: 16.3, intensity: 0.75 },
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng = lngMin + (c / (cols - 1)) * (lngMax - lngMin);
      const lat = latMin + (r / (rows - 1)) * (latMax - latMin);
      let risk = 0;
      for (const e of epicenters) {
        const d = Math.hypot(lng - e.lng, lat - e.lat);
        risk = Math.max(risk, e.intensity * Math.exp(-(d * d) / 18) * scale);
      }
      risk += (seeded(`cell-${lng}-${lat}-${horizon}`) - 0.5) * 0.08;
      risk = Math.min(1, Math.max(0, risk));
      if (risk < 0.12) continue; // skip negligible cells
      const extent = Math.min(1, risk * 1.1);
      const depth = risk * 2.6 * scale; // up to ~2.6m at 72h
      cells.push({
        id: `cell-${c}-${r}-${horizon}`,
        lng,
        lat,
        extent,
        depth: Number(depth.toFixed(2)),
        risk: Number(risk.toFixed(3)),
        severity: severityFromRisk(risk),
        tier: tierFromRisk(risk),
      });
    }
  }
  return cells;
}

function buildInfra(): InfraPoint[] {
  const items: Array<Omit<InfraPoint, 'id' | 'atRisk'>> = [
    { name: 'Patna Medical College', lng: 85.14, lat: 25.6, kind: 'hospital', detail: '850 beds' },
    { name: 'Bhagalpur District Hospital', lng: 86.98, lat: 25.24, kind: 'hospital', detail: '420 beds' },
    { name: 'Gaya Civil Hospital', lng: 85.0, lat: 24.79, kind: 'hospital', detail: '310 beds' },
    { name: 'Vijayawada General Hospital', lng: 80.65, lat: 16.51, kind: 'hospital', detail: '620 beds' },
    { name: 'Relief Camp — Patna Sector 7', lng: 85.05, lat: 25.62, kind: 'shelter', capacity: 1200 },
    { name: 'Relief Camp — Bhagalpur', lng: 87.0, lat: 25.26, kind: 'shelter', capacity: 800 },
    { name: 'Relief Camp — Vijayawada', lng: 80.62, lat: 16.49, kind: 'shelter', capacity: 1500 },
    { name: 'Relief Camp — Muzaffarpur', lng: 85.39, lat: 26.12, kind: 'shelter', capacity: 950 },
    { name: 'Maner Village', lng: 84.87, lat: 25.68, kind: 'village', population: 4200 },
    { name: 'Bakhtiarpur Village', lng: 85.45, lat: 25.46, kind: 'village', population: 3100 },
    { name: 'Khagaul Village', lng: 85.03, lat: 25.58, kind: 'village', population: 6800 },
    { name: 'Mangalagiri Village', lng: 80.55, lat: 16.43, kind: 'village', population: 5400 },
    { name: 'Tadepalle Village', lng: 80.6, lat: 16.48, kind: 'village', population: 3900 },
    { name: 'Begusarai Village', lng: 86.13, lat: 25.42, kind: 'village', population: 5200 },
  ];
  return items.map((it, i) => {
    // Mark at-risk based on proximity to epicenters (using 48h scale)
    const scale = horizonScale(48);
    const epi = [{ lng: 85.2, lat: 25.6 }, { lng: 81.8, lat: 16.3 }];
    const maxRisk = Math.max(
      ...epi.map((e) => Math.exp(-(Math.hypot(it.lng - e.lng, it.lat - e.lat) ** 2) / 18) * scale),
    );
    return { ...it, id: `infra-${i}`, atRisk: maxRisk > 0.3 };
  });
}

function buildRoads(): RoadSegment[] {
  const roads: Array<Omit<RoadSegment, 'id' | 'flooded'>> = [
    { name: 'NH-31 (Patna–Bhagalpur)', path: [{ lng: 85.14, lat: 25.6 }, { lng: 85.6, lat: 25.45 }, { lng: 86.4, lat: 25.35 }, { lng: 86.98, lat: 25.24 }] },
    { name: 'NH-30 (Patna–Muzaffarpur)', path: [{ lng: 85.14, lat: 25.6 }, { lng: 85.3, lat: 25.75 }, { lng: 85.39, lat: 26.12 }] },
    { name: 'NH-5 (Vijayawada–Guntur)', path: [{ lng: 80.65, lat: 16.51 }, { lng: 80.45, lat: 16.3 }, { lng: 80.3, lat: 16.1 }] },
    { name: 'NH-2 (Delhi–Kolkata)', path: [{ lng: 77.2, lat: 28.6 }, { lng: 80.0, lat: 27.0 }, { lng: 83.0, lat: 25.3 }, { lng: 88.36, lat: 22.57 }] },
    { name: 'NH-66 (Coastal Kerala)', path: [{ lng: 76.27, lat: 9.93 }, { lng: 75.8, lat: 11.0 }, { lng: 74.8, lat: 12.5 }] },
  ];
  return roads.map((r, i) => {
    // Flooded if any point is near an epicenter
    const flooded = r.path.some((p) =>
      [{ lng: 85.2, lat: 25.6 }, { lng: 81.8, lat: 16.3 }].some(
        (e) => Math.hypot(p.lng - e.lng, p.lat - e.lat) < 1.5,
      ),
    );
    return { ...r, id: `road-${i}`, flooded };
  });
}

function buildDistricts(): DistrictBoundary[] {
  return [
    {
      id: 'patna',
      name: 'Patna',
      ring: [[84.7, 25.4], [85.5, 25.45], [85.6, 25.8], [85.0, 25.9], [84.7, 25.4]],
      risk: 'critical',
      affectedPopulation: 124000,
    },
    {
      id: 'bhagalpur',
      name: 'Bhagalpur',
      ring: [[86.6, 25.1], [87.4, 25.15], [87.5, 25.5], [86.7, 25.55], [86.6, 25.1]],
      risk: 'warning',
      affectedPopulation: 68000,
    },
    {
      id: 'gaya',
      name: 'Gaya',
      ring: [[84.6, 24.6], [85.4, 24.65], [85.5, 25.0], [84.7, 25.05], [84.6, 24.6]],
      risk: 'watch',
      affectedPopulation: 41000,
    },
    {
      id: 'krishna',
      name: 'Krishna (AP)',
      ring: [[80.3, 16.1], [81.1, 16.15], [81.15, 16.7], [80.4, 16.75], [80.3, 16.1]],
      risk: 'warning',
      affectedPopulation: 89000,
    },
    {
      id: 'muzaffarpur',
      name: 'Muzaffarpur',
      ring: [[85.0, 25.85], [85.7, 25.9], [85.75, 26.3], [85.1, 26.35], [85.0, 25.85]],
      risk: 'warning',
      affectedPopulation: 73000,
    },
  ];
}

export async function getFloodPrediction(): Promise<FloodPredictionSnapshot> {
  await delay(800);
  const horizons: Record<PredictionHorizon, FloodPredictionSnapshot['horizons'][PredictionHorizon]> = {
    24: summarize(24),
    48: summarize(48),
    72: summarize(72),
  };
  return {
    lastUpdated: new Date().toISOString(),
    modelVersion: 'FS-Hydro v3.2 (ensemble)',
    confidence: 0.84,
    horizons,
    liveFloods: buildLiveFloods(),
    highAlerts: buildHighAlerts(),
    infra: buildInfra(),
    roads: buildRoads(),
    districts: buildDistricts(),
  };
}

/** Currently active flood events across India (flooding happening right now). */
function buildLiveFloods(): LiveFlood[] {
  const now = Date.now();
  const events: Array<Omit<LiveFlood, 'id' | 'tier'>> = [
    { name: 'Patna — Ganga overtopping at Gandhi Ghat', lng: 85.17, lat: 25.61, radius: 12000, depth: 2.4, affected: 48000, since: new Date(now - 6 * 3600_000).toISOString(), source: 'CWC river gauge + field report', river: 'Ganga', state: 'Bihar' },
    { name: 'Bhagalpur — Koshi embankment breach', lng: 86.98, lat: 25.24, radius: 16000, depth: 1.8, affected: 31000, since: new Date(now - 9 * 3600_000).toISOString(), source: 'SDRF field team', river: 'Koshi', state: 'Bihar' },
    { name: 'Krishna district — Budameru overflow', lng: 80.65, lat: 16.51, radius: 9000, depth: 1.2, affected: 18500, since: new Date(now - 3 * 3600_000).toISOString(), source: 'AP State Disaster Authority', river: 'Budameru', state: 'Andhra Pradesh' },
    { name: 'Muzaffarpur — Bagmati floods', lng: 85.39, lat: 26.12, radius: 11000, depth: 1.5, affected: 22000, since: new Date(now - 12 * 3600_000).toISOString(), source: 'Bihar Water Resources Dept', river: 'Bagmati', state: 'Bihar' },
    { name: 'Guwahati — Brahmaputra above danger level', lng: 91.74, lat: 26.14, radius: 18000, depth: 2.1, affected: 41000, since: new Date(now - 15 * 3600_000).toISOString(), source: 'CWC Brahmaputra gauge', river: 'Brahmaputra', state: 'Assam' },
    { name: 'Surat — Tapi riverine flooding', lng: 72.83, lat: 21.17, radius: 8000, depth: 0.9, affected: 12000, since: new Date(now - 4 * 3600_000).toISOString(), source: 'Gujarat SDMA', river: 'Tapi', state: 'Gujarat' },
  ];
  return events.map((e, i) => ({
    ...e,
    id: `live-${i}`,
    tier: e.depth >= 2 ? 'extreme' : e.depth >= 1.5 ? 'high' : 'moderate',
  }));
}

/** Districts/areas placed under a high-alert advisory. */
function buildHighAlerts(): HighAlertArea[] {
  const now = Date.now();
  return [
    {
      id: 'ha-patna',
      name: 'Patna District',
      lng: 85.14, lat: 25.61,
      ring: [[84.7, 25.4], [85.5, 25.45], [85.6, 25.8], [85.0, 25.9], [84.7, 25.4]],
      reason: 'Ganga above danger level; evacuation advised for sectors A2–A5',
      issuedAt: new Date(now - 5 * 3600_000).toISOString(),
      tier: 'extreme',
      affectedPopulation: 184000,
    },
    {
      id: 'ha-bhagalpur',
      name: 'Bhagalpur District',
      lng: 86.98, lat: 25.24,
      ring: [[86.6, 25.1], [87.4, 25.15], [87.5, 25.5], [86.7, 25.55], [86.6, 25.1]],
      reason: 'Embankment breach; multiple villages inundated',
      issuedAt: new Date(now - 8 * 3600_000).toISOString(),
      tier: 'extreme',
      affectedPopulation: 96000,
    },
    {
      id: 'ha-krishna',
      name: 'Krishna District (AP)',
      lng: 80.65, lat: 16.51,
      ring: [[80.3, 16.1], [81.1, 16.15], [81.15, 16.7], [80.4, 16.75], [80.3, 16.1]],
      reason: 'Budameru stream overflow; low-lying areas submerged',
      issuedAt: new Date(now - 3 * 3600_000).toISOString(),
      tier: 'high',
      affectedPopulation: 89000,
    },
    {
      id: 'ha-guwahati',
      name: 'Kamrup (Guwahati)',
      lng: 91.74, lat: 26.14,
      ring: [[91.4, 26.0], [92.1, 26.05], [92.05, 26.35], [91.45, 26.3], [91.4, 26.0]],
      reason: 'Brahmaputra above danger mark; riverside evacuation',
      issuedAt: new Date(now - 14 * 3600_000).toISOString(),
      tier: 'high',
      affectedPopulation: 67000,
    },
    {
      id: 'ha-muzaffarpur',
      name: 'Muzaffarpur District',
      lng: 85.39, lat: 26.12,
      ring: [[85.0, 25.85], [85.7, 25.9], [85.75, 26.3], [85.1, 26.35], [85.0, 25.85]],
      reason: 'Bagmati river in spate; agricultural flooding',
      issuedAt: new Date(now - 11 * 3600_000).toISOString(),
      tier: 'high',
      affectedPopulation: 73000,
    },
  ];
}

function summarize(h: PredictionHorizon) {
  const cells = buildGrid(h);
  const floodedArea = Math.round(cells.reduce((acc, c) => acc + c.extent * 320, 0)); // ~320 km² per cell
  const populationAffected = Math.round(
    cells.reduce((acc, c) => acc + c.extent * c.risk * 18000, 0) * (h === 24 ? 0.6 : h === 48 ? 0.8 : 1),
  );
  return {
    cells,
    floodedAreaKm2: floodedArea,
    populationAffected,
    confidence: h === 24 ? 0.89 : h === 48 ? 0.81 : 0.72,
  };
}

export interface Station {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  river: string;
  risk: 'critical' | 'warning' | 'watch' | 'advisory' | 'info';
  floodProbability: number;   // 0-100
  leadTime: number;           // hours
  peakRiverLevel: number;     // metres
  dangerLevel: number;        // metres (benchmark)
  riseRate: number;           // m/h
  rainfall72h: number;        // mm
  maxHourlyRain: number;      // mm
  terrainRisk: number;        // 0-1
  historicalRisk: number;     // 0-1
  confidence: number;         // 0-100
  rainfallForecast: number[]; // 72 hourly mm values
  riverLevelForecast: number[];// 72 hourly m values
  modelContributors: {
    rainfallTotal: number;
    rainfallIntensity: number;
    riverLevel: number;
    terrain: number;
    historical: number;
  };
  aiPlan: {
    situationAssessment: string[];
    immediateActions: string[];
    evacuationGuidance: string[];
  };
}

function stationSeries(base: number, variance: number, len: number, seed: string): number[] {
  return Array.from({ length: len }, (_, i) => {
    const v = base + (seeded(`${seed}-${i}`) - 0.5) * variance + Math.sin(i / 8) * variance * 0.4;
    return Number(Math.max(0, v).toFixed(2));
  });
}

function riverForecast(base: number, dangerLevel: number, len: number, seed: string, rising: boolean): number[] {
  return Array.from({ length: len }, (_, i) => {
    const trend = rising ? i * 0.012 : -i * 0.005;
    const v = base + trend + (seeded(`rv-${seed}-${i}`) - 0.5) * 0.4;
    return Number(Math.max(1, v).toFixed(2));
  });
}

const RAW_STATIONS: Omit<Station, 'rainfallForecast' | 'riverLevelForecast' | 'modelContributors' | 'aiPlan'>[] = [
  { id: 'st-1',  name: 'Mumbai Mithi',         state: 'Maharashtra',    lat: 19.07, lng: 72.88, river: 'Mithi',          risk: 'warning',  floodProbability: 52, leadTime: 24, peakRiverLevel: 6.4,  dangerLevel: 5.5,  riseRate: 0.018, rainfall72h: 88.4,  maxHourlyRain: 14.2, terrainRisk: 0.77, historicalRisk: 0.62, confidence: 84 },
  { id: 'st-2',  name: 'Guwahati Brahmaputra', state: 'Assam',           lat: 26.14, lng: 91.74, river: 'Brahmaputra',    risk: 'warning',  floodProbability: 41, leadTime: 40, peakRiverLevel: 49.2, dangerLevel: 46.0, riseRate: 0.011, rainfall72h: 64.1,  maxHourlyRain:  9.8, terrainRisk: 0.61, historicalRisk: 0.78, confidence: 79 },
  { id: 'st-3',  name: 'Kochi Periyar',        state: 'Kerala',          lat: 9.93,  lng: 76.27, river: 'Periyar',        risk: 'watch',    floodProbability: 39, leadTime: 43, peakRiverLevel: 8.9,  dangerLevel: 8.0,  riseRate: 0.009, rainfall72h: 72.0,  maxHourlyRain: 11.0, terrainRisk: 0.55, historicalRisk: 0.69, confidence: 87 },
  { id: 'st-4',  name: 'Patna Ganga Gauge',    state: 'Bihar',           lat: 25.61, lng: 85.14, river: 'Ganga',          risk: 'watch',    floodProbability: 35, leadTime: 39, peakRiverLevel: 27.2, dangerLevel: 50.45, riseRate: 0.006, rainfall72h: 29.3,  maxHourlyRain:  5.5, terrainRisk: 0.89, historicalRisk: 0.45, confidence: 87 },
  { id: 'st-5',  name: 'Kolkata Hooghly',      state: 'West Bengal',     lat: 22.57, lng: 88.36, river: 'Hooghly',        risk: 'watch',    floodProbability: 34, leadTime: 40, peakRiverLevel: 5.2,  dangerLevel: 4.8,  riseRate: 0.007, rainfall72h: 41.2,  maxHourlyRain:  7.1, terrainRisk: 0.50, historicalRisk: 0.55, confidence: 81 },
  { id: 'st-6',  name: 'Vijayawada Krishna',   state: 'Andhra Pradesh',  lat: 16.51, lng: 80.65, river: 'Krishna',        risk: 'watch',    floodProbability: 31, leadTime: 48, peakRiverLevel: 12.4, dangerLevel: 11.0, riseRate: 0.005, rainfall72h: 35.6,  maxHourlyRain:  6.2, terrainRisk: 0.44, historicalRisk: 0.38, confidence: 82 },
  { id: 'st-7',  name: 'Bhagalpur Kosi',       state: 'Bihar',           lat: 25.24, lng: 86.98, river: 'Kosi',           risk: 'watch',    floodProbability: 29, leadTime: 52, peakRiverLevel: 34.8, dangerLevel: 33.0, riseRate: 0.004, rainfall72h: 22.8,  maxHourlyRain:  4.4, terrainRisk: 0.83, historicalRisk: 0.71, confidence: 76 },
  { id: 'st-8',  name: 'Hyderabad Musi',       state: 'Telangana',       lat: 17.38, lng: 78.47, river: 'Musi',           risk: 'watch',    floodProbability: 27, leadTime: 58, peakRiverLevel: 4.1,  dangerLevel: 3.8,  riseRate: 0.003, rainfall72h: 19.5,  maxHourlyRain:  3.8, terrainRisk: 0.39, historicalRisk: 0.33, confidence: 74 },
  { id: 'st-9',  name: 'Surat Tapi',           state: 'Gujarat',         lat: 21.17, lng: 72.83, river: 'Tapi',           risk: 'advisory', floodProbability: 22, leadTime: 62, peakRiverLevel: 9.3,  dangerLevel: 9.0,  riseRate: 0.002, rainfall72h: 16.1,  maxHourlyRain:  3.0, terrainRisk: 0.35, historicalRisk: 0.29, confidence: 71 },
  { id: 'st-10', name: 'Varanasi Ganga',       state: 'Uttar Pradesh',   lat: 25.32, lng: 82.97, river: 'Ganga',          risk: 'advisory', floodProbability: 20, leadTime: 68, peakRiverLevel: 63.4, dangerLevel: 65.0, riseRate: 0.001, rainfall72h: 12.0,  maxHourlyRain:  2.5, terrainRisk: 0.30, historicalRisk: 0.41, confidence: 69 },
  { id: 'st-11', name: 'Cuttack Mahanadi',     state: 'Odisha',          lat: 20.46, lng: 85.88, river: 'Mahanadi',       risk: 'advisory', floodProbability: 19, leadTime: 71, peakRiverLevel: 16.8, dangerLevel: 17.5, riseRate: 0.001, rainfall72h: 14.4,  maxHourlyRain:  2.8, terrainRisk: 0.28, historicalRisk: 0.36, confidence: 68 },
  { id: 'st-12', name: 'Delhi Yamuna',         state: 'Delhi',           lat: 28.65, lng: 77.23, river: 'Yamuna',         risk: 'advisory', floodProbability: 18, leadTime: 74, peakRiverLevel: 203.8, dangerLevel: 204.5, riseRate: 0.001, rainfall72h: 11.2, maxHourlyRain:  2.1, terrainRisk: 0.25, historicalRisk: 0.32, confidence: 67 },
  { id: 'st-13', name: 'Muzaffarpur Bagmati',  state: 'Bihar',           lat: 26.12, lng: 85.39, river: 'Bagmati',        risk: 'warning',  floodProbability: 44, leadTime: 36, peakRiverLevel: 52.3, dangerLevel: 50.0, riseRate: 0.014, rainfall72h: 58.9,  maxHourlyRain: 10.4, terrainRisk: 0.68, historicalRisk: 0.60, confidence: 83 },
  { id: 'st-14', name: 'Dibrugarh Brahmaputra',state: 'Assam',           lat: 27.47, lng: 94.91, river: 'Brahmaputra',    risk: 'warning',  floodProbability: 47, leadTime: 30, peakRiverLevel: 88.6, dangerLevel: 84.0, riseRate: 0.016, rainfall72h: 74.2,  maxHourlyRain: 12.8, terrainRisk: 0.72, historicalRisk: 0.74, confidence: 81 },
  { id: 'st-15', name: 'Nashik Godavari',      state: 'Maharashtra',     lat: 19.99, lng: 73.79, river: 'Godavari',       risk: 'info',     floodProbability: 12, leadTime: 90, peakRiverLevel: 5.1,  dangerLevel: 6.0,  riseRate: 0.000, rainfall72h:  8.2,  maxHourlyRain:  1.6, terrainRisk: 0.18, historicalRisk: 0.22, confidence: 62 },
  { id: 'st-16', name: 'Puri Daya',            state: 'Odisha',          lat: 19.81, lng: 85.82, river: 'Daya',           risk: 'info',     floodProbability: 10, leadTime: 96, peakRiverLevel: 3.2,  dangerLevel: 4.0,  riseRate: 0.000, rainfall72h:  6.9,  maxHourlyRain:  1.3, terrainRisk: 0.15, historicalRisk: 0.20, confidence: 59 },
];

function buildStation(raw: typeof RAW_STATIONS[number]): Station {
  const rising = raw.floodProbability >= 30;
  const rainfallForecast = stationSeries(raw.rainfall72h / 72, raw.maxHourlyRain * 0.6, 72, `rf-${raw.id}`);
  const riverLevelForecast = riverForecast(raw.peakRiverLevel, raw.dangerLevel, 72, raw.id, rising);
  const p = raw.floodProbability / 100;
  return {
    ...raw,
    rainfallForecast,
    riverLevelForecast,
    modelContributors: {
      rainfallTotal: Math.round(p * 22 + seeded(`mc-rt-${raw.id}`) * 8),
      rainfallIntensity: Math.round(p * 26 + seeded(`mc-ri-${raw.id}`) * 8),
      riverLevel: Math.round(p * 44 + seeded(`mc-rl-${raw.id}`) * 12),
      terrain: Math.round(raw.terrainRisk * 100),
      historical: Math.round(raw.historicalRisk * 100),
    },
    aiPlan: buildAiPlan(raw),
  };
}

function buildAiPlan(raw: typeof RAW_STATIONS[number]): Station['aiPlan'] {
  return {
    situationAssessment: [
      `Predicted severity: ${raw.risk.toUpperCase()} (${raw.floodProbability}% probability)`,
      `River level ${raw.peakRiverLevel.toFixed(2)} m vs danger ${raw.dangerLevel.toFixed(2)} m`,
      `72h cumulative rainfall forecast: ${raw.rainfall72h.toFixed(1)} mm`,
    ],
    immediateActions: raw.floodProbability >= 40
      ? ['Alert local disaster response teams immediately', 'Pre-position relief supplies and rescue boats', 'Activate emergency communication networks']
      : raw.floodProbability >= 25
        ? ['Alert local disaster response teams', 'Pre-position relief supplies and boats', 'Monitor river gauges every 30 minutes']
        : ['Maintain routine monitoring schedule', 'Ensure evacuation routes are clear', 'Brief local authorities on current risk level'],
    evacuationGuidance: raw.floodProbability >= 40
      ? [`Evacuate low-lying zones near ${raw.river}`, 'Move livestock and vehicles to higher ground', 'Open all designated relief shelters in district']
      : raw.floodProbability >= 25
        ? [`Issue advisory for communities within 2 km of ${raw.river}`, 'Prepare evacuation transport', 'Identify vulnerable households for priority evacuation']
        : [`No immediate evacuation required near ${raw.river}`, 'Maintain readiness for rapid deployment if level rises'],
  };
}

export function getAllStations(): Station[] {
  return RAW_STATIONS.map(buildStation).sort((a, b) => b.floodProbability - a.floodProbability);
}

export async function getStations(): Promise<Station[]> {
  await delay(600);
  return getAllStations();
}

// ============================================================================
// AI FLOOD PREDICTION ENGINE — multi-source data fusion + prediction model
// ============================================================================

/** The 10 input data sources fused by the AI prediction engine. */
export interface DataSourceMeta {
  key: string;
  label: string;
  status: 'live' | 'syncing' | 'degraded';
  /** Refresh interval in seconds. */
  interval: number;
  /** Number of sensor points / grid cells feeding in. */
  points: number;
  /** Data freshness in seconds ago. */
  lag: number;
  description: string;
}

export const DATA_SOURCES: DataSourceMeta[] = [
  { key: 'weather',       label: 'Live Weather API',         status: 'live',    interval: 300,  points: 320, lag: 42,  description: 'IMD / satellite rainfall, wind, pressure' },
  { key: 'river',         label: 'River Water Level API',    status: 'live',    interval: 600,  points: 185, lag: 88,  description: 'CWC river gauge telemetry' },
  { key: 'raingauge',     label: 'Rain Gauge Data',          status: 'live',    interval: 900,  points: 1240, lag: 120, description: 'District rain gauge network' },
  { key: 'historical',    label: 'Historical Flood Records', status: 'live',    interval: 86400, points: 4200, lag: 3600, description: '1953–2023 flood event archive' },
  { key: 'dem',           label: 'DEM (Digital Elevation)',  status: 'live',    interval: 604800, points: 1.2e6, lag: 86400, description: '30m SRTM elevation grid' },
  { key: 'terrain',       label: 'Terrain & Slope',          status: 'live',    interval: 604800, points: 1.2e6, lag: 86400, description: 'Slope & aspect from DEM' },
  { key: 'soil',          label: 'Soil Moisture',            status: 'syncing', interval: 1800, points: 980,  lag: 540,  description: 'SMAP satellite soil moisture' },
  { key: 'landuse',       label: 'Land Use / Land Cover',    status: 'live',    interval: 2592000, points: 5e5, lag: 432000, description: 'ISRO Bhuvan LULC classification' },
  { key: 'drainage',      label: 'Drainage Network',         status: 'live',    interval: 2592000, points: 8400, lag: 432000, description: 'National river & stream network' },
  { key: 'reservoir',     label: 'Reservoir Water Levels',   status: 'degraded', interval: 3600, points: 91,  lag: 2400, description: 'CWC reservoir storage telemetry' },
];

/** Capabilities the AI prediction engine continuously performs. */
export interface EngineCapability {
  key: string;
  label: string;
  description: string;
}

export const ENGINE_CAPABILITIES: EngineCapability[] = [
  { key: 'monitor',    label: 'Continuous Monitoring',   description: 'Streams weather + hydrological data 24/7' },
  { key: 'horizon',    label: '24–72H Lead Time',        description: 'Predicts flood occurrence in advance' },
  { key: 'probability',label: 'Flood Probability',       description: 'Per-location probability estimate' },
  { key: 'severity',   label: 'Flood Severity',          description: 'Depth × extent severity classification' },
  { key: 'arrival',    label: 'Flood Arrival Time',      description: 'Hours-until-inundation estimate' },
  { key: 'duration',   label: 'Flood Duration',          description: 'Expected inundation duration' },
  { key: 'extent',     label: 'Flood Extent',            description: 'Modeled water spread area' },
  { key: 'hotspots',   label: 'High-Risk Locations',     description: 'Identifies critical hotspots' },
  { key: 'confidence', label: 'Confidence Score',        description: 'Per-prediction confidence' },
];

export interface DrainageSegment {
  id: string;
  name: string;
  path: { lng: number; lat: number }[];
  order: number; // 1=river, 2=tributary, 3=stream
}

function buildDrainage(): DrainageSegment[] {
  const raw: Array<{ name: string; order: number; path: [number, number][] }> = [
    { name: 'Ganga',          order: 1, path: [[78.0,29.9],[80.2,27.2],[83.0,25.3],[85.1,25.6],[87.0,25.3],[88.4,22.6]] },
    { name: 'Yamuna',         order: 1, path: [[77.2,28.6],[78.0,27.4],[79.0,26.7],[80.1,26.4],[81.0,25.4]] },
    { name: 'Brahmaputra',    order: 1, path: [[89.5,27.5],[91.7,26.1],[93.2,26.1],[94.9,27.5],[95.5,28.0]] },
    { name: 'Kosi',           order: 2, path: [[85.0,26.7],[85.8,26.4],[86.7,25.9],[87.0,25.3]] },
    { name: 'Gandak',         order: 2, path: [[84.0,27.3],[84.6,27.0],[85.1,26.6],[85.2,25.9]] },
    { name: 'Krishna',        order: 1, path: [[74.0,17.4],[76.0,16.5],[78.5,16.2],[80.6,16.5],[81.5,15.5]] },
    { name: 'Godavari',       order: 1, path: [[73.8,19.9],[75.6,19.3],[78.0,18.5],[80.5,17.3],[82.3,16.6]] },
    { name: 'Mahanadi',       order: 1, path: [[81.5,21.6],[82.5,21.0],[83.8,20.5],[85.9,20.4],[86.5,20.2]] },
    { name: 'Musi',           order: 2, path: [[78.2,17.5],[78.5,17.4],[79.0,16.9]] },
    { name: 'Periyar',        order: 2, path: [[76.8,10.5],[76.5,10.2],[76.3,9.9]] },
    { name: 'Tapi',           order: 1, path: [[73.0,22.0],[73.5,21.5],[72.8,21.2],[72.6,20.9]] },
    { name: 'Hooghly',        order: 2, path: [[88.2,23.4],[88.3,22.9],[88.4,22.6],[88.1,22.0]] },
    { name: 'Mithi',          order: 3, path: [[72.85,19.12],[72.87,19.08],[72.88,19.05],[72.92,19.02]] },
    { name: 'Bagmati',        order: 2, path: [[85.0,26.5],[85.4,26.2],[85.5,25.9]] },
    { name: 'Daya',           order: 3, path: [[85.7,20.0],[85.8,19.9],[85.8,19.8]] },
  ];
  return raw.map((r, i) => ({
    ...r,
    id: `dr-${i}`,
    path: r.path.map(([lng, lat]) => ({ lng, lat })),
  }));
}

// ---- Enriched station with prediction-engine outputs ------------------------

export interface WeatherConditions {
  temperature: number;   // °C
  rainfall: number;      // mm/h now
  windSpeed: number;     // km/h
  humidity: number;      // %
  pressure: number;      // hPa
  cloudCover: number;    // %
}

export interface FloodConditions {
  probability: number;       // 0-100
  waterLevel: number;        // m above ground
  arrivalTime: number;       // hours from now
  duration: number;          // hours
  extent: number;            // km²
  confidence: number;        // 0-100
  evacuationLevel: 'none' | 'advisory' | 'mandatory' | 'immediate';
}

export interface EnginePrediction {
  weather: WeatherConditions;
  flood: FloodConditions;
  /** Historical flood count at this location. */
  historicalEvents: number;
  soilMoisture: number;     // %
  reservoirLevel: number;   // % capacity
  slope: number;            // degrees
}

export interface AiFloodSnapshot {
  lastUpdated: string;
  modelVersion: string;
  confidence: number;
  dataSources: DataSourceMeta[];
  capabilities: EngineCapability[];
  drainage: DrainageSegment[];
  /** Prediction horizon used for this snapshot (24/48/72h). */
  horizon: PredictionHorizon;
  /** Enriched stations with full prediction-engine outputs. */
  stationPredictions: Array<Station & {
    weather: WeatherConditions;
    flood: FloodConditions;
    historicalEvents: number;
    soilMoisture: number;
    reservoirLevel: number;
    slope: number;
  }>;
}

const STATION_CONTEXT: Record<string, { historicalEvents: number; soilMoisture: number; reservoirLevel: number; slope: number }> = {
  'st-1':  { historicalEvents: 14, soilMoisture: 88, reservoirLevel: 92, slope: 1.2 },
  'st-2':  { historicalEvents: 22, soilMoisture: 81, reservoirLevel: 78, slope: 3.5 },
  'st-3':  { historicalEvents: 18, soilMoisture: 84, reservoirLevel: 71, slope: 4.1 },
  'st-4':  { historicalEvents: 31, soilMoisture: 76, reservoirLevel: 88, slope: 0.6 },
  'st-5':  { historicalEvents: 16, soilMoisture: 79, reservoirLevel: 84, slope: 0.4 },
  'st-6':  { historicalEvents: 12, soilMoisture: 74, reservoirLevel: 69, slope: 1.8 },
  'st-7':  { historicalEvents: 27, soilMoisture: 82, reservoirLevel: 90, slope: 0.5 },
  'st-8':  { historicalEvents: 8,  soilMoisture: 68, reservoirLevel: 62, slope: 2.2 },
  'st-9':  { historicalEvents: 11, soilMoisture: 66, reservoirLevel: 74, slope: 1.5 },
  'st-10': { historicalEvents: 19, soilMoisture: 63, reservoirLevel: 81, slope: 0.9 },
  'st-11': { historicalEvents: 21, soilMoisture: 72, reservoirLevel: 76, slope: 1.1 },
  'st-12': { historicalEvents: 9,  soilMoisture: 61, reservoirLevel: 67, slope: 0.8 },
  'st-13': { historicalEvents: 24, soilMoisture: 83, reservoirLevel: 86, slope: 0.7 },
  'st-14': { historicalEvents: 20, soilMoisture: 85, reservoirLevel: 80, slope: 2.8 },
  'st-15': { historicalEvents: 6,  soilMoisture: 58, reservoirLevel: 54, slope: 3.2 },
  'st-16': { historicalEvents: 7,  soilMoisture: 60, reservoirLevel: 58, slope: 1.0 },
};

function evacLevel(p: number): FloodConditions['evacuationLevel'] {
  if (p >= 60) return 'immediate';
  if (p >= 40) return 'mandatory';
  if (p >= 20) return 'advisory';
  return 'none';
}

function buildStationPrediction(s: Station, scale = 1) {
  const ctx = STATION_CONTEXT[s.id] ?? { historicalEvents: 5, soilMoisture: 50, reservoirLevel: 60, slope: 1.0 };
  const scaledProb = Math.min(100, s.floodProbability * scale);
  const weather: WeatherConditions = {
    temperature: 24 + seeded(`temp-${s.id}`) * 8,
    rainfall: Math.max(0, s.maxHourlyRain * (0.7 + seeded(`rain-${s.id}`) * 0.6)),
    windSpeed: 12 + seeded(`wind-${s.id}`) * 30,
    humidity: 60 + Math.round(seeded(`hum-${s.id}`) * 35),
    pressure: 1002 - Math.round(seeded(`pres-${s.id}`) * 12),
    cloudCover: 40 + Math.round(seeded(`cloud-${s.id}`) * 55),
  };
  const flood: FloodConditions = {
    probability: scaledProb,
    waterLevel: Math.max(0, s.peakRiverLevel - s.dangerLevel + seeded(`wl-${s.id}`) * 0.8) * scale,
    arrivalTime: Math.max(1, Math.round(s.leadTime * (1 - (scale - 0.55) * 0.3))),
    duration: Math.round((12 + seeded(`dur-${s.id}`) * 36) * scale),
    extent: Math.round((20 + seeded(`ext-${s.id}`) * 120) * (scaledProb / 50)),
    confidence: s.confidence,
    evacuationLevel: evacLevel(scaledProb),
  };
  return {
    ...s,
    floodProbability: scaledProb,
    leadTime: Math.max(1, Math.round(s.leadTime * (1 - (scale - 0.55) * 0.3))),
    weather,
    flood,
    historicalEvents: ctx.historicalEvents,
    soilMoisture: ctx.soilMoisture,
    reservoirLevel: ctx.reservoirLevel,
    slope: ctx.slope,
  };
}

export async function getAiFloodSnapshot(horizon: PredictionHorizon = 24): Promise<AiFloodSnapshot> {
  await delay(700);
  const stations = getAllStations();
  const scale = horizonScale(horizon);
  return {
    lastUpdated: new Date().toISOString(),
    modelVersion: 'FS-AI Hydro v3.2 · Ensemble',
    confidence: 0.84,
    dataSources: DATA_SOURCES,
    capabilities: ENGINE_CAPABILITIES,
    drainage: buildDrainage(),
    stationPredictions: stations.map((s) => buildStationPrediction(s, scale)),
    horizon,
  };
}

// ---- Click-anywhere location prediction --------------------------------------

export function predictAtLocation(lat: number, lng: number): EnginePrediction {
  // Distance-weighted blend from nearest station epicenters
  const stations = getAllStations();
  let totalWeight = 0;
  let probSum = 0;
  let levelSum = 0;
  let arrivalSum = 0;
  let durSum = 0;
  let confSum = 0;
  let histSum = 0;
  let soilSum = 0;
  let resSum = 0;
  let slopeSum = 0;
  for (const s of stations) {
    const d = Math.hypot(lat - s.lat, lng - s.lng);
    const w = 1 / Math.max(0.5, d * d);
    totalWeight += w;
    probSum += s.floodProbability * w;
    levelSum += Math.max(0, s.peakRiverLevel - s.dangerLevel) * w;
    arrivalSum += s.leadTime * w;
    durSum += (12 + seeded(`dur-${s.id}`) * 36) * w;
    confSum += s.confidence * w;
    const ctx = STATION_CONTEXT[s.id] ?? { historicalEvents: 5, soilMoisture: 50, reservoirLevel: 60, slope: 1.0 };
    histSum += ctx.historicalEvents * w;
    soilSum += ctx.soilMoisture * w;
    resSum += ctx.reservoirLevel * w;
    slopeSum += ctx.slope * w;
  }
  const probability = Math.min(100, Math.max(0, probSum / totalWeight + (seeded(`p-${lat}-${lng}`) - 0.5) * 12));
  const weather: WeatherConditions = {
    temperature: 24 + seeded(`t-${lat}-${lng}`) * 10,
    rainfall: Math.max(0, (probSum / totalWeight) * 0.5 * (seeded(`r-${lat}-${lng}`) + 0.4)),
    windSpeed: 10 + seeded(`w-${lat}-${lng}`) * 35,
    humidity: 55 + Math.round(seeded(`h-${lat}-${lng}`) * 40),
    pressure: 1004 - Math.round(seeded(`pr-${lat}-${lng}`) * 14),
    cloudCover: 35 + Math.round(seeded(`c-${lat}-${lng}`) * 60),
  };
  const flood: FloodConditions = {
    probability,
    waterLevel: Math.max(0, levelSum / totalWeight + (seeded(`wl-${lat}-${lng}`) - 0.5) * 0.8),
    arrivalTime: Math.round(arrivalSum / totalWeight),
    duration: Math.round(durSum / totalWeight),
    extent: Math.round((20 + (probSum / totalWeight) * 1.2) * (probability / 50)),
    confidence: Math.round(confSum / totalWeight),
    evacuationLevel: evacLevel(probability),
  };
  return {
    weather,
    flood,
    historicalEvents: Math.round(histSum / totalWeight),
    soilMoisture: Math.round(soilSum / totalWeight),
    reservoirLevel: Math.round(resSum / totalWeight),
    slope: Number((slopeSum / totalWeight).toFixed(1)),
  };
}

