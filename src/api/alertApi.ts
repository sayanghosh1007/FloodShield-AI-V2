import type { Severity } from '@/types';
import { seededRandom } from '@/lib/utils';
import type { ActiveIncident } from '@/context/ActiveIncidentContext';
import { getFloodPrediction } from '@/api/floodPredictionApi';

/**
 * AI-powered alert system data layer.
 *
 * Generates contextual emergency alerts synchronized with the active flood
 * incident, including AI analysis, affected area details, and emergency
 * response department information.
 */

export type AlertStatus = 'active' | 'monitoring' | 'resolved';
export type AlertCategory = 'information' | 'advisory' | 'watch' | 'warning' | 'emergency' | 'critical-evacuation';

/** Routing target for the "View Alert Area" action. */
export type AlertRouteTarget = 'flood' | 'weather';

/** How the alert was generated. */
export type AlertSource = 'ai' | 'official' | 'verified';

export interface EmergencyDepartment {
  id: string;
  name: string;
  icon: string;
  contactNumber: string;
  status: 'available' | 'busy' | 'responding';
  estimatedResponseTime: string;
  areaOfResponsibility: string;
}

export interface AlertDetail {
  id: string;
  title: string;
  category: AlertCategory;
  severity: Severity;
  affectedDistrict: string;
  affectedVillages: string[];
  populationAtRisk: number;
  floodRiskLevel: string;
  predictedWaterDepth: string;
  expectedFloodArrival: string;
  estimatedDuration: string;
  aiSummary: string;
  aiReason: string;
  aiConfidence: number;
  recommendedAction: string;
  issuedAt: string;
  updatedAt: string;
  status: AlertStatus;
  region: string;
  departments: EmergencyDepartment[];
  alertType: AlertRouteTarget;
  alertTypeLabel: string;
  alertSource: AlertSource;
  isFloodLive: boolean;
  /** Geographic coordinates for flood-live alerts (used for map focus). */
  lat?: number;
  lng?: number;
  /** River name for flood-live alerts (used for incident context). */
  river?: string;
  /** State name for flood-live alerts (used for incident context). */
  state?: string;
}

export interface AlertAnalytics {
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  resolvedAlerts: number;
  populationUnderAlert: number;
  districtsAffected: number;
  averageAiConfidence: number;
  notificationsDelivered: number;
}

export interface AlertSnapshot {
  alerts: AlertDetail[];
  analytics: AlertAnalytics;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const DEPARTMENT_TEMPLATES: Omit<EmergencyDepartment, 'id' | 'status' | 'estimatedResponseTime'>[] = [
  { name: 'Emergency Medical Services (EMS)', icon: 'Truck', contactNumber: '108', areaOfResponsibility: 'Medical rescue, ambulance dispatch, field triage' },
  { name: 'Fire & Emergency Services', icon: 'Flame', contactNumber: '101', areaOfResponsibility: 'Rescue operations, floodwater extraction, structural safety' },
  { name: 'Police Control Room', icon: 'Shield', contactNumber: '100', areaOfResponsibility: 'Law enforcement, crowd control, traffic management, security' },
  { name: 'Flood Rescue & Boat Operations', icon: 'Ship', contactNumber: '1070', areaOfResponsibility: 'Boat rescue, water evacuation, marooned person extraction' },
  { name: 'NDRF / SDRF Disaster Response', icon: 'LifeBuoy', contactNumber: '1077', areaOfResponsibility: 'Specialized flood rescue, deep-water operations, relief camps' },
  { name: 'Power & Utility Emergency Services', icon: 'Zap', contactNumber: '1912', areaOfResponsibility: 'Electrical safety, power line isolation, utility restoration' },
  { name: 'Public Works & Road Clearance', icon: 'Construction', contactNumber: '1800-180-1551', areaOfResponsibility: 'Road clearing, bridge inspection, debris removal' },
  { name: 'Shelter Management & Relief Coordination', icon: 'Tent', contactNumber: '1077', areaOfResponsibility: 'Relief camp operations, food/water supply, shelter allocation' },
];

const DEPT_STATUSES: EmergencyDepartment['status'][] = ['available', 'busy', 'responding'];
const RESPONSE_TIMES = ['8–12 min', '10–15 min', '15–25 min', '20–30 min', '5–8 min'];

function buildDepartments(seed: string): EmergencyDepartment[] {
  return DEPARTMENT_TEMPLATES.map((d, i) => {
    const r = seededRandom(`${seed}-dept-${i}`);
    return {
      ...d,
      id: `dept-${i}`,
      status: DEPT_STATUSES[Math.floor(r * DEPT_STATUSES.length)],
      estimatedResponseTime: RESPONSE_TIMES[Math.floor(seededRandom(`${seed}-resp-${i}`) * RESPONSE_TIMES.length)],
    };
  });
}

const VILLAGE_POOL = [
  'Maner', 'Bakhtiarpur', 'Khagaul', 'Begusarai', 'Fatwah', 'Danapur',
  'Bihta', 'Mokama', 'Barh', 'Bakhtiarpur', 'Sonepur', 'Patna Rural',
  'Mangalagiri', 'Tadepalle', 'Pedakakani', 'Undavalli', 'Prathipadu',
  'Dispur', 'Azara', 'Beltola', 'Garchuk', 'Chandrapur', 'Khanapara',
];

function pickVillages(seed: string, count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(seededRandom(`${seed}-village-${i}`) * VILLAGE_POOL.length);
    const v = VILLAGE_POOL[idx];
    if (!result.includes(v)) result.push(v);
  }
  return result;
}

interface AlertSeed {
  id: string;
  title: string;
  category: AlertCategory;
  severity: Severity;
  district: string;
  region: string;
  populationAtRisk: number;
  floodRiskLevel: string;
  predictedWaterDepth: string;
  expectedFloodArrival: string;
  estimatedDuration: string;
  aiSummary: string;
  aiReason: string;
  aiConfidence: number;
  recommendedAction: string;
  issuedMinAgo: number;
  updatedMinAgo: number;
  status: AlertStatus;
  alertTypeLabel: string;
  alertSource: AlertSource;
  isFloodLive?: boolean;
  lat?: number;
  lng?: number;
  river?: string;
  state?: string;
}

const ALERT_SEEDS: AlertSeed[] = [
  {
    id: 'AL-204',
    title: 'Flood Warning — Ganga Overtopping',
    category: 'warning',
    severity: 'critical',
    district: 'Patna',
    region: 'Ganga floodplain — Patna',
    populationAtRisk: 184000,
    floodRiskLevel: 'Extreme',
    predictedWaterDepth: '2.4 m above ground',
    expectedFloodArrival: 'Within 6 hours',
    estimatedDuration: '48–72 hours',
    aiSummary: 'The AI predicts severe flooding within the next 6 hours due to continuous rainfall and the Ganga river exceeding its danger level of 50.45 m. Immediate evacuation is recommended for low-lying sectors A2–A5 and riverside settlements.',
    aiReason: 'River gauge telemetry shows the Ganga at 50.52 m and rising at 0.011 m/h. Combined with 88 mm cumulative rainfall and saturated soil moisture (76%), the hydrological model forecasts overtopping at Gandhi Ghat within 6 hours with 96% confidence.',
    aiConfidence: 96,
    recommendedAction: 'Initiate immediate evacuation of low-lying areas. Deploy NDRF boat teams to Sectors A2–A5. Open all designated relief shelters in Patna district.',
    issuedMinAgo: 3,
    updatedMinAgo: 1,
    status: 'active',
    alertTypeLabel: 'Flood Warning',
    alertSource: 'verified',
    lat: 25.61, lng: 85.14, river: 'Ganga', state: 'Bihar',
  },
  {
    id: 'AL-203',
    title: 'Critical Evacuation — Koshi Embankment Breach',
    category: 'critical-evacuation',
    severity: 'critical',
    district: 'Bhagalpur',
    region: 'Kosi flood area',
    populationAtRisk: 96000,
    floodRiskLevel: 'Extreme',
    predictedWaterDepth: '1.8 m above ground',
    expectedFloodArrival: 'Flooding in progress',
    estimatedDuration: '72+ hours',
    aiSummary: 'Active embankment breach on the Koshi river has inundated multiple villages. Water depth is increasing rapidly. All residents in the breach zone must evacuate immediately to designated high-ground shelters.',
    aiReason: 'SDRF field teams confirm a 40-meter breach in the eastern embankment. Inundation modeling predicts water spread of 16 km radius affecting 9 villages. River discharge is 2.3x normal monsoon levels.',
    aiConfidence: 94,
    recommendedAction: 'Mandatory evacuation of all villages within 16 km of the breach. Deploy boat rescue teams immediately. Coordinate with NDRF for deep-water extraction of marooned residents.',
    issuedMinAgo: 9,
    updatedMinAgo: 2,
    status: 'active',
    alertTypeLabel: 'Mandatory Evacuation',
    alertSource: 'verified',
    lat: 25.24, lng: 86.98, river: 'Koshi', state: 'Bihar',
  },
  {
    id: 'AL-201',
    title: 'Flood Watch — Brahmaputra Above Danger Level',
    category: 'watch',
    severity: 'warning',
    district: 'Kamrup (Guwahati)',
    region: 'Brahmaputra valley',
    populationAtRisk: 67000,
    floodRiskLevel: 'High',
    predictedWaterDepth: '1.5 m above ground',
    expectedFloodArrival: 'Within 12 hours',
    estimatedDuration: '36–48 hours',
    aiSummary: 'The Brahmaputra is flowing above the danger mark and rising. The AI model predicts riverside flooding in Guwahati within 12 hours. Precautionary evacuation of riverside settlements is advised.',
    aiReason: 'CWC Brahmaputra gauge records water level at 49.2 m against a danger level of 46.0 m, rising at 0.011 m/h. Rainfall forecast of 64 mm in 72h and terrain slope risk of 0.61 contribute to the prediction.',
    aiConfidence: 89,
    recommendedAction: 'Issue evacuation advisory for riverside colonies. Pre-position rescue boats at key ghats. Monitor embankment integrity every 30 minutes.',
    issuedMinAgo: 14,
    updatedMinAgo: 4,
    status: 'active',
    alertTypeLabel: 'Flood Watch',
    alertSource: 'verified',
    lat: 26.14, lng: 91.74, river: 'Brahmaputra', state: 'Assam',
  },
  {
    id: 'AL-198',
    title: 'Heavy Rainfall Advisory — 24h Forecast',
    category: 'advisory',
    severity: 'advisory',
    district: 'Muzaffarpur',
    region: 'Gandak plains',
    populationAtRisk: 73000,
    floodRiskLevel: 'Moderate',
    predictedWaterDepth: '0.8–1.2 m in low-lying areas',
    expectedFloodArrival: 'Within 24 hours',
    estimatedDuration: '18–30 hours',
    aiSummary: 'The AI forecasts cumulative rainfall exceeding 58 mm over the next 24 hours for Muzaffarpur district. The Bagmati river is in spate. Agricultural flooding is likely in low-lying zones.',
    aiReason: 'Bagmati river level at 52.3 m against danger level of 50.0 m, rising at 0.014 m/h. Soil moisture at 83% indicates high runoff potential. Historical flood frequency of 24 events at this location.',
    aiConfidence: 83,
    recommendedAction: 'Alert local disaster response teams. Prepare evacuation transport for vulnerable households. Brief district authorities on current risk trajectory.',
    issuedMinAgo: 25,
    updatedMinAgo: 10,
    status: 'active',
    alertTypeLabel: 'Heavy Rainfall',
    alertSource: 'ai',
    lat: 26.12, lng: 85.39, river: 'Bagmati', state: 'Bihar',
  },
  {
    id: 'AL-195',
    title: 'Reservoir Watch — Near Spillway Capacity',
    category: 'watch',
    severity: 'watch',
    district: 'Krishna (AP)',
    region: 'Krishna delta',
    populationAtRisk: 89000,
    floodRiskLevel: 'Moderate',
    predictedWaterDepth: '1.0–1.5 m in delta zones',
    expectedFloodArrival: 'Within 18 hours',
    estimatedDuration: '24–36 hours',
    aiSummary: 'Budameru stream is overflowing and reservoir levels are approaching spillway capacity. The AI model predicts low-lying area submersion in the Krishna delta within 18 hours if release continues.',
    aiReason: 'Reservoir at 92% capacity with controlled release initiated. Budameru overflow confirmed by AP State Disaster Authority. Rainfall forecast of 35 mm supports continued inflow.',
    aiConfidence: 82,
    recommendedAction: 'Monitor reservoir release rates. Prepare downstream evacuation plan. Coordinate with irrigation department on controlled release scheduling.',
    issuedMinAgo: 40,
    updatedMinAgo: 15,
    status: 'monitoring',
    alertTypeLabel: 'Dam Overflow',
    alertSource: 'official',
    lat: 16.51, lng: 80.65, river: 'Budameru', state: 'Andhra Pradesh',
  },
  {
    id: 'AL-190',
    title: 'Information — Sensor Maintenance Complete',
    category: 'information',
    severity: 'info',
    district: 'Surat',
    region: 'Tapti basin',
    populationAtRisk: 0,
    floodRiskLevel: 'Low',
    predictedWaterDepth: 'N/A',
    expectedFloodArrival: 'N/A',
    estimatedDuration: 'N/A',
    aiSummary: 'Calibration cycle complete on Tapi river gauge station. Telemetry stream restored to nominal. All sensor channels reporting within expected parameters.',
    aiReason: 'Routine maintenance window completed. No flood risk change detected. River levels remain stable at 3.9 m, well below the 9.0 m danger level.',
    aiConfidence: 71,
    recommendedAction: 'Resume normal monitoring schedule. No action required.',
    issuedMinAgo: 120,
    updatedMinAgo: 118,
    status: 'resolved',
    alertTypeLabel: 'Infrastructure Damage',
    alertSource: 'official',
    lat: 21.17, lng: 72.83, river: 'Tapi', state: 'Gujarat',
  },
  {
    id: 'AL-188',
    title: 'Flood Warning — Tapi Riverine Flooding',
    category: 'warning',
    severity: 'warning',
    district: 'Surat',
    region: 'Tapti basin',
    populationAtRisk: 12000,
    floodRiskLevel: 'High',
    predictedWaterDepth: '0.9 m above ground',
    expectedFloodArrival: 'Within 8 hours',
    estimatedDuration: '12–24 hours',
    aiSummary: 'The AI predicts riverine flooding along the Tapi within 8 hours. Water levels are approaching the danger mark. Riverside industrial and residential areas should prepare for evacuation.',
    aiReason: 'Tapi river at 9.3 m against danger level of 9.0 m. Gujarat SDMA reports active flooding in low-lying sectors. Reservoir at 74% capacity with inflow continuing.',
    aiConfidence: 79,
    recommendedAction: 'Issue evacuation advisory for riverside areas. Pre-position rescue teams. Alert industrial units along the riverbank to activate flood protocols.',
    issuedMinAgo: 55,
    updatedMinAgo: 20,
    status: 'active',
    alertTypeLabel: 'River Overflow',
    alertSource: 'verified',
    lat: 21.17, lng: 72.83, river: 'Tapi', state: 'Gujarat',
  },
];

function classifyAlertType(title: string): AlertRouteTarget {
  const t = title.toLowerCase();
  const weatherKeywords = ['rainfall', 'cloudburst', 'precipitation', 'cyclone', 'storm'];
  return weatherKeywords.some((k) => t.includes(k)) ? 'weather' : 'flood';
}

function buildAlertFromSeed(seed: AlertSeed): AlertDetail {
  const now = Date.now();
  return {
    id: seed.id,
    title: seed.title,
    category: seed.category,
    severity: seed.severity,
    affectedDistrict: seed.district,
    affectedVillages: seed.populationAtRisk > 0
      ? pickVillages(seed.id, Math.min(6, Math.max(3, Math.floor(seed.populationAtRisk / 20000))))
      : [],
    populationAtRisk: seed.populationAtRisk,
    floodRiskLevel: seed.floodRiskLevel,
    predictedWaterDepth: seed.predictedWaterDepth,
    expectedFloodArrival: seed.expectedFloodArrival,
    estimatedDuration: seed.estimatedDuration,
    aiSummary: seed.aiSummary,
    aiReason: seed.aiReason,
    aiConfidence: seed.aiConfidence,
    recommendedAction: seed.recommendedAction,
    issuedAt: new Date(now - seed.issuedMinAgo * 60_000).toISOString(),
    updatedAt: new Date(now - seed.updatedMinAgo * 60_000).toISOString(),
    status: seed.status,
    region: seed.region,
    departments: buildDepartments(seed.id),
    alertType: classifyAlertType(seed.title),
    alertTypeLabel: seed.alertTypeLabel,
    alertSource: seed.alertSource,
    isFloodLive: seed.isFloodLive ?? false,
    lat: seed.lat,
    lng: seed.lng,
    river: seed.river,
    state: seed.state,
  };
}

function computeAnalytics(alerts: AlertDetail[]): AlertAnalytics {
  const active = alerts.filter((a) => a.status === 'active');
  const monitoring = alerts.filter((a) => a.status === 'monitoring');
  const resolved = alerts.filter((a) => a.status === 'resolved');
  const critical = alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved');
  const warning = alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved');
  const population = alerts
    .filter((a) => a.status !== 'resolved')
    .reduce((sum, a) => sum + a.populationAtRisk, 0);
  const districts = new Set(alerts.filter((a) => a.status !== 'resolved').map((a) => a.affectedDistrict));
  const activeOrMonitoring = [...active, ...monitoring];
  const avgConfidence = activeOrMonitoring.length > 0
    ? Math.round(activeOrMonitoring.reduce((s, a) => s + a.aiConfidence, 0) / activeOrMonitoring.length)
    : 0;

  return {
    activeAlerts: active.length + monitoring.length,
    criticalAlerts: critical.length,
    warningAlerts: warning.length,
    resolvedAlerts: resolved.length,
    populationUnderAlert: population,
    districtsAffected: districts.size,
    averageAiConfidence: avgConfidence,
    notificationsDelivered: alerts.reduce((s, a) => s + Math.floor(a.populationAtRisk / 500) + 12, 0),
  };
}

export async function getAlertSnapshot(incident: ActiveIncident | null): Promise<AlertSnapshot> {
  await delay(600);

  let alerts = ALERT_SEEDS.map(buildAlertFromSeed);

  // Add Flood Live alerts from flood prediction data
  const liveAlerts = await generateFloodLiveAlerts();
  alerts = [...liveAlerts, ...alerts];

  if (incident) {
    // Filter alerts relevant to the selected flood area by matching region/state keywords
    const incidentKeywords = [
      incident.name.toLowerCase(),
      incident.state.toLowerCase(),
      incident.river.toLowerCase(),
    ];

    alerts = alerts.filter((a) => {
      const alertText = `${a.region} ${a.affectedDistrict} ${a.title}`.toLowerCase();
      return incidentKeywords.some((kw) => kw.length > 2 && alertText.includes(kw));
    });

    // If no alerts match, generate a contextual alert for the selected incident
    if (alerts.length === 0) {
      const generated = generateAlertForIncident(incident);
      alerts = [generated];
    }
  }

  alerts.sort((a, b) => {
    const rank = { critical: 0, warning: 1, watch: 2, advisory: 3, info: 4 };
    const sevDiff = (rank[a.severity] ?? 5) - (rank[b.severity] ?? 5);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });

  return {
    alerts,
    analytics: computeAnalytics(alerts),
  };
}

function generateAlertForIncident(incident: ActiveIncident): AlertDetail {
  const now = Date.now();
  const isCritical = incident.floodProbability >= 50;
  const isWarning = incident.floodProbability >= 30;
  const severity: Severity = isCritical ? 'critical' : isWarning ? 'warning' : 'watch';
  const category: AlertCategory = isCritical ? 'critical-evacuation' : isWarning ? 'warning' : 'watch';
  const riskLevel = isCritical ? 'Extreme' : isWarning ? 'High' : 'Moderate';
  const pop = Math.round(20000 + seededRandom(incident.id) * 180000);

  return {
    id: `AL-${Math.floor(200 + seededRandom(incident.id) * 100)}`,
    title: `${isCritical ? 'Critical Evacuation' : isWarning ? 'Flood Warning' : 'Flood Watch'} — ${incident.name}`,
    category,
    severity,
    affectedDistrict: incident.name.split('—')[0].trim(),
    affectedVillages: pickVillages(incident.id, 4),
    populationAtRisk: pop,
    floodRiskLevel: riskLevel,
    predictedWaterDepth: isCritical ? '2.0+ m above ground' : isWarning ? '1.0–1.5 m above ground' : '0.5–1.0 m in low-lying areas',
    expectedFloodArrival: isCritical ? 'Within 8 hours' : 'Within 24 hours',
    estimatedDuration: isCritical ? '48–72 hours' : '24–36 hours',
    aiSummary: `The AI predicts ${isCritical ? 'severe' : 'significant'} flooding at ${incident.name} due to rising ${incident.river} levels and continued rainfall. ${isCritical ? 'Immediate evacuation is recommended.' : 'Precautionary measures are advised.'}`,
    aiReason: `Flood probability at ${incident.floodProbability}% with risk tier "${incident.riskTier}". The ${incident.river} basin shows elevated hydrological indicators. AI confidence based on multi-source data fusion including river gauges, rainfall forecasts, and terrain analysis.`,
    aiConfidence: Math.min(98, 70 + Math.round(seededRandom(incident.id + 'conf') * 28)),
    recommendedAction: isCritical
      ? `Initiate immediate evacuation near ${incident.river}. Deploy NDRF/SDRF teams. Open all relief shelters in ${incident.state}.`
      : `Issue evacuation advisory for communities near ${incident.river}. Pre-position rescue equipment. Monitor river levels every 30 minutes.`,
    issuedAt: new Date(now - 2 * 60_000).toISOString(),
    updatedAt: new Date(now - 1 * 60_000).toISOString(),
    status: 'active',
    region: incident.name,
    departments: buildDepartments(incident.id),
    alertType: 'flood',
    alertTypeLabel: isCritical ? 'Mandatory Evacuation' : isWarning ? 'Flood Warning' : 'Flood Watch',
    alertSource: 'ai',
    isFloodLive: false,
    lat: incident.lat,
    lng: incident.lng,
    river: incident.river,
    state: incident.state,
  };
}

async function generateFloodLiveAlerts(): Promise<AlertDetail[]> {
  try {
    const prediction = await getFloodPrediction();
    const now = Date.now();
    return (prediction.liveFloods ?? []).map((f, i) => {
      const sev: Severity = f.tier === 'extreme' ? 'critical' : f.tier === 'high' ? 'warning' : 'watch';
      const cat: AlertCategory = sev === 'critical' ? 'critical-evacuation' : sev === 'warning' ? 'warning' : 'watch';
      return {
        id: `FL-${String(300 + i).padStart(3, '0')}`,
        title: `Flood Live — ${f.name}`,
        category: cat,
        severity: sev,
        affectedDistrict: f.name.split('—')[0].trim(),
        affectedVillages: [],
        populationAtRisk: f.affected,
        floodRiskLevel: f.tier.charAt(0).toUpperCase() + f.tier.slice(1),
        predictedWaterDepth: `${f.depth}m`,
        expectedFloodArrival: 'Ongoing',
        estimatedDuration: 'Active',
        aiSummary: `Live flood event at ${f.name}. Current water depth: ${f.depth}m. Source: ${f.source}. Affected population: ${f.affected.toLocaleString()}.`,
        aiReason: `Real-time monitoring confirms active flooding at ${f.name}. Data sourced from ${f.source}. Continuous monitoring in effect.`,
        aiConfidence: 95,
        recommendedAction: `Monitor flood progression at ${f.name}. Deploy rescue teams. Maintain evacuation protocols.`,
        issuedAt: f.since,
        updatedAt: new Date(now - Math.floor(seededRandom(f.id + 'live') * 10) * 60_000).toISOString(),
        status: 'active',
        region: f.name,
        departments: buildDepartments(f.id),
        alertType: 'flood',
        alertTypeLabel: 'Flood Live',
        alertSource: 'verified',
        isFloodLive: true,
        lat: f.lat,
        lng: f.lng,
        river: f.river,
        state: f.state,
      };
    });
  } catch {
    return [];
  }
}
